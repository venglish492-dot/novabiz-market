/**
 * Skill tree: nodes represent learning and long-term growth.
 * Each node shows its exact requirements; unlocking is only possible when
 * they are met by real recorded progress. Unlocking is permanent (no decay).
 */
import type { SkillNodeDef, SkillRequirement } from '@/domain/schemas'

export const SKILL_BRANCHES = ['int', 'disc', 'cre', 'foc', 'str', 'wis'] as const

const EPOCH = '2026-01-01T00:00:00.000Z'

function req(partial: Partial<SkillRequirement>): SkillRequirement {
  return {
    attributeXp: 0,
    minRankIndex: null,
    categoryId: null,
    categoryCompletions: 0,
    goalsCompleted: 0,
    goalId: null,
    ...partial,
  }
}

function node(
  id: string,
  branch: string,
  name: string,
  description: string,
  prerequisiteId: string | null,
  requirement: Partial<SkillRequirement>,
  title: string | null = null,
): SkillNodeDef {
  return { id, branch, name, description, prerequisiteId, requirement: req(requirement), title, custom: false, createdAt: EPOCH }
}

export const DEFAULT_SKILL_NODES: SkillNodeDef[] = [
  node('int-1', 'int', 'Curious Mind', 'Begin a habit of deliberate learning.', null, { attributeXp: 50 }),
  node('int-2', 'int', 'Analytical Thinker', 'Study sessions are becoming routine.', 'int-1', { attributeXp: 300, categoryId: 'study', categoryCompletions: 5 }),
  node('int-3', 'int', 'Scholar', 'Sustained learning across weeks.', 'int-2', { attributeXp: 1000, minRankIndex: 1 }),
  node('int-4', 'int', 'Polymath', 'Deep, wide and long-term learning.', 'int-3', { attributeXp: 3000, minRankIndex: 2 }, 'Polymath'),

  node('str-1', 'str', 'First Steps', 'Move your body with intention.', null, { attributeXp: 50 }),
  node('str-2', 'str', 'Conditioned', 'Training is part of your week.', 'str-1', { attributeXp: 300, categoryId: 'exercise', categoryCompletions: 10 }),
  node('str-3', 'str', 'Iron Will', 'Physical consistency over months.', 'str-2', { attributeXp: 1000, minRankIndex: 1 }),
  node('str-4', 'str', 'Titan', 'A body built through patience.', 'str-3', { attributeXp: 3000, minRankIndex: 2 }, 'Titan'),

  node('disc-1', 'disc', 'Showing Up', 'Keep returning to your routines.', null, { attributeXp: 30 }),
  node('disc-2', 'disc', 'Daily Rhythm', 'Recurring quests have become natural.', 'disc-1', { attributeXp: 200 }),
  node('disc-3', 'disc', 'Unbroken Resolve', 'Carry a goal all the way to the end.', 'disc-2', { attributeXp: 600, goalsCompleted: 1 }),
  node('disc-4', 'disc', 'Master of Self', 'Discipline as identity, not effort.', 'disc-3', { attributeXp: 1500, minRankIndex: 2 }, 'Self-Master'),

  node('wis-1', 'wis', 'Reflective Mind', 'Make room for reading and reflection.', null, { attributeXp: 50 }),
  node('wis-2', 'wis', 'Avid Reader', 'Reading is a regular part of life.', 'wis-1', { attributeXp: 300, categoryId: 'reading', categoryCompletions: 10 }),
  node('wis-3', 'wis', "Sage's Patience", 'Calm, steady self-understanding.', 'wis-2', { attributeXp: 1000, minRankIndex: 1 }),
  node('wis-4', 'wis', 'Sage', 'Wisdom earned through time.', 'wis-3', { attributeXp: 3000, minRankIndex: 2 }, 'Sage'),

  node('cre-1', 'cre', 'Spark', 'Start making things.', null, { attributeXp: 50 }),
  node('cre-2', 'cre', 'Maker', 'Projects are moving forward.', 'cre-1', { attributeXp: 300, categoryId: 'projects', categoryCompletions: 5 }),
  node('cre-3', 'cre', 'Visionary', 'Long-term creative direction.', 'cre-2', { attributeXp: 1000, minRankIndex: 1 }),
  node('cre-4', 'cre', 'Worldbuilder', 'A body of finished creative work.', 'cre-3', { attributeXp: 3000, minRankIndex: 2 }, 'Worldbuilder'),

  node('foc-1', 'foc', 'Present Moment', 'Complete your first focus sessions.', null, { attributeXp: 25 }),
  node('foc-2', 'foc', 'Deep Work', 'Hours of protected attention.', 'foc-1', { attributeXp: 250 }),
  node('foc-3', 'foc', 'Flow State', 'Focus is a trained skill.', 'foc-2', { attributeXp: 800, minRankIndex: 1 }),
  node('foc-4', 'foc', 'Zen Core', 'Calm, sustained concentration.', 'foc-3', { attributeXp: 2400, minRankIndex: 2 }, 'Flowmaster'),
]

