import { beforeEach, describe, expect, it } from 'vitest'
import { freshDb } from '@/test/db'
import type { RealityDB } from '@/db/database'
import { createQuest, emptyDraft } from '@/quests/service'
import {
  completeGoal,
  completeQuest,
  recordFocusSession,
  reopenGoal,
  setMilestoneDone,
  undoCompletion,
  unlockSkillNode,
  finishOnboarding,
} from './engine'
import { computeProgress } from './progress'
import { defaultRules } from './rules'
import { saveRules } from '@/db/config'
import { createGoal, addMilestone } from '@/goals/service'
import { totalXpForLevel } from './levels'

let db: RealityDB
const today = new Date(2026, 9, 11, 12, 0)

beforeEach(async () => {
  db = await freshDb({ onboarded: true })
})

async function total() {
  return computeProgress(await db.ledger.toArray(), defaultRules()).totalXp
}

describe('quest completion', () => {
  it('awards XP exactly once even when called repeatedly or concurrently', async () => {
    const q = await createQuest(emptyDraft({ title: 'Read 20 pages', difficulty: 'normal', categoryId: 'reading', attributeId: 'wis' }))
    const results = await Promise.all([completeQuest(q.id, 'once', today), completeQuest(q.id, 'once', today), completeQuest(q.id, 'once', today)])
    const awarded = results.filter((r) => !r.alreadyDone)
    expect(awarded).toHaveLength(1)
    expect(awarded[0].xpAwarded).toBe(20)
    expect(await db.completions.count()).toBe(1)
    expect((await db.ledger.where('source').equals('quest').toArray()).length).toBe(1)
    expect((await db.quests.get(q.id))?.status).toBe('completed')
  })

  it('updates attributes from the ledger', async () => {
    const q = await createQuest(emptyDraft({ title: 'Workout', difficulty: 'hard', categoryId: 'exercise', attributeId: 'str' }))
    await completeQuest(q.id, 'once', today)
    const p = computeProgress(await db.ledger.toArray(), defaultRules())
    expect(p.attributePoints.str).toBe(50)
  })

  it('recurring occurrences are independent and grow Discipline', async () => {
    const q = await createQuest(emptyDraft({ title: 'Stretch', type: 'daily', recurrence: { kind: 'daily' }, attributeId: 'str', startDate: '2026-10-01' }))
    await completeQuest(q.id, '2026-10-11', today)
    const second = await completeQuest(q.id, '2026-10-12', new Date(2026, 9, 12, 12))
    expect(second.alreadyDone).toBe(false)
    expect((await db.quests.get(q.id))?.status).toBe('active')
    const p = computeProgress(await db.ledger.toArray(), defaultRules())
    expect(p.attributePoints.disc).toBe(10) // 25% of 20, twice
  })

  it('undo appends a reversal and allows re-completion', async () => {
    const q = await createQuest(emptyDraft({ title: 'Essay', difficulty: 'challenging' }))
    await completeQuest(q.id, 'once', today)
    const xpAfterFirst = await total()
    const { xpReversed } = await undoCompletion(q.id, 'once', today)
    expect(xpReversed).toBe(35)
    expect(await total()).toBe(xpAfterFirst - 35)
    expect((await db.quests.get(q.id))?.status).toBe('active')
    expect((await db.ledger.where('source').equals('reversal').toArray()).length).toBe(1)
    // undoing twice does nothing
    expect((await undoCompletion(q.id, 'once', today)).xpReversed).toBe(0)
    const again = await completeQuest(q.id, 'once', today)
    expect(again.alreadyDone).toBe(false)
  })

  it('respects the daily XP cap and records the capped amount', async () => {
    await saveRules({ ...defaultRules(), dailyQuestXpCap: 50, achievementXpEnabled: false })
    const a = await createQuest(emptyDraft({ title: 'A', difficulty: 'hard' }))
    const b = await createQuest(emptyDraft({ title: 'B', difficulty: 'normal' }))
    await completeQuest(a.id, 'once', today)
    const res = await completeQuest(b.id, 'once', today)
    expect(res.xpAwarded).toBe(0)
    expect(res.capped).toBe(true)
    expect((await db.completions.get(`${b.id}::once`))?.xpAwarded).toBe(0)
  })

  it('detects multi-level transitions and rank-ups', async () => {
    const rules = { ...defaultRules(), questXpMax: 10_000, dailyQuestXpCap: 100_000, achievementXpEnabled: false }
    await saveRules(rules)
    const needed = totalXpForLevel(5, rules.levelCurve)
    const q = await createQuest(emptyDraft({ title: 'Huge', xpOverride: needed }))
    const res = await completeQuest(q.id, 'once', today)
    expect(res.transition.levelBefore).toBe(1)
    expect(res.transition.levelAfter).toBe(5)
    expect(res.transition.rankChanged).toBe(true)
    expect(res.transition.rankAfter.id).toBe('D')
    expect((await db.activity.where('type').equals('rank-up').count())).toBe(1)
  })

  it('refuses to complete archived quests', async () => {
    const q = await createQuest(emptyDraft({ title: 'Old' }))
    await db.quests.update(q.id, { status: 'archived' })
    await expect(completeQuest(q.id, 'once', today)).rejects.toThrow(/Archived/)
  })
})

