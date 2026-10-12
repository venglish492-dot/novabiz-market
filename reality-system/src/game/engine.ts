/**
 * Progression engine.
 *
 * Every state-changing progression action runs inside ONE IndexedDB
 * transaction that updates the domain record (completion, focus session,
 * goal…), appends XP ledger entries, records activity and evaluates
 * achievements. Either all of it is saved or none of it is — so an
 * interrupted animation or a page reload can never leave XP half-awarded.
 *
 * Idempotency:
 *  - quest occurrences: the completion primary key is `${questId}::${occurrence}`
 *  - focus sessions: the session id comes from the timer and is checked first
 *  - achievements: the unlock primary key is the achievement id
 *  - reversals: the reversal ledger id is derived from the original entry id
 * UI code never edits XP directly; it only calls these functions.
 */
import { getDb, type RealityDB } from '@/db/database'
import { loadProfile, loadRules, loadSettings, saveProfile } from '@/db/config'
import type {
  ActivityEvent,
  AppNotification,
  Completion,
  FocusPhase,
  FocusMode,
  Quest,
  XpEntry,
  XpSource,
} from '@/domain/schemas'
import { logicalDateKey } from '@/lib/dates'
import { newId } from '@/lib/id'
import { ACHIEVEMENTS, isAchieved, type AchievementDef } from './achievements'
import { describeTransition, levelInfo, rankForLevel, type LevelTransition } from './levels'
import { sumLedger, attributeTotals } from './progress'
import { applyDailyCap, focusXp, questBaseXp, type GameRules } from './rules'
import { computeStats, type Stats } from './stats'
import { completionId, ONCE } from '@/quests/recurrence'
import { DEFAULT_SKILL_NODES, evaluateNode } from './skilltree'

export interface ProgressionResult {
  xpAwarded: number
  capped: boolean
  transition: LevelTransition
  achievements: AchievementDef[]
  alreadyDone: boolean
  message?: string
}

export class ProgressionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProgressionError'
  }
}

/* ------------------------------------------------------------------ */
/* Internal helpers (must be called inside a transaction)             */
/* ------------------------------------------------------------------ */

interface TxContext {
  db: RealityDB
  rules: GameRules
  now: Date
  nowIso: string
  today: string
}

async function context(db: RealityDB, now = new Date()): Promise<TxContext> {
  const [rules, settings] = await Promise.all([loadRules(), loadSettings()])
  return { db, rules, now, nowIso: now.toISOString(), today: logicalDateKey(now, settings.general.resetHour) }
}

async function ledgerTotal(db: RealityDB): Promise<number> {
  return sumLedger(await db.ledger.toArray())
}

function activity(ctx: TxContext, partial: Omit<ActivityEvent, 'id' | 'createdAt' | 'dateKey'>): ActivityEvent {
  return { id: newId('act'), createdAt: ctx.nowIso, dateKey: ctx.today, ...partial }
}

async function notify(ctx: TxContext, kind: AppNotification['kind'], title: string, body: string): Promise<void> {
  await ctx.db.notifications.add({ id: newId('ntf'), kind, title, body, createdAt: ctx.nowIso, read: false })
}

async function addLedger(
  ctx: TxContext,
  source: XpSource,
  amount: number,
  refId: string,
  title: string,
  attributes: Record<string, number>,
  categoryId: string | null,
): Promise<XpEntry> {
  const entry: XpEntry = {
    id: `${source}:${newId()}`,
    amount: Math.round(amount),
    source,
    refId,
    title,
    attributes,
    categoryId,
    createdAt: ctx.nowIso,
    dateKey: ctx.today,
    reversesId: null,
  }
  await ctx.db.ledger.add(entry)
  return entry
}

