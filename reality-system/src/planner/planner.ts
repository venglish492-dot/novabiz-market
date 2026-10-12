/**
 * Local daily planning assistant. These are transparent, deterministic
 * rules — not AI. Every suggestion comes with the reason it was made.
 */
import type { Quest } from '@/domain/schemas'
import { daysBetween, type DateKey } from '@/lib/dates'

export interface PlanItem {
  quest: Quest
  occurrenceKey: string
  done: boolean
}

export interface PlannedQuest extends PlanItem {
  score: number
  reasons: string[]
}

export interface DailyPlan {
  ordered: PlannedQuest[]
  remainingMinutes: number
  plannedMinutes: number
  completedCount: number
  totalCount: number
  overloaded: boolean
  tooMany: boolean
  splitSuggestions: Array<{ quest: Quest; parts: number }>
  dueSoon: Quest[]
  summary: string[]
}

const PRIORITY_SCORE = { high: 30, normal: 15, low: 5 } as const
const DIFFICULTY_SCORE = { easy: 2, normal: 4, challenging: 6, hard: 8, epic: 10 } as const
export const SPLIT_THRESHOLD_MINUTES = 90

export function scoreQuest(q: Quest, today: DateKey): { score: number; reasons: string[] } {
  let score = PRIORITY_SCORE[q.priority] + DIFFICULTY_SCORE[q.difficulty]
  const reasons: string[] = []
  if (q.priority === 'high') reasons.push('High priority')
  if (q.dueDate) {
    const d = daysBetween(today, q.dueDate)
    if (d < 0) {
      score += 45
      reasons.push('Past its due date')
    } else if (d === 0) {
      score += 35
      reasons.push('Due today')
    } else if (d <= 3) {
      score += 18
      reasons.push(`Due in ${d} day${d === 1 ? '' : 's'}`)
    }
  }
  if (q.recurrence.kind !== 'none') {
    score += 8
    reasons.push('Recurring routine')
  }
  if (q.estimatedMinutes > 0 && q.estimatedMinutes <= 15) {
    score += 5
    reasons.push('Quick win')
  }
  return { score, reasons }
}

export function buildDailyPlan(items: PlanItem[], today: DateKey, capacityMinutes: number, questLimit: number, allActive: Quest[] = []): DailyPlan {
  const ordered = items
    .map((it) => ({ ...it, ...scoreQuest(it.quest, today) }))
    .sort((a, b) => Number(a.done) - Number(b.done) || b.score - a.score || a.quest.estimatedMinutes - b.quest.estimatedMinutes)
  const open = ordered.filter((o) => !o.done)
  const remainingMinutes = open.reduce((n, o) => n + o.quest.estimatedMinutes, 0)
  const plannedMinutes = ordered.reduce((n, o) => n + o.quest.estimatedMinutes, 0)
  const overloaded = remainingMinutes > capacityMinutes
  const tooMany = open.length > questLimit
  const splitSuggestions = open
    .filter((o) => o.quest.recurrence.kind === 'none' && o.quest.estimatedMinutes > SPLIT_THRESHOLD_MINUTES)
    .map((o) => ({ quest: o.quest, parts: Math.min(8, Math.ceil(o.quest.estimatedMinutes / 45)) }))
  const dueSoon = allActive
    .filter((q) => q.status === 'active' && q.dueDate && daysBetween(today, q.dueDate) <= 7)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))

  const summary: string[] = []
  const completedCount = ordered.length - open.length
  if (ordered.length === 0) summary.push('No quests are planned for today yet.')
  else if (open.length === 0) summary.push(`All ${ordered.length} planned quests are complete.`)
  else summary.push(`${open.length} of ${ordered.length} quests remain (about ${Math.round(remainingMinutes)} min).`)
  if (overloaded) summary.push(`That is more than your daily capacity of ${capacityMinutes} min. Consider moving something to another day.`)
  if (tooMany) summary.push(`You have more open quests than your daily target of ${questLimit}.`)
  if (splitSuggestions.length) summary.push(`${splitSuggestions.length} large quest${splitSuggestions.length > 1 ? 's' : ''} could be split into smaller steps.`)

  return { ordered, remainingMinutes, plannedMinutes, completedCount, totalCount: ordered.length, overloaded, tooMany, splitSuggestions, dueSoon, summary }
}
