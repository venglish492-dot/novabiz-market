import { describe, expect, it } from 'vitest'
import { occurrenceKeyFor, describeRecurrence, ONCE } from './recurrence'
import type { Recurrence } from '@/domain/schemas'
import { logicalDateKey, weekStartKey, daysBetween, addDays } from '@/lib/dates'

const q = (recurrence: Recurrence, startDate = '2026-10-01') => ({ recurrence, startDate })

describe('occurrences', () => {
  it('one-time quests have a single occurrence', () => {
    expect(occurrenceKeyFor(q({ kind: 'none' }), '2026-12-25', 1)).toBe(ONCE)
  })

  it('daily quests get one occurrence per day from the start date', () => {
    expect(occurrenceKeyFor(q({ kind: 'daily' }), '2026-10-05', 1)).toBe('2026-10-05')
    expect(occurrenceKeyFor(q({ kind: 'daily' }), '2026-09-30', 1)).toBeNull()
  })

  it('weekday quests only occur on chosen days', () => {
    // 2026-10-12 is a Monday
    const r: Recurrence = { kind: 'weekdays', days: [1, 3] }
    expect(occurrenceKeyFor(q(r), '2026-10-12', 1)).toBe('2026-10-12')
    expect(occurrenceKeyFor(q(r), '2026-10-13', 1)).toBeNull()
  })

  it('weekly quests share one key across the week', () => {
    const a = occurrenceKeyFor(q({ kind: 'weekly' }), '2026-10-12', 1)
    const b = occurrenceKeyFor(q({ kind: 'weekly' }), '2026-10-18', 1)
    const c = occurrenceKeyFor(q({ kind: 'weekly' }), '2026-10-19', 1)
    expect(a).toBe('W2026-10-12')
    expect(b).toBe(a)
    expect(c).not.toBe(a)
  })

  it('interval quests repeat every N days', () => {
    const r: Recurrence = { kind: 'interval', every: 3 }
    expect(occurrenceKeyFor(q(r), '2026-10-01', 1)).toBe('2026-10-01')
    expect(occurrenceKeyFor(q(r), '2026-10-02', 1)).toBeNull()
    expect(occurrenceKeyFor(q(r), '2026-10-04', 1)).toBe('2026-10-04')
  })

  it('describes recurrence', () => {
    expect(describeRecurrence({ kind: 'weekdays', days: [1, 2, 3, 4, 5] })).toBe('Weekdays')
  })
})

describe('dates', () => {
  it('honours the daily reset hour', () => {
    expect(logicalDateKey(new Date(2026, 9, 11, 2, 30), 4)).toBe('2026-10-10')
    expect(logicalDateKey(new Date(2026, 9, 11, 4, 0), 4)).toBe('2026-10-11')
  })
  it('computes week starts and day differences across DST', () => {
    expect(weekStartKey('2026-10-11', 1)).toBe('2026-10-05')
    expect(weekStartKey('2026-10-11', 0)).toBe('2026-10-11')
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31)
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
  })
})