/** Appends a reversal for a ledger entry. Reversing twice is impossible (deterministic id). */
async function reverseLedger(ctx: TxContext, entryId: string, reason: string): Promise<number> {
  const original = await ctx.db.ledger.get(entryId)
  if (!original) return 0
  const reversalId = `reversal:${original.id}`
  if (await ctx.db.ledger.get(reversalId)) return 0
  const attributes: Record<string, number> = {}
  for (const [k, v] of Object.entries(original.attributes)) attributes[k] = -v
  await ctx.db.ledger.add({
    id: reversalId,
    amount: -original.amount,
    source: 'reversal',
    refId: original.refId,
    title: `${reason}: ${original.title}`,
    attributes,
    categoryId: original.categoryId,
    createdAt: ctx.nowIso,
    // Dated on the original day so daily totals and the daily cap net out correctly.
    dateKey: original.dateKey,
    reversesId: original.id,
  })
  return original.amount
}

async function questXpEarnedOn(ctx: TxContext, dateKey: string): Promise<number> {
  const entries = await ctx.db.ledger.where('dateKey').equals(dateKey).toArray()
  let total = 0
  for (const e of entries) {
    if (e.source === 'quest') total += e.amount
    else if (e.source === 'reversal' && e.reversesId?.startsWith('quest:')) total += e.amount
  }
  return total
}

export async function gatherStats(db: RealityDB, rules: GameRules): Promise<Stats> {
  const [profile, completions, focusSessions, goals, milestones, ledger, skillUnlocks] = await Promise.all([
    loadProfile(),
    db.completions.toArray(),
    db.focusSessions.toArray(),
    db.goals.toArray(),
    db.milestones.toArray(),
    db.ledger.toArray(),
    db.skillUnlocks.count(),
  ])
  const totalXp = sumLedger(ledger)
  const level = levelInfo(totalXp, rules).level
  return computeStats({
    onboardingComplete: profile.onboardingComplete,
    completions,
    focusSessions,
    goals,
    milestones,
    totalXp,
    level,
    rankIndex: rankForLevel(level, rules.ranks).index,
    skillUnlocks,
    visitedViews: profile.visitedViews.length,
  })
}

/**
 * Unlocks every newly satisfied achievement. Achievement XP can itself cause
 * a level-up that satisfies another achievement, so evaluation repeats
 * (bounded) until nothing new unlocks.
 */
async function evaluateAchievements(ctx: TxContext): Promise<AchievementDef[]> {
  const unlocked: AchievementDef[] = []
  for (let pass = 0; pass < 4; pass++) {
    const stats = await gatherStats(ctx.db, ctx.rules)
    const existing = new Set((await ctx.db.achievements.toArray()).map((a) => a.id))
    const fresh = ACHIEVEMENTS.filter((a) => !existing.has(a.id) && isAchieved(a, stats))
    if (fresh.length === 0) break
    for (const def of fresh) {
      const xp = ctx.rules.achievementXpEnabled ? def.xp : 0
      await ctx.db.achievements.add({ id: def.id, unlockedAt: ctx.nowIso, xpAwarded: xp })
      if (xp > 0) await addLedger(ctx, 'achievement', xp, def.id, `Achievement: ${def.name}`, {}, null)
      await ctx.db.activity.add(activity(ctx, { type: 'achievement', title: def.name, refId: def.id, categoryId: null, xp }))
      await notify(ctx, 'achievement', `Achievement unlocked: ${def.name}`, def.description)
      unlocked.push(def)
    }
  }
  return unlocked
}

/** Shared tail of every award: achievements, level/rank events and notifications. */
async function finalize(ctx: TxContext, totalBefore: number, xpAwarded: number, capped: boolean): Promise<ProgressionResult> {
  const achievements = await evaluateAchievements(ctx)
  const totalAfter = await ledgerTotal(ctx.db)
  const transition = describeTransition(totalBefore, totalAfter, ctx.rules)
  if (transition.levelsGained > 0) {
    await ctx.db.activity.add(
      activity(ctx, { type: 'level-up', title: `Reached level ${transition.levelAfter}`, refId: null, categoryId: null, xp: 0 }),
    )
    await notify(ctx, 'level-up', `Level ${transition.levelAfter}`, `You advanced from level ${transition.levelBefore} to ${transition.levelAfter}.`)
  }
  if (transition.rankChanged) {
    await ctx.db.activity.add(
      activity(ctx, {
        type: 'rank-up',
        title: `Rank ${transition.rankAfter.label} — ${transition.rankAfter.title}`,
        refId: transition.rankAfter.id,
        categoryId: null,
        xp: 0,
      }),
    )
    await notify(ctx, 'rank-up', `Rank up: ${transition.rankAfter.label}`, transition.rankAfter.description)
  }
  return { xpAwarded, capped, transition, achievements, alreadyDone: false }
}

