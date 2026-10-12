/** Quest CRUD. XP is never touched here — completions go through the engine. */
import { getDb } from '@/db/database'
import { questSchema, type Quest } from '@/domain/schemas'
import { newId } from '@/lib/id'
import { toDateKey } from '@/lib/dates'

export type QuestDraft = Omit<Quest, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'archivedAt' | 'status'>

export function emptyDraft(partial: Partial<QuestDraft> = {}): QuestDraft {
  return {
    title: '',
    description: '',
    type: 'one-time',
    categoryId: 'general',
    difficulty: 'normal',
    estimatedMinutes: 30,
    xpOverride: null,
    attributeId: 'disc',
    goalId: null,
    milestoneId: null,
    dueDate: null,
    startDate: toDateKey(new Date()),
    recurrence: { kind: 'none' },
    tags: [],
    checklist: [],
    target: null,
    focusMinutes: null,
    completionCondition: '',
    notes: '',
    priority: 'normal',
    reminder: false,
    ...partial,
  }
}

export async function createQuest(draft: QuestDraft): Promise<Quest> {
  const now = new Date().toISOString()
  const quest = questSchema.parse({
    ...draft,
    id: newId('q'),
    status: 'active',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    archivedAt: null,
  })
  await getDb().quests.add(quest)
  return quest
}

export async function updateQuest(id: string, draft: QuestDraft): Promise<void> {
  const db = getDb()
  await db.transaction('rw', db.quests, async () => {
    const existing = await db.quests.get(id)
    if (!existing) throw new Error('Quest not found.')
    const next = questSchema.parse({ ...existing, ...draft, id, updatedAt: new Date().toISOString() })
    await db.quests.put(next)
  })
}

export async function duplicateQuest(id: string): Promise<Quest> {
  const q = await getDb().quests.get(id)
  if (!q) throw new Error('Quest not found.')
  const { id: _id, createdAt: _c, updatedAt: _u, completedAt: _d, archivedAt: _a, status: _s, ...draft } = q
  return createQuest({ ...draft, title: `${q.title} (copy)`.slice(0, 140), startDate: toDateKey(new Date()) })
}

export async function archiveQuests(ids: string[]): Promise<void> {
  const now = new Date().toISOString()
  await getDb().quests.where('id').anyOf(ids).modify({ status: 'archived', archivedAt: now, updatedAt: now })
}

/** Restores archived quests. A one-time quest that was completed returns as completed. */
export async function restoreQuests(ids: string[]): Promise<void> {
  const db = getDb()
  await db.transaction('rw', db.quests, db.completions, async () => {
    const now = new Date().toISOString()
    for (const id of ids) {
      const q = await db.quests.get(id)
      if (!q) continue
      const done = q.recurrence.kind === 'none' && (await db.completions.where('questId').equals(id).count()) > 0
      await db.quests.update(id, { status: done ? 'completed' : 'active', archivedAt: null, updatedAt: now })
    }
  })
}

/**
 * Deletes quests and their in-progress checklist state. Completion history and
 * XP ledger entries are intentionally kept so earned progress is never erased.
 */
export async function deleteQuests(ids: string[]): Promise<void> {
  const db = getDb()
  await db.transaction('rw', db.quests, db.progress, async () => {
    await db.quests.bulkDelete(ids)
    await db.progress.where('questId').anyOf(ids).delete()
  })
}

export async function saveOccurrenceProgress(
  questId: string,
  occurrenceKey: string,
  patch: { checked?: string[]; measured?: number },
): Promise<void> {
  const db = getDb()
  const id = `${questId}::${occurrenceKey}`
  await db.transaction('rw', db.progress, async () => {
    const existing = await db.progress.get(id)
    await db.progress.put({
      id,
      questId,
      occurrenceKey,
      checked: patch.checked ?? existing?.checked ?? [],
      measured: Math.max(0, patch.measured ?? existing?.measured ?? 0),
      updatedAt: new Date().toISOString(),
    })
  })
}

/** Splits a large quest into smaller one-time quests (used by the local planner). */
export async function splitQuest(id: string, parts: number): Promise<Quest[]> {
  const q = await getDb().quests.get(id)
  if (!q) throw new Error('Quest not found.')
  const n = Math.max(2, Math.min(8, Math.round(parts)))
  const created: Quest[] = []
  for (let i = 1; i <= n; i++) {
    created.push(
      await createQuest({
        ...emptyDraft(),
        title: `${q.title} — part ${i}/${n}`.slice(0, 140),
        description: q.description,
        categoryId: q.categoryId,
        attributeId: q.attributeId,
        difficulty: q.difficulty === 'epic' ? 'hard' : q.difficulty === 'hard' ? 'challenging' : q.difficulty,
        estimatedMinutes: Math.max(5, Math.round(q.estimatedMinutes / n)),
        goalId: q.goalId,
        milestoneId: q.milestoneId,
        dueDate: q.dueDate,
        tags: q.tags,
        priority: q.priority,
      }),
    )
  }
  await archiveQuests([id])
  return created
}
