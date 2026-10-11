import { describe, expect, it } from 'vitest'
import { buildDailyPlan } from './planner'
import { emptyDraft } from '@/quests/service'
import type { Quest } from '@/domain/schemas'
import { elapsedSeconds, nextPhase, pauseTimer, remainingSeconds, resumeTimer, startTimer } from '@/focus/timer'
import { focusSettingsSchema } from '@/domain/settings'

let n = 0
const quest = (p: Partial<Quest>): Quest => ({
  ...emptyDraft(),
  id: `q${n++}`,
  status: 'active',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  completedAt: null,
  archivedAt: null,
  ...p,
})

describe('planner', () => {
  it('orders by urgency and priority and flags overload', () => {
    const a = quest({ title: 'low', priority: 'low', estimatedMinutes: 30 })
    const b = quest({ title: 'due', dueDate: '2026-10-11', estimatedMinutes: 200 })
    const c = quest({ title: 'high', priority: 'high', estimatedMinutes: 60 })
    const plan = buildDailyPlan(
      [a, b, c].map((q) => ({ quest: q, occurrenceKey: 'once', done: false })),
      '2026-10-11',
      120,
      2,
    )
    expect(plan.ordered.map((o) => o.quest.title)).toEqual(['due', 'high', 'low'])
    expect(plan.overloaded).toBe(true)
    expect(plan.tooMany).toBe(true)
    expect(plan.splitSuggestions[0].quest.title).toBe('due')
    expect(plan.remainingMinutes).toBe(290)
  })

  it('handles an empty day honestly', () => {
    const plan = buildDailyPlan([], '2026-10-11', 240, 8)
    expect(plan.summary[0]).toMatch(/No quests/)
  })
})

describe('focus timer', () => {
  const s = focusSettingsSchema.parse({})
  it('derives time from timestamps including pauses', () => {
    const t0 = 1_000_000
    let t = startTimer({ mode: 'study', phase: 'focus', minutes: 25, now: t0 })
    expect(remainingSeconds(t, t0 + 60_000)).toBe(24 * 60)
    t = pauseTimer(t, t0 + 60_000)
    expect(elapsedSeconds(t, t0 + 10 * 60_000)).toBe(60) // paused time does not count
    t = resumeTimer(t, t0 + 10 * 60_000)
    expect(elapsedSeconds(t, t0 + 11 * 60_000)).toBe(120)
    expect(elapsedSeconds(t, t0 + 999 * 60_000)).toBe(25 * 60) // never exceeds planned
  })

  it('schedules breaks and long breaks', () => {
    const t = startTimer({ mode: 'study', phase: 'focus', minutes: 25, now: 0, cycle: 3 })
    expect(nextPhase(t, s)).toEqual({ phase: 'long-break', cycle: 4 })
    expect(nextPhase({ ...t, cycle: 0 }, s)).toEqual({ phase: 'break', cycle: 1 })
    expect(nextPhase(t, { ...s, breaksEnabled: false })).toBeNull()
  })
})