function noop(rules: GameRules, total: number, message?: string): ProgressionResult {
  return { xpAwarded: 0, capped: false, transition: describeTransition(total, total, rules), achievements: [], alreadyDone: true, message }
}

/* ------------------------------------------------------------------ */
/* Quests                                                             */
/* ------------------------------------------------------------------ */

async function completeQuestInTx(ctx: TxContext, quest: Quest, occurrenceKey: string): Promise<{ xp: number; capped: boolean } | null> {
  const cid = completionId(quest.id, occurrenceKey)
  if (await ctx.db.completions.get(cid)) return null

  const base = questBaseXp(ctx.rules, quest)
  const earned = await questXpEarnedOn(ctx, ctx.today)
  const { amount, capped } = applyDailyCap(ctx.rules, base, earned)

  const attributes: Record<string, number> = {}
  if (amount > 0) {
    attributes[quest.attributeId] = amount
    const recurring = occurrenceKey !== ONCE || quest.type === 'routine'
    const share = Math.round(amount * ctx.rules.disciplineShare)
    if (recurring && share > 0) {
      const d = ctx.rules.disciplineAttributeId
      attributes[d] = (attributes[d] ?? 0) + share
    }
  }

  const completionKey = newId('cmp')
  const entry = await addLedger(ctx, 'quest', amount, cid, quest.title, attributes, quest.categoryId)
  const completion: Completion = {
    id: cid,
    completionId: completionKey,
    questId: quest.id,
    occurrenceKey,
    dateKey: ctx.today,
    completedAt: ctx.nowIso,
    xpAwarded: amount,
    xpCapped: capped,
    ledgerId: entry.id,
    title: quest.title,
    categoryId: quest.categoryId,
    attributeId: quest.attributeId,
  }
  await ctx.db.completions.add(completion)

  if (quest.recurrence.kind === 'none') {
    await ctx.db.quests.update(quest.id, { status: 'completed', completedAt: ctx.nowIso, updatedAt: ctx.nowIso })
  }
  await ctx.db.activity.add(
    activity(ctx, { type: 'quest-completed', title: quest.title, refId: quest.id, categoryId: quest.categoryId, xp: amount }),
  )
  if (capped) {
    await notify(ctx, 'warning', 'Daily XP limit reached', `"${quest.title}" was recorded. The daily quest XP limit (${ctx.rules.dailyQuestXpCap} XP) capped its reward.`)
  }

  // A milestone whose linked one-time quests are all complete is completed automatically.
  if (quest.milestoneId && quest.recurrence.kind === 'none') {
    const milestone = await ctx.db.milestones.get(quest.milestoneId)
    if (milestone && !milestone.done) {
      const linked = (await ctx.db.quests.where('milestoneId').equals(milestone.id).toArray()).filter((q) => q.status !== 'archived')
      if (linked.length > 0 && linked.every((q) => q.id === quest.id || q.status === 'completed')) {
        await completeMilestoneInTx(ctx, milestone.id)
      }
    }
  }
  return { xp: amount, capped }
}

