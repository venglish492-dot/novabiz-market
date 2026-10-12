/**
 * Game rules: every progression number lives here (no magic numbers in UI).
 *
 * Rules only affect FUTURE awards. Past XP is stored in the ledger with the
 * exact amount that was awarded, so editing rules never rewrites history.
 * (Level and rank are recomputed from lifetime XP, so changing the level
 * curve changes how lifetime XP maps to levels — no XP is ever lost.)
 */
import { z } from 'zod'
import { DIFFICULTY_IDS, hexColorSchema, type DifficultyId } from '@/domain/schemas'

export const rankDefSchema = z.object({
  id: z.string().min(1).max(20),
  label: z.string().min(1).max(4),
  title: z.string().min(1).max(40),
  minLevel: z.number().int().min(1).max(9999),
  color: hexColorSchema,
  description: z.string().max(300),
  unlocks: z.string().max(300),
})
export type RankDef = z.infer<typeof rankDefSchema>

export const DEFAULT_RANKS: RankDef[] = [
  {
    id: 'E',
    label: 'E',
    title: 'Awakened',
    minLevel: 1,
    color: '#94a3b8',
    description: 'The system has registered you. Every journey starts here.',
    unlocks: 'Access to the core system.',
  },
  {
    id: 'D',
    label: 'D',
    title: 'Initiate',
    minLevel: 5,
    color: '#38bdf8',
    description: 'You have built your first rhythm of completed quests.',
    unlocks: 'The "Initiate" title and new skill-tree tiers.',
  },
  {
    id: 'C',
    label: 'C',
    title: 'Pathfinder',
    minLevel: 10,
    color: '#34d399',
    description: 'Consistent effort is becoming part of who you are.',
    unlocks: 'The "Pathfinder" title and advanced skill nodes.',
  },
  {
    id: 'B',
    label: 'B',
    title: 'Vanguard',
    minLevel: 20,
    color: '#a78bfa',
    description: 'Months of deliberate progress. Your system is strong.',
    unlocks: 'The "Vanguard" title and expert skill nodes.',
  },
  {
    id: 'A',
    label: 'A',
    title: 'Ascendant',
    minLevel: 32,
    color: '#f472b6',
    description: 'A rare level of sustained dedication.',
    unlocks: 'The "Ascendant" title and master skill nodes.',
  },
  {
    id: 'S',
    label: 'S',
    title: 'Sovereign',
    minLevel: 45,
    color: '#fbbf24',
    description: 'The highest rank of the system. Built one real day at a time.',
    unlocks: 'The "Sovereign" title.',
  },
]

const difficultyRuleSchema = z.object({
  id: z.enum(DIFFICULTY_IDS),
  label: z.string().min(1).max(20),
  xp: z.number().int().min(1).max(10_000),
})
export type DifficultyRule = z.infer<typeof difficultyRuleSchema>

export const DEFAULT_DIFFICULTIES: DifficultyRule[] = [
  { id: 'easy', label: 'Easy', xp: 10 },
  { id: 'normal', label: 'Normal', xp: 20 },
  { id: 'challenging', label: 'Challenging', xp: 35 },
  { id: 'hard', label: 'Hard', xp: 50 },
  { id: 'epic', label: 'Epic', xp: 80 },
]

