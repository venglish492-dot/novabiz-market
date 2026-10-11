import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/db/database'
import { CONFIG_KEYS, saveActiveTimer } from '@/db/config'
import { activeTimerSchema, type ActiveTimer } from '@/domain/schemas'
import { useApp } from '@/store/app'
import { focusSessionAction } from '@/app/actions'
import { isFinished, nextPhase, phaseMinutes, startTimer } from '@/focus/timer'

/** The persisted active focus timer (null when none, undefined while loading). */
export function useActiveTimer(): ActiveTimer | null | undefined {
  return useLiveQuery(async () => {
    const parsed = activeTimerSchema.safeParse((await getDb().config.get(CONFIG_KEYS.activeTimer))?.value)
    return parsed.success ? parsed.data : null
  }, [])
}

/** Re-renders every `ms` while `active`. */
export function useNow(active: boolean, ms = 250): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(id)
  }, [active, ms])
  return now
}

/**
 * Mounted once in the shell: finishes a timer phase exactly once when its
 * time is up — on any screen, and also right after a reload if the timer
 * ran out while the app was closed.
 */
export function useFocusWatcher() {
  const timer = useActiveTimer()
  const focus = useApp((s) => s.settings.focus)
  const running = !!timer && timer.pausedAt === null
  const now = useNow(running, 500)
  const finishing = useRef<string | null>(null)

  useEffect(() => {
    if (!timer || timer.pausedAt !== null || !isFinished(timer, now) || finishing.current === timer.id) return
    finishing.current = timer.id
    void (async () => {
      await focusSessionAction({
        sessionId: timer.id,
        mode: timer.mode,
        phase: timer.phase,
        plannedSeconds: timer.plannedSeconds,
        actualSeconds: timer.plannedSeconds,
        startedAtMs: timer.startedAt,
        status: 'completed',
        questId: timer.questId,
        occurrenceKey: timer.occurrenceKey,
      })
      // Only advance if the stored timer is still the one we just finished.
      const current = activeTimerSchema.safeParse((await getDb().config.get(CONFIG_KEYS.activeTimer))?.value)
      if (!current.success || current.data.id !== timer.id) return
      const next = nextPhase(timer, focus)
      if (next && next.phase !== 'focus') {
        await saveActiveTimer(startTimer({ mode: timer.mode, phase: next.phase, minutes: phaseMinutes(next.phase, focus), now: Date.now(), cycle: next.cycle }))
      } else {
        await saveActiveTimer(null)
      }
    })()
  }, [timer, now, focus])
}