export async function completeQuest(questId: string, occurrenceKey: string, now = new Date()): Promise<ProgressionResult> {
  const db = getDb()
  return db.transaction('rw', db.tables, async () => {
    const ctx = await context(db, now)
    const quest = await db.quests.get(questId)
    if (!quest) throw new ProgressionError('This quest no longer exists.')
    if (quest.status === 'archived') throw new ProgressionError('Archived quests cannot be completed. Restore it first.')
    const totalBefore = await ledgerTotal(db)
    const res = await completeQuestInTx(ctx, quest, occurrenceKey)
    if (!res) return noop(ctx.rules, totalBefore, 'Already completed.')
    return finalize(ctx, totalBefore, res.xp, res.capped)
  })
}

/**
 * Undo a completion. The original XP stays in the ledger and a reversal entry
 * is appended, so history remains explainable. Achievements already earned are kept.
 */
export async function undoCompletion(questId: string, occurrenceKey: string, now = new Date()): Promise<{ xpReversed: number }> {
  const db = getDb()
  return db.transaction('rw', db.tables, async () => {
    const ctx = await context(db, now)
    const cid = completionId(questId, occurrenceKey)
    const completion = await db.completions.get(cid)
    if (!completion) return { xpReversed: 0 }
    const reversed = await reverseLedger(ctx, completion.ledgerId, 'Undo')
    await db.completions.delete(cid)
    const quest = await db.quests.get(questId)
    if (quest && quest.recurrence.kind === 'none' && quest.status === 'completed') {
      await db.quests.update(questId, { status: 'active', completedAt: null, updatedAt: ctx.nowIso })
    }
    await db.activity.add(
      activity(ctx, { type: 'quest-undone', title: completion.title, refId: questId, categoryId: completion.categoryId, xp: -reversed }),
    )
    return { xpReversed: reversed }
  })
}

/* ------------------------------------------------------------------ */
/* Focus sessions                                                     */
/* ------------------------------------------------------------------ */

export interface FocusRecordInput {
  sessionId: string
  mode: FocusMode
  phase: FocusPhase
  plannedSeconds: number
  actualSeconds: number
  startedAtMs: number
  status: 'completed' | 'canceled'
  questId: string | null
  occurrenceKey: string | null
}

export interface FocusResult extends ProgressionResult {
  focusXp: number
  questCompleted: boolean
}

/**
 * Records a finished or cancelled timer phase.
 * Cancelled sessions are stored for history but never award XP.
 */
export async function recordFocusSession(input: FocusRecordInput, now = new Date()): Promise<FocusResult> {
  const db = getDb()
  return db.transaction('rw', db.tables, async () => {
    const ctx = await context(db, now)
    const totalBefore = await ledgerTotal(db)
    if (await db.focusSessions.get(input.sessionId)) {
      return { ...noop(ctx.rules, totalBefore, 'Session already recorded.'), focusXp: 0, questCompleted: false }
    }
    const qualifies = input.status === 'completed' && input.phase === 'focus'
    const xp = qualifies ? focusXp(ctx.rules, input.actualSeconds) : 0
    let ledgerId: string | null = null
    if (xp > 0) {
      const entry = await addLedger(ctx, 'focus', xp, input.sessionId, `Focus session (${input.mode})`, { [ctx.rules.focus.attributeId]: xp }, null)
      ledgerId = entry.id
    }
    await db.focusSessions.add({
      id: input.sessionId,
      mode: input.mode,
      phase: input.phase,
      plannedSeconds: input.plannedSeconds,
      actualSeconds: Math.max(0, Math.round(input.actualSeconds)),
      startedAt: new Date(input.startedAtMs).toISOString(),
      endedAt: ctx.nowIso,
      status: input.status,
      questId: input.questId,
      occurrenceKey: input.occurrenceKey,
      xpAwarded: xp,
      ledgerId,
      dateKey: ctx.today,
    })
    if (qualifies) {
      await db.activity.add(
        activity(ctx, {
          type: 'focus-completed',
          title: `${Math.floor(input.actualSeconds / 60)} min ${input.mode} focus`,
          refId: input.sessionId,
          categoryId: null,
          xp,
        }),
      )
    }

    // A linked timed quest completes when the session reaches its required duration.
    let questCompleted = false
    let questXp = 0
    let capped = false
    if (qualifies && input.questId && input.occurrenceKey) {
      const quest = await db.quests.get(input.questId)
      const needed = (quest?.focusMinutes ?? 0) * 60
      if (quest && quest.status === 'active' && quest.type === 'timed' && input.actualSeconds >= needed) {
        const res = await completeQuestInTx(ctx, quest, input.occurrenceKey)
        if (res) {
          questCompleted = true
          questXp = res.xp
          capped = res.capped
        }
      }
    }
    const result = await finalize(ctx, totalBefore, xp + questXp, capped)
    return { ...result, focusXp: xp, questCompleted }
  })
}