export const gameRulesSchema = z
  .object({
    difficulties: z.array(difficultyRuleSchema).length(5).default(DEFAULT_DIFFICULTIES),
    /** smallest / largest XP a single quest occurrence can award */
    questXpMin: z.number().int().min(0).max(10_000).default(1),
    questXpMax: z.number().int().min(1).max(10_000).default(300),
    /** maximum XP from quests per logical day — prevents accidental inflation */
    dailyQuestXpCap: z.number().int().min(10).max(100_000).default(1500),
    /** XP to go from level L to L+1 = round(base × L^exponent) */
    levelCurve: z
      .object({
        base: z.number().int().min(10).max(10_000).default(100),
        exponent: z.number().min(1).max(2.5).default(1.15),
      })
      .prefault({}),
    maxLevel: z.number().int().min(10).max(999).default(200),
    ranks: z.array(rankDefSchema).min(1).max(12).default(DEFAULT_RANKS),
    /** share of quest XP also added to the Discipline attribute for recurring quests */
    disciplineShare: z.number().min(0).max(1).default(0.25),
    disciplineAttributeId: z.string().min(1).default('disc'),
    /** attribute level n needs attributeCurveBase × (n−1)² attribute points */
    attributeCurveBase: z.number().int().min(5).max(1000).default(40),
    focus: z
      .object({
        xpPerMinute: z.number().min(0).max(10).default(1),
        minQualifyingMinutes: z.number().int().min(1).max(120).default(10),
        maxXpPerSession: z.number().int().min(0).max(1000).default(90),
        attributeId: z.string().min(1).default('foc'),
      })
      .prefault({}),
    goalCompletionXp: z.number().int().min(0).max(5000).default(100),
    milestoneXp: z.number().int().min(0).max(2000).default(25),
    achievementXpEnabled: z.boolean().default(true),
  })
  .superRefine((rules, ctx) => {
    if (rules.questXpMin > rules.questXpMax) {
      ctx.addIssue({ code: 'custom', path: ['questXpMin'], message: 'Minimum quest XP cannot exceed the maximum.' })
    }
    const ids = new Set(rules.difficulties.map((d) => d.id))
    if (ids.size !== DIFFICULTY_IDS.length) {
      ctx.addIssue({ code: 'custom', path: ['difficulties'], message: 'Each difficulty must appear exactly once.' })
    }
    const sorted = [...rules.ranks].sort((a, b) => a.minLevel - b.minLevel)
    if (sorted[0]?.minLevel !== 1) {
      ctx.addIssue({ code: 'custom', path: ['ranks'], message: 'The first rank must start at level 1.' })
    }
    const rankIds = new Set(rules.ranks.map((r) => r.id))
    if (rankIds.size !== rules.ranks.length) {
      ctx.addIssue({ code: 'custom', path: ['ranks'], message: 'Rank ids must be unique.' })
    }
    const levels = new Set(rules.ranks.map((r) => r.minLevel))
    if (levels.size !== rules.ranks.length) {
      ctx.addIssue({ code: 'custom', path: ['ranks'], message: 'Two ranks cannot start at the same level.' })
    }
  })
export type GameRules = z.infer<typeof gameRulesSchema>

export function defaultRules(): GameRules {
  return gameRulesSchema.parse({})
}

export function parseRules(raw: unknown): GameRules {
  const parsed = gameRulesSchema.safeParse(raw ?? {})
  if (!parsed.success) return defaultRules()
  return { ...parsed.data, ranks: [...parsed.data.ranks].sort((a, b) => a.minLevel - b.minLevel) }
}

export function difficultyRule(rules: GameRules, id: DifficultyId): DifficultyRule {
  return rules.difficulties.find((d) => d.id === id) ?? DEFAULT_DIFFICULTIES.find((d) => d.id === id)!
}

/** The XP a quest is worth under the current rules, before the daily cap. */
export function questBaseXp(rules: GameRules, quest: { difficulty: DifficultyId; xpOverride: number | null }): number {
  const raw = quest.xpOverride ?? difficultyRule(rules, quest.difficulty).xp
  return Math.round(Math.min(rules.questXpMax, Math.max(rules.questXpMin, raw)))
}

/** Applies the daily quest XP cap. Returns the amount that will actually be awarded. */
export function applyDailyCap(rules: GameRules, base: number, alreadyEarnedToday: number): { amount: number; capped: boolean } {
  const remaining = Math.max(0, rules.dailyQuestXpCap - Math.max(0, alreadyEarnedToday))
  const amount = Math.min(base, remaining)
  return { amount, capped: amount < base }
}

/**
 * When a focus session qualifies for a reward, and how much.
 * Rule: a focus phase qualifies when it lasted at least `minQualifyingMinutes`
 * and was finished (not cancelled). XP = whole minutes × xpPerMinute, capped.
 * The app cannot verify that you actually stayed focused — this is an honour system.
 */
export function focusXp(rules: GameRules, actualSeconds: number): number {
  const minutes = Math.floor(actualSeconds / 60)
  if (minutes < rules.focus.minQualifyingMinutes) return 0
  return Math.min(rules.focus.maxXpPerSession, Math.round(minutes * rules.focus.xpPerMinute))
}
