/**
 * Recurring quests are represented by separate *occurrences*.
 * An occurrence is identified by a key derived from the date:
 *   - one-time quests:      "once"
 *   - daily / weekdays / every-N-days: the logical date key, e.g. "2026-10-11"
 *   - weekly quests:        "W" + the week's first day, e.g. "W2026-10-05"
 * Completing one occurrence never completes any other occurrence.
 */
import { daysBetween, weekStartKey, weekdayOf, type DateKey } from '@/lib/dates'
import type { Quest, QuestType, Recurrence } from '@/domain/schemas'

export const ONCE = 'once'

export function isRecurring(r: Recurrence): boolean {
  return r.kind !== 'none'
}

export function occurrenceKeyFor(
  quest: Pick<Quest, 'recurrence' | 'startDate'>,
  dateKey: DateKey,
  weekStart: 0 | 1,
): string | null {
  const r = quest.recurrence
  if (r.kind === 'none') return ONCE
  if (daysBetween(quest.startDate, dateKey) < 0) {
    // Not started yet — except weekly quests, whose week may have begun before the start date.
    if (r.kind !== 'weekly' || weekStartKey(dateKey, weekStart) < weekStartKey(quest.startDate, weekStart)) return null
  }
  switch (r.kind) {
    case 'daily':
      return dateKey
    case 'weekdays':
      return r.days.includes(weekdayOf(dateKey)) ? dateKey : null
    case 'weekly':
      return `W${weekStartKey(dateKey, weekStart)}`
    case 'interval':
      return daysBetween(quest.startDate, dateKey) % r.every === 0 ? dateKey : null
  }
}

/** The calendar day an occurrence key refers to (weekly keys map to the week's first day). */
export function occurrenceDate(key: string): DateKey | null {
  if (key === ONCE) return null
  return key.startsWith('W') ? key.slice(1) : key
}

export function completionId(questId: string, occurrenceKey: string): string {
  return `${questId}::${occurrenceKey}`
}

export function describeRecurrence(r: Recurrence): string {
  switch (r.kind) {
    case 'none':
      return 'One time'
    case 'daily':
      return 'Every day'
    case 'weekly':
      return 'Once per week'
    case 'interval':
      return `Every ${r.every} days`
    case 'weekdays': {
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const sorted = [...r.days].sort()
      if (sorted.length === 7) return 'Every day'
      if (sorted.join() === '1,2,3,4,5') return 'Weekdays'
      if (sorted.join() === '0,6') return 'Weekends'
      return sorted.map((d) => names[d]).join(', ')
    }
  }
}

/** Sensible defaults for each quest type (used by the quest form). */
export function defaultRecurrenceForType(type: QuestType): Recurrence {
  switch (type) {
    case 'daily':
    case 'routine':
      return { kind: 'daily' }
    case 'weekly':
      return { kind: 'weekly' }
    case 'custom':
      return { kind: 'weekdays', days: [1, 3, 5] }
    default:
      return { kind: 'none' }
  }
}

export const QUEST_TYPE_INFO: Record<QuestType, { label: string; hint: string }> = {
  'one-time': { label: 'One-time', hint: 'Do it once and it is done.' },
  daily: { label: 'Daily', hint: 'A fresh occurrence every day.' },
  weekly: { label: 'Weekly', hint: 'Complete once per week.' },
  custom: { label: 'Custom recurring', hint: 'Choose weekdays or every N days.' },
  milestone: { label: 'Milestone', hint: 'A long-term step linked to a goal.' },
  checklist: { label: 'Checklist', hint: 'Completes when every item is checked.' },
  measurable: { label: 'Measurable', hint: 'Track a number toward a target (pages, reps, km…).' },
  timed: { label: 'Timed focus', hint: 'Completes after a qualifying focus session.' },
  routine: { label: 'Routine', hint: 'A personal routine you repeat; grows Discipline.' },
}