/* ------------------------------------------------------------------ */
/* Goals & milestones                                                 */
/* ------------------------------------------------------------------ */

async function completeMilestoneInTx(ctx: TxContext, milestoneId: string): Promise<number> {
  const m = await ctx.db.milestones.get(milestoneId)
  if (!m || m.done) return 0
  await ctx.db.milestones.update(milestoneId, { done: true, completedAt: ctx.nowIso })
  const goal = await ctx.db.goals.get(m.goalId)
  const xp = ctx.rules.milestoneXp
  if (xp > 0) await addLedger(ctx, 'milestone', xp, milestoneId, `Milestone: ${m.title}`, {}, goal?.categoryId ?? null)
  await ctx.db.activity.add(activity(ctx, { type: 'milestone-completed', title: m.title, refId: milestoneId, categoryId: goal?.categoryId ?? null, xp }))
  await notify(ctx, 'goal', 'Milestone reached', `${m.title}${goal ? ` — ${goal.name}` : ''}`)
  return xp
}

export async function setMilestoneDone(milestoneId: string, done: boolean, now = new Date()): Promise<ProgressionResult> {
  const db = getDb()
  return db.transaction('rw', db.tables, async () => {
    const ctx = await context(db, now)
    const totalBefore = await ledgerTotal(db)
    const m = await db.milestones.get(milestoneId)
    if (!m) throw new ProgressionError('Milestone not found.')
    if (done) {
      if (m.done) return noop(ctx.rules, totalBefore)
      const xp = await completeMilestoneInTx(ctx, milestoneId)
      return finalize(ctx, totalBefore, xp, false)
    }
    if (!m.done) return noop(ctx.rules, totalBefore)
    const entries = await db.ledger.where('refId').equals(milestoneId).toArray()
    for (const e of entries) if (e.source === 'milestone') await reverseLedger(ctx, e.id, 'Milestone reopened')
    await db.milestones.update(milestoneId, { done: false, completedAt: null })
    return noop(ctx.rules, await ledgerTotal(db))
  })
}

export async function completeGoal(goalId: string, now = new Date()): Promise<ProgressionResult> {
  const db = getDb()
  return db.transaction('rw', db.tables, async () => {
    const ctx = await context(db, now)
    const totalBefore = await ledgerTotal(db)
    const goal = await db.goals.get(goalId)
    if (!goal) throw new ProgressionError('Goal not found.')
    if (goal.status === 'completed') return noop(ctx.rules, totalBefore, 'Goal already completed.')
    await db.goals.update(goalId, { status: 'completed', completedAt: ctx.nowIso, updatedAt: ctx.nowIso })
    const xp = ctx.rules.goalCompletionXp
    if (xp > 0) await addLedger(ctx, 'goal', xp, goalId, `Goal: ${goal.name}`, {}, goal.categoryId)
    await db.activity.add(activity(ctx, { type: 'goal-completed', title: goal.name, refId: goalId, categoryId: goal.categoryId, xp }))
    await notify(ctx, 'goal', 'Goal completed', goal.name)
    return finalize(ctx, totalBefore, xp, false)
  })
}

