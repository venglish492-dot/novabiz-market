/**
 * UI-facing actions. They call the progression engine (which persists
 * everything atomically) and only THEN present feedback based on the
 * engine's actual result — so animations always show the real XP awarded.
 */
import { completeGoal, completeQuest, recordFocusSession, recordViewVisit, setMilestoneDone, undoCompletion, unlockSkillNode, type FocusRecordInput, type ProgressionResult } from '@/game/engine'
import { playSound } from '@/audio/sound'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import type { Quest } from '@/domain/schemas'
import { formatNumber } from '@/lib/format'
import { loadProfile } from '@/db/config'

const inFlight = new Set<string>()

/** Prevents double-submits for the same logical action while one is running. */
async function guarded<T>(key: string, fn: () => Promise<T>): Promise<T | null> {
  if (inFlight.has(key)) return null
  inFlight.add(key)
  try {
    return await fn()
  } finally {
    inFlight.delete(key)
  }
}

function errorToast(err: unknown, title = 'Something went wrong') {
  useUi.getState().pushToast({ kind: 'error', title, body: err instanceof Error ? err.message : String(err) })
}

/** Presents level-ups, rank-ups and achievements returned by the engine. */
export function presentResult(result: ProgressionResult): void {
  const ui = useUi.getState()
  const sound = useApp.getState().settings.sound
  const t = result.transition
  for (const a of result.achievements) {
    ui.pushToast({ kind: 'achievement', title: `Achievement unlocked: ${a.name}`, body: a.xp ? `${a.description} (+${a.xp} XP)` : a.description })
  }
  if (result.achievements.length) playSound('achievement', sound)
  if (t.rankChanged) {
    ui.celebrate({ type: 'rank', from: t.rankBefore, to: t.rankAfter })
    playSound('rankUp', sound)
  } else if (t.levelsGained > 0) {
    ui.celebrate({ type: 'level', from: t.levelBefore, to: t.levelAfter })
    playSound('levelUp', sound)
  }
  if (t.levelsGained > 0) void useApp.getState().updateProfile((p) => ({ ...p, lastSeenLevel: t.levelAfter }))
}

export async function completeQuestAction(quest: Quest, occurrenceKey: string, origin?: { x: number; y: number }): Promise<ProgressionResult | null> {
  return guarded(`complete:${quest.id}:${occurrenceKey}`, async () => {
    try {
      const result = await completeQuest(quest.id, occurrenceKey)
      if (result.alreadyDone) return result
      const ui = useUi.getState()
      const sound = useApp.getState().settings.sound
      ui.pushToast({
        kind: 'success',
        title: result.xpAwarded > 0 ? `Quest complete · +${formatNumber(result.xpAwarded)} XP` : 'Quest complete',
        body: result.capped ? `${quest.title} — daily XP limit reached, reward capped.` : quest.title,
        action: { label: 'Undo', run: () => void undoCompletionAction(quest, occurrenceKey) },
      })
      ui.pulse(quest.attributeId)
      if (origin) ui.burst(origin.x, origin.y, getComputedStyle(document.documentElement).getPropertyValue('--rs-accent').trim() || '#38bdf8')
      playSound('quest', sound)
      presentResult(result)
      return result
    } catch (err) {
      errorToast(err, 'Could not complete the quest')
      return null
    }
  })
}

export async function undoCompletionAction(quest: Quest, occurrenceKey: string): Promise<void> {
  await guarded(`undo:${quest.id}:${occurrenceKey}`, async () => {
    try {
      const { xpReversed } = await undoCompletion(quest.id, occurrenceKey)
      useUi.getState().pushToast({ kind: 'info', title: 'Completion undone', body: xpReversed ? `${formatNumber(xpReversed)} XP was reversed in the ledger.` : quest.title })
    } catch (err) {
      errorToast(err, 'Could not undo')
    }
  })
}

export async function focusSessionAction(input: FocusRecordInput) {
  return guarded(`focus:${input.sessionId}`, async () => {
    try {
      const result = await recordFocusSession(input)
      if (result.alreadyDone) return result
      const ui = useUi.getState()
      const sound = useApp.getState().settings.sound
      if (input.status === 'completed' && input.phase === 'focus') {
        const minutes = Math.floor(input.actualSeconds / 60)
        ui.pushToast({
          kind: 'focus',
          title: result.focusXp > 0 ? `Focus session complete · +${result.focusXp} XP` : 'Focus session recorded',
          body:
            result.focusXp > 0
              ? `${minutes} minutes of ${input.mode}.${result.questCompleted ? ' Linked quest completed.' : ''}`
              : `${minutes} minutes — sessions need at least ${useApp.getState().rules.focus.minQualifyingMinutes} minutes to earn XP.`,
        })
        ui.pulse(useApp.getState().rules.focus.attributeId)
        playSound('timer', sound)
      } else if (input.status === 'completed') {
        ui.pushToast({ kind: 'info', title: 'Break finished', body: 'Ready for the next session when you are.' })
        playSound('timer', sound)
      }
      presentResult(result)
      return result
    } catch (err) {
      errorToast(err, 'Could not save the focus session')
      return null
    }
  })
}

export async function milestoneAction(id: string, done: boolean) {
  return guarded(`milestone:${id}`, async () => {
    try {
      const result = await setMilestoneDone(id, done)
      if (done && !result.alreadyDone) {
        useUi.getState().pushToast({ kind: 'goal', title: result.xpAwarded ? `Milestone reached · +${result.xpAwarded} XP` : 'Milestone reached' })
        playSound('quest', useApp.getState().settings.sound)
      }
      presentResult(result)
      return result
    } catch (err) {
      errorToast(err)
      return null
    }
  })
}

export async function completeGoalAction(goalId: string, name: string) {
  return guarded(`goal:${goalId}`, async () => {
    try {
      const result = await completeGoal(goalId)
      if (!result.alreadyDone) {
        useUi.getState().celebrate({ type: 'goal', name })
        useUi.getState().pushToast({ kind: 'goal', title: `Goal completed · +${result.xpAwarded} XP`, body: name })
        playSound('achievement', useApp.getState().settings.sound)
      }
      presentResult(result)
      return result
    } catch (err) {
      errorToast(err)
      return null
    }
  })
}

export async function unlockSkillAction(nodeId: string, name: string) {
  return guarded(`skill:${nodeId}`, async () => {
    try {
      const result = await unlockSkillNode(nodeId)
      if (!result.alreadyDone) {
        useUi.getState().pushToast({ kind: 'success', title: `Skill unlocked: ${name}` })
        playSound('achievement', useApp.getState().settings.sound)
      }
      presentResult(result)
      return result
    } catch (err) {
      errorToast(err, 'Could not unlock')
      return null
    }
  })
}

export async function visitViewAction(view: string) {
  try {
    const result = await recordViewVisit(view)
    // keep the in-memory profile in sync with the stored one (visited views changed)
    useApp.setState({ profile: await loadProfile() })
    if (result) presentResult(result)
  } catch {
    /* visiting a view must never fail visibly */
  }
}
