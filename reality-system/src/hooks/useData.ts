/**
 * Live data hooks. They re-render automatically when the underlying
 * IndexedDB tables change (including changes made in another tab).
 */
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { getDb } from '@/db/database'
import type { AttributeDef, Category, Completion, Quest } from '@/domain/schemas'
import { computeProgress, type ProgressState } from '@/game/progress'
import { useApp } from '@/store/app'
import { occurrenceKeyFor } from '@/quests/recurrence'
import { loadAchievementOverrides } from '@/db/config'

export function useLedger() {
  return useLiveQuery(() => getDb().ledger.toArray(), [])
}

export function useProgress(): ProgressState | undefined {
  const ledger = useLedger()
  const rules = useApp((s) => s.rules)
  return useMemo(() => (ledger ? computeProgress(ledger, rules) : undefined), [ledger, rules])
}

export function useAttributes(includeHidden = false): AttributeDef[] | undefined {
  const all = useLiveQuery(() => getDb().attributes.orderBy('order').toArray(), [])
  return useMemo(() => (all ? (includeHidden ? all : all.filter((a) => !a.hidden)) : undefined), [all, includeHidden])
}

export function useCategories(includeArchived = false): Category[] | undefined {
  const all = useLiveQuery(() => getDb().categories.orderBy('order').toArray(), [])
  return useMemo(() => (all ? (includeArchived ? all : all.filter((c) => !c.archived)) : undefined), [all, includeArchived])
}

export function useCategoryMap(): Map<string, Category> {
  const cats = useCategories(true)
  return useMemo(() => new Map((cats ?? []).map((c) => [c.id, c])), [cats])
}

export function useAttributeMap(): Map<string, AttributeDef> {
  const attrs = useAttributes(true)
  return useMemo(() => new Map((attrs ?? []).map((a) => [a.id, a])), [attrs])
}

export function useQuests(): Quest[] | undefined {
  return useLiveQuery(() => getDb().quests.toArray(), [])
}

export function useCompletionsOn(dateKey: string): Completion[] | undefined {
  return useLiveQuery(() => getDb().completions.where('dateKey').equals(dateKey).toArray(), [dateKey])
}

export interface TodayQuest {
  quest: Quest
  occurrenceKey: string
  completion: Completion | null
}

/**
 * Today's quest board: every active quest with an occurrence today, plus
 * one-time quests completed today. Week-based keys are resolved here.
 */
export function useTodayQuests(today: string): TodayQuest[] | undefined {
  const weekStart = useApp((s) => s.settings.general.weekStart)
  const data = useLiveQuery(async () => {
    const db = getDb()
    const [quests, completions] = await Promise.all([db.quests.where('status').anyOf('active', 'completed').toArray(), db.completions.toArray()])
    return { quests, completions }
  }, [])
  return useMemo(() => {
    if (!data) return undefined
    const byId = new Map(data.completions.map((c) => [c.id, c]))
    const out: TodayQuest[] = []
    for (const quest of data.quests) {
      const key = occurrenceKeyFor(quest, today, weekStart)
      if (!key) continue
      const completion = byId.get(`${quest.id}::${key}`) ?? null
      if (quest.status === 'completed' && (!completion || completion.dateKey !== today)) continue
      out.push({ quest, occurrenceKey: key, completion })
    }
    return out
  }, [data, today, weekStart])
}

export function useAchievementOverrides() {
  return useLiveQuery(() => loadAchievementOverrides(), [])
}

export function useUnreadNotifications(): number {
  return useLiveQuery(() => getDb().notifications.filter((n) => !n.read).count(), []) ?? 0
}