export async function reopenGoal(goalId: string, now = new Date()): Promise<void> {
  const db = getDb()
  await db.transaction('rw', db.tables, async () => {
    const ctx = await context(db, now)
    const goal = await db.goals.get(goalId)
    if (!goal || goal.status !== 'completed') return
    const entries = await db.ledger.where('refId').equals(goalId).toArray()
    for (const e of entries) if (e.source === 'goal') await reverseLedger(ctx, e.id, 'Goal reopened')
    await db.goals.update(goalId, { status: 'active', completedAt: null, updatedAt: ctx.nowIso })
  })
}

/* ------------------------------------------------------------------ */
/* Skill tree, views, onboarding                                      */
/* ------------------------------------------------------------------ */

export async function unlockSkillNode(nodeId: string, now = new Date()): Promise<ProgressionResult> {
  const db = getDb()
  return db.transaction('rw', db.tables, async () => {
    const ctx = await context(db, now)
    const totalBefore = await ledgerTotal(db)
    if (await db.skillUnlocks.get(nodeId)) return noop(ctx.rules, totalBefore, 'Already unlocked.')
    const custom = await db.skillNodes.toArray()
    const all = [...DEFAULT_SKILL_NODES, ...custom]
    const node = all.find((n) => n.id === nodeId)
    if (!node) throw new ProgressionError('Skill node not found.')
    const stats = await gatherStats(db, ctx.rules)
    const unlockedIds = new Set((await db.skillUnlocks.toArray()).map((u) => u.id))
    const evaluation = evaluateNode(node, {
      attributePoints: attributeTotals(await db.ledger.toArray()),
      rankIndex: stats.rankIndex,
      completionsByCategory: stats.completionsByCategory,
      goalsCompleted: stats.goalsCompleted,
      completedGoalIds: stats.completedGoalIds,
      unlockedIds,
      names: { attribute: (i) => i, category: (i) => i, rank: (i) => String(i), goal: (i) => i, node: (i) => i },
    })
    if (!evaluation.requirementsMet) throw new ProgressionError('Requirements for this node are not met yet.')
    await db.skillUnlocks.add({ id: nodeId, unlockedAt: ctx.nowIso })
    await db.activity.add(activity(ctx, { type: 'skill-unlocked', title: node.name, refId: nodeId, categoryId: null, xp: 0 }))
    await notify(ctx, 'success', `Skill unlocked: ${node.name}`, node.title ? `New title available: ${node.title}` : node.description)
    return finalize(ctx, totalBefore, 0, false)
  })
}

/** Records a visited section (for the Explorer achievement). */
export async function recordViewVisit(view: string, now = new Date()): Promise<ProgressionResult | null> {
  const db = getDb()
  return db.transaction('rw', db.tables, async () => {
    const profile = await loadProfile()
    if (!profile.onboardingComplete || profile.visitedViews.includes(view)) return null
    await saveProfile({ ...profile, visitedViews: [...profile.visitedViews, view] })
    const ctx = await context(db, now)
    const totalBefore = await ledgerTotal(db)
    const res = await finalize(ctx, totalBefore, 0, false)
    return res.achievements.length || res.transition.levelsGained ? res : null
  })
}

/** Marks onboarding complete and evaluates the "First Awakening" achievement. */
export async function finishOnboarding(now = new Date()): Promise<ProgressionResult> {
  const db = getDb()
  return db.transaction('rw', db.tables, async () => {
    const profile = await loadProfile()
    const ctx = await context(db, now)
    await saveProfile({ ...profile, onboardingComplete: true, introSeen: true, firstActiveDate: profile.firstActiveDate ?? ctx.today })
    const totalBefore = await ledgerTotal(db)
    return finalize(ctx, totalBefore, 0, false)
  })
}

/** Re-checks achievements (e.g. after rules change or an import). */
export async function reevaluateAchievements(now = new Date()): Promise<ProgressionResult> {
  const db = getDb()
  return db.transaction('rw', db.tables, async () => {
    const ctx = await context(db, now)
    return finalize(ctx, await ledgerTotal(db), 0, false)
  })
}
