/**
 * Focus timer math. Time is always derived from stored timestamps, never from
 * counting interval ticks, so the timer stays accurate through slow tabs,
 * sleep/suspend and page reloads.
 */
import type { ActiveTimer, FocusMode, FocusPhase } from '@/domain/schemas'
import type { FocusSettings } from '@/domain/settings'
import { newId } from '@/lib/id'

export function elapsedMs(t: ActiveTimer, now: number): number {
  const end = t.pausedAt ?? now
  return Math.max(0, end - t.startedAt - t.pausedTotalMs)
}

/** Elapsed seconds, never more than the planned duration. */
export function elapsedSeconds(t: ActiveTimer, now: number): number {
  return Math.min(t.plannedSeconds, Math.floor(elapsedMs(t, now) / 1000))
}

export function remainingSeconds(t: ActiveTimer, now: number): number {
  return Math.max(0, t.plannedSeconds - elapsedMs(t, now) / 1000)
}

export function isFinished(t: ActiveTimer, now: number): boolean {
  return remainingSeconds(t, now) <= 0
}

export function pauseTimer(t: ActiveTimer, now: number): ActiveTimer {
  return t.pausedAt === null ? { ...t, pausedAt: now } : t
}

export function resumeTimer(t: ActiveTimer, now: number): ActiveTimer {
  return t.pausedAt === null ? t : { ...t, pausedTotalMs: t.pausedTotalMs + (now - t.pausedAt), pausedAt: null }
}

export function phaseMinutes(phase: FocusPhase, s: FocusSettings): number {
  return phase === 'focus' ? s.focusMinutes : phase === 'break' ? s.breakMinutes : s.longBreakMinutes
}

export function startTimer(opts: {
  mode: FocusMode
  phase: FocusPhase
  minutes: number
  now: number
  questId?: string | null
  occurrenceKey?: string | null
  cycle?: number
}): ActiveTimer {
  return {
    id: newId('focus'),
    mode: opts.mode,
    phase: opts.phase,
    plannedSeconds: Math.max(60, Math.round(opts.minutes * 60)),
    startedAt: opts.now,
    pausedAt: null,
    pausedTotalMs: 0,
    questId: opts.questId ?? null,
    occurrenceKey: opts.occurrenceKey ?? null,
    cycle: opts.cycle ?? 0,
  }
}

/** Which phase follows the finished one (null when breaks are disabled). */
export function nextPhase(finished: ActiveTimer, s: FocusSettings): { phase: FocusPhase; cycle: number } | null {
  if (finished.phase === 'focus') {
    if (!s.breaksEnabled) return null
    const cycle = finished.cycle + 1
    return { phase: cycle % s.longBreakEvery === 0 ? 'long-break' : 'break', cycle }
  }
  return { phase: 'focus', cycle: finished.phase === 'long-break' ? 0 : finished.cycle }
}

export const FOCUS_MODE_INFO: Record<FocusMode, { label: string; hint: string }> = {
  study: { label: 'Study', hint: 'Courses, exam preparation, practice problems.' },
  reading: { label: 'Reading', hint: 'Books, articles, deep reading.' },
  coding: { label: 'Coding', hint: 'Programming and technical projects.' },
  creative: { label: 'Creative', hint: 'Design, writing, art and making.' },
  general: { label: 'General', hint: 'Any task that deserves protected attention.' },
}
