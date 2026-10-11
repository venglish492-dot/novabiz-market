/** Goals & milestones CRUD plus honest progress calculation. */
import { getDb } from '@/db/database'
import { goalSchema, milestoneSchema, type Goal, type Milestone, type Quest } from '@/domain/schemas'
import { newId } from '@/lib/id'

export type GoalDraft = Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'status'> & { status?: Goal['status'] }

export function emptyGoalDraft(): GoalDraft {
  return {
    name: '',
    description: '',
    categoryId: null,
    targetDate: null,
    priority: 'normal',
    progressMode: 'milestones',
    measurable: null,
    notes: '',
  }
}

export async function createGoal(draft: GoalDraft, milestoneTitles: string[] = []): Promise<Goal> {
  const now = new Date().toISOString()
  const goal = goalSchema.parse({ ...draft, status: draft.status ?? 'active', id: newId('g'), createdAt: now, updatedAt: now, completedAt: null })
  const db = getDb()
  await db.transaction('rw', db.goals, db.milestones, async () => {
    await db.goals.add(goal)
    let order = 0
    for (const title of milestoneTitles.map((t) => t.trim()).filter(Boolean)) {
      await db.milestones.add(milestoneSchema.parse({ id: newId('m'), goalId: goal.id, title, dueDate: null, done: false, completedAt: null, order: order++ }))
    }
  })
  return goal
}

export async function updateGoal(id: string, patch: Partial<GoalDraft>): Promise<void> {
  const db = getDb()
  await db.transaction('rw', db.goals, async () => {
    const g = await db.goals.get(id)
    if (!g) throw new Error('Goal not found.')
    await db.goals.put(goalSchema.parse({ ...g, ...patch, updatedAt: new Date().toISOString() }))
  })
}

/** Pause, resume or archive. Completion goes through the engine (it awards XP). */
export async function setGoalStatus(id: string, status: 'active' | 'paused' | 'archived'): Promise<void> {
  await getDb().goals.update(id, { status, updatedAt: new Date().toISOString() })
}

export async function deleteGoal(id: string): Promise<void> {
  const db = getDb()
  await db.transaction('rw', db.goals, db.milestones, db.quests, async () => {
    await db.goals.delete(id)
    await db.milestones.where('goalId').equals(id).delete()
    // Linked quests are kept; only the link is removed.
    await db.quests.where('goalId').equals(id).modify({ goalId: null, milestoneId: null })
  })
}

export async function addMilestone(goalId: string, title: string, dueDate: string | null = null): Promise<Milestone> {
  const db = getDb()
  const order = await db.milestones.where('goalId').equals(goalId).count()
  const m = milestoneSchema.parse({ id: newId('m'), goalId, title: title.trim(), dueDate, done: false, completedAt: null, order })
  await db.milestones.add(m)
  return m
}

export async function updateMilestone(id: string, patch: Partial<Pick<Milestone, 'title' | 'dueDate'>>): Promise<void> {
  await getDb().milestones.update(id, patch)
}

export async function deleteMilestone(id: string): Promise<void> {
  const db = getDb()
  await db.transaction('rw', db.milestones, db.quests, async () => {
    await db.milestones.delete(id)
    await db.quests.where('milestoneId').equals(id).modify({ milestoneId: null })
  })
}

export interface GoalProgress {
  percent: number
  done: number
  total: number
  label: string
}

/**
 * Progress reflects real data only:
 *  - milestones mode: completed milestones / all milestones
 *  - quests mode:     completed linked one-time quests / linked one-time quests
 *  - measurable mode: current / target as entered by the user
 * A goal is never marked complete because a deadline passed.
 */
export function goalProgress(goal: Goal, milestones: Milestone[], linkedQuests: Quest[]): GoalProgress {
  if (goal.status === 'completed') return { percent: 100, done: 1, total: 1, label: 'Completed' }
  if (goal.progressMode === 'measurable' && goal.measurable) {
    const { current, target, unit } = goal.measurable
    return { percent: Math.min(100, Math.round((current / target) * 100)), done: current, total: target, label: `${current} / ${target} ${unit}`.trim() }
  }
  if (goal.progressMode === 'quests') {
    const relevant = linkedQuests.filter((q) => q.status !== 'archived' && q.recurrence.kind === 'none')
    const done = relevant.filter((q) => q.status === 'completed').length
    return { percent: relevant.length ? Math.round((done / relevant.length) * 100) : 0, done, total: relevant.length, label: `${done} / ${relevant.length} quests` }
  }
  const done = milestones.filter((m) => m.done).length
  return { percent: milestones.length ? Math.round((done / milestones.length) * 100) : 0, done, total: milestones.length, label: `${done} / ${milestones.length} milestones` }
}
