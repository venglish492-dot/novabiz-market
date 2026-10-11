import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/db/database'
import { addDays, weekStartKey } from '@/lib/dates'
import { useApp } from '@/store/app'

/** Everything the dashboard needs, read live from the local database. */
export function useDashboardData(today: string) {
  const weekStart = useApp((s) => s.settings.general.weekStart)
  return useLiveQuery(async () => {
    const db = getDb()
    const from = addDays(today, -6)
    const weekFrom = weekStartKey(today, weekStart)
    const earliest = from < weekFrom ? from : weekFrom
    const [recentCompletions, focus, goals, milestones, activity, questCount, lastCompletion, ledgerRecent] = await Promise.all([
      db.completions.where('dateKey').between(earliest, today, true, true).toArray(),
      db.focusSessions.where('dateKey').between(earliest, today, true, true).toArray(),
      db.goals.where('status').anyOf('active', 'paused').toArray(),
      db.milestones.toArray(),
      db.activity.orderBy('createdAt').reverse().limit(8).toArray(),
      db.quests.count(),
      db.completions.orderBy('completedAt').last(),
      db.ledger.where('dateKey').between(from, today, true, true).toArray(),
    ])
    const days = Array.from({ length: 7 }, (_, i) => addDays(from, i))
    const perDay = days.map((d) => ({
      date: d,
      quests: recentCompletions.filter((c) => c.dateKey === d).length,
      xp: ledgerRecent.filter((e) => e.dateKey === d).reduce((n, e) => n + e.amount, 0),
    }))
    const completedFocus = focus.filter((s) => s.status === 'completed' && s.phase === 'focus')
    const focusToday = completedFocus.filter((s) => s.dateKey === today).reduce((n, s) => n + Math.floor(s.actualSeconds / 60), 0)
    const weekFocus = completedFocus.filter((s) => s.dateKey >= weekFrom).reduce((n, s) => n + Math.floor(s.actualSeconds / 60), 0)
    const weekCompletions = recentCompletions.filter((c) => c.dateKey >= weekFrom).length
    const categoryCounts = new Map<string, number>()
    for (const c of recentCompletions) categoryCounts.set(c.categoryId, (categoryCounts.get(c.categoryId) ?? 0) + 1)
    const topCategories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
    const recent = [...recentCompletions].sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1)).slice(0, 5)
    const activeGoalIds = new Set(goals.filter((g) => g.status === 'active').map((g) => g.id))
    const upcomingMilestones = milestones
      .filter((m) => !m.done && activeGoalIds.has(m.goalId))
      .sort((a, b) => (a.dueDate ?? '9999') .localeCompare(b.dueDate ?? '9999') || a.order - b.order)
      .slice(0, 5)
    return {
      perDay,
      focusToday,
      weekFocus,
      weekCompletions,
      topCategories,
      recent,
      goals,
      milestones,
      upcomingMilestones,
      activity,
      questCount,
      lastActiveDate: lastCompletion?.dateKey ?? null,
      lastCompletedTitle: lastCompletion?.title ?? null,
    }
  }, [today, weekStart])
}

export type DashboardData = NonNullable<ReturnType<typeof useDashboardData>>
