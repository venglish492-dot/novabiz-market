/**
 * Aggregated statistics computed from stored records only.
 * Achievements and skill nodes are evaluated against this snapshot.
 */
import type { Completion, FocusSession, Goal, Milestone } from '@/domain/schemas'
import { daysBetween } from '@/lib/dates'
import { LEARNING_CATEGORIES, PROJECT_CATEGORIES } from './defaults'
import { ONCE } from '@/quests/recurrence'

export interface Stats {
  onboardingComplete: boolean
  totalCompletions: number
  completionsByCategory: Record<string, number>
  learningDays: number
  projectCompletions: number
  readingCompletions: number
  readingFocusMinutes: number
  recurringCompletions: number
  focusSessions: number
  focusMinutes: number
  goalsCompleted: number
  completedGoalIds: string[]
  milestonesCompleted: number
  completedMilestoneIds: string[]
  totalXp: number
  level: number
  rankIndex: number
  skillUnlocks: number
  visitedViews: number
  returnedAfterBreak: boolean
  activeDays: number
}

export interface StatsInput {
  onboardingComplete: boolean
  completions: Completion[]
  focusSessions: FocusSession[]
  goals: Goal[]
  milestones: Milestone[]
  totalXp: number
  level: number
  rankIndex: number
  skillUnlocks: number
  visitedViews: number
}

export function computeStats(input: StatsInput): Stats {
  const byCategory: Record<string, number> = {}
  const learningDays = new Set<string>()
  const activeDays = new Set<string>()
  let recurring = 0
  for (const c of input.completions) {
    byCategory[c.categoryId] = (byCategory[c.categoryId] ?? 0) + 1
    if (LEARNING_CATEGORIES.includes(c.categoryId)) learningDays.add(c.dateKey)
    if (c.occurrenceKey !== ONCE) recurring++
    activeDays.add(c.dateKey)
  }
  const focus = input.focusSessions.filter((s) => s.status === 'completed' && s.phase === 'focus')
  let focusMinutes = 0
  let readingFocusMinutes = 0
  for (const s of focus) {
    const m = Math.floor(s.actualSeconds / 60)
    focusMinutes += m
    if (s.mode === 'reading') readingFocusMinutes += m
    activeDays.add(s.dateKey)
  }
  const sortedDays = [...activeDays].sort()
  let returnedAfterBreak = false
  for (let i = 1; i < sortedDays.length; i++) {
    if (daysBetween(sortedDays[i - 1], sortedDays[i]) >= 4) returnedAfterBreak = true
  }
  const completedGoals = input.goals.filter((g) => g.status === 'completed')
  const doneMilestones = input.milestones.filter((m) => m.done)
  return {
    onboardingComplete: input.onboardingComplete,
    totalCompletions: input.completions.length,
    completionsByCategory: byCategory,
    learningDays: learningDays.size,
    projectCompletions: PROJECT_CATEGORIES.reduce((n, id) => n + (byCategory[id] ?? 0), 0),
    readingCompletions: byCategory.reading ?? 0,
    readingFocusMinutes,
    recurringCompletions: recurring,
    focusSessions: focus.length,
    focusMinutes,
    goalsCompleted: completedGoals.length,
    completedGoalIds: completedGoals.map((g) => g.id),
    milestonesCompleted: doneMilestones.length,
    completedMilestoneIds: doneMilestones.map((m) => m.id),
    totalXp: input.totalXp,
    level: input.level,
    rankIndex: input.rankIndex,
    skillUnlocks: input.skillUnlocks,
    visitedViews: input.visitedViews,
    returnedAfterBreak,
    activeDays: activeDays.size,
  }
}