export type NodeState = 'locked' | 'available' | 'unlocked' | 'mastered'

export interface NodeContext {
  attributePoints: Record<string, number>
  rankIndex: number
  completionsByCategory: Record<string, number>
  goalsCompleted: number
  completedGoalIds: string[]
  unlockedIds: Set<string>
  names: {
    attribute: (id: string) => string
    category: (id: string) => string
    rank: (index: number) => string
    goal: (id: string) => string
    node: (id: string) => string
  }
}

export interface RequirementCheck {
  label: string
  met: boolean
  current?: number
  target?: number
}

export interface NodeEvaluation {
  state: NodeState
  checks: RequirementCheck[]
  requirementsMet: boolean
}

export function evaluateNode(n: SkillNodeDef, ctx: NodeContext): NodeEvaluation {
  const r = n.requirement
  const checks: RequirementCheck[] = []
  if (n.prerequisiteId) {
    checks.push({ label: `Unlock "${ctx.names.node(n.prerequisiteId)}"`, met: ctx.unlockedIds.has(n.prerequisiteId) })
  }
  const attrXp = ctx.attributePoints[n.branch] ?? 0
  if (r.attributeXp > 0) {
    checks.push({
      label: `${ctx.names.attribute(n.branch)} points`,
      met: attrXp >= r.attributeXp,
      current: Math.min(attrXp, r.attributeXp),
      target: r.attributeXp,
    })
  }
  if (r.minRankIndex !== null && r.minRankIndex > 0) {
    checks.push({ label: `Reach rank ${ctx.names.rank(r.minRankIndex)}`, met: ctx.rankIndex >= r.minRankIndex })
  }
  if (r.categoryId && r.categoryCompletions > 0) {
    const done = ctx.completionsByCategory[r.categoryId] ?? 0
    checks.push({
      label: `${ctx.names.category(r.categoryId)} quests completed`,
      met: done >= r.categoryCompletions,
      current: Math.min(done, r.categoryCompletions),
      target: r.categoryCompletions,
    })
  }
  if (r.goalsCompleted > 0) {
    checks.push({
      label: 'Goals completed',
      met: ctx.goalsCompleted >= r.goalsCompleted,
      current: Math.min(ctx.goalsCompleted, r.goalsCompleted),
      target: r.goalsCompleted,
    })
  }
  if (r.goalId) {
    checks.push({ label: `Complete goal "${ctx.names.goal(r.goalId)}"`, met: ctx.completedGoalIds.includes(r.goalId) })
  }
  const requirementsMet = checks.every((c) => c.met)
  let state: NodeState = requirementsMet ? 'available' : 'locked'
  if (ctx.unlockedIds.has(n.id)) {
    state = r.attributeXp > 0 && attrXp >= r.attributeXp * 2 ? 'mastered' : 'unlocked'
  }
  return { state, checks, requirementsMet }
}