describe('achievements', () => {
  it('unlocks once and records the reward in the ledger', async () => {
    const res = await finishOnboarding(today)
    expect(res.achievements.map((a) => a.id)).toContain('first-awakening')
    const again = await finishOnboarding(today)
    expect(again.achievements).toHaveLength(0)
    expect((await db.ledger.where('source').equals('achievement').toArray()).length).toBe(1)
    const q = await createQuest(emptyDraft({ title: 'First' }))
    const done = await completeQuest(q.id, 'once', today)
    expect(done.achievements.map((a) => a.id)).toContain('first-quest')
    expect(await db.achievements.count()).toBe(2)
  })
})

describe('focus sessions', () => {
  const base = { mode: 'study' as const, phase: 'focus' as const, plannedSeconds: 1500, startedAtMs: today.getTime() - 1500_000, questId: null, occurrenceKey: null }

  it('awards XP for a qualifying session exactly once', async () => {
    const input = { ...base, sessionId: 'f1', actualSeconds: 1500, status: 'completed' as const }
    const r1 = await recordFocusSession(input, today)
    const r2 = await recordFocusSession(input, today)
    expect(r1.focusXp).toBe(25)
    expect(r2.alreadyDone).toBe(true)
    expect(await db.focusSessions.count()).toBe(1)
  })

  it('never awards XP for cancelled or too-short sessions', async () => {
    const cancelled = await recordFocusSession({ ...base, sessionId: 'f2', actualSeconds: 1400, status: 'canceled' }, today)
    const short = await recordFocusSession({ ...base, sessionId: 'f3', actualSeconds: 300, status: 'completed' }, today)
    expect(cancelled.focusXp).toBe(0)
    expect(short.focusXp).toBe(0)
    expect(await db.ledger.where('source').equals('focus').count()).toBe(0)
  })

  it('completes a linked timed quest when the duration is reached', async () => {
    const q = await createQuest(emptyDraft({ title: 'Deep study', type: 'timed', focusMinutes: 25 }))
    const res = await recordFocusSession({ ...base, sessionId: 'f4', actualSeconds: 1500, status: 'completed', questId: q.id, occurrenceKey: 'once' }, today)
    expect(res.questCompleted).toBe(true)
    expect(await db.completions.count()).toBe(1)
  })
})

describe('goals and milestones', () => {
  it('awards goal and milestone XP once and reverses on reopen', async () => {
    const goal = await createGoal({ name: 'Finish course', description: '', categoryId: 'study', targetDate: null, priority: 'normal', progressMode: 'milestones', measurable: null, notes: '' })
    const m = await addMilestone(goal.id, 'Module 1')
    await setMilestoneDone(m.id, true, today)
    await setMilestoneDone(m.id, true, today)
    expect(await db.ledger.where('source').equals('milestone').count()).toBe(1)
    await completeGoal(goal.id, today)
    const dup = await completeGoal(goal.id, today)
    expect(dup.alreadyDone).toBe(true)
    const before = await total()
    await reopenGoal(goal.id, today)
    expect(await total()).toBe(before - defaultRules().goalCompletionXp)
  })

  it('auto-completes a milestone when all its linked quests are done', async () => {
    const goal = await createGoal({ name: 'Ship app', description: '', categoryId: 'projects', targetDate: null, priority: 'high', progressMode: 'milestones', measurable: null, notes: '' })
    const m = await addMilestone(goal.id, 'MVP')
    const a = await createQuest(emptyDraft({ title: 'A', goalId: goal.id, milestoneId: m.id }))
    const b = await createQuest(emptyDraft({ title: 'B', goalId: goal.id, milestoneId: m.id }))
    await completeQuest(a.id, 'once', today)
    expect((await db.milestones.get(m.id))?.done).toBe(false)
    await completeQuest(b.id, 'once', today)
    expect((await db.milestones.get(m.id))?.done).toBe(true)
  })
})

describe('skill tree', () => {
  it('only unlocks nodes whose requirements are met', async () => {
    await expect(unlockSkillNode('int-1', today)).rejects.toThrow(/not met/)
    const q = await createQuest(emptyDraft({ title: 'Study', difficulty: 'epic', attributeId: 'int' }))
    await completeQuest(q.id, 'once', today)
    await unlockSkillNode('int-1', today)
    expect(await db.skillUnlocks.count()).toBe(1)
    const again = await unlockSkillNode('int-1', today)
    expect(again.alreadyDone).toBe(true)
  })
})
