/**
 * Deterministic level curve. All level math goes through these functions.
 * Levels start at 1. XP to advance from level L to L+1 = round(base × L^exponent).
 */
import type { GameRules, RankDef } from './rules'

export interface LevelCurve {
  base: number
  exponent: number
}

export function xpToNextLevel(level: number, curve: LevelCurve): number {
  return Math.max(1, Math.round(curve.base * Math.pow(Math.max(1, level), curve.exponent)))
}

/** Lifetime XP needed to *reach* `level` (level 1 = 0). */
export function totalXpForLevel(level: number, curve: LevelCurve): number {
  let total = 0
  for (let l = 1; l < level; l++) total += xpToNextLevel(l, curve)
  return total
}

export interface LevelInfo {
  level: number
  /** XP earned inside the current level */
  xpIntoLevel: number
  /** XP the current level requires in total */
  xpForNext: number
  /** XP still missing to reach the next level */
  xpRemaining: number
  /** 0–1 progress through the current level */
  progress: number
  totalXp: number
  isMaxLevel: boolean
}

export function levelFromTotalXp(totalXp: number, curve: LevelCurve, maxLevel = 999): LevelInfo {
  const total = Math.max(0, Math.floor(totalXp))
  let level = 1
  let remaining = total
  while (level < maxLevel) {
    const need = xpToNextLevel(level, curve)
    if (remaining < need) break
    remaining -= need
    level++
  }
  const isMaxLevel = level >= maxLevel
  const xpForNext = isMaxLevel ? 0 : xpToNextLevel(level, curve)
  return {
    level,
    xpIntoLevel: isMaxLevel ? 0 : remaining,
    xpForNext,
    xpRemaining: isMaxLevel ? 0 : xpForNext - remaining,
    progress: isMaxLevel ? 1 : remaining / xpForNext,
    totalXp: total,
    isMaxLevel,
  }
}

export function levelInfo(totalXp: number, rules: GameRules): LevelInfo {
  return levelFromTotalXp(totalXp, rules.levelCurve, rules.maxLevel)
}

/** Ranks sorted ascending by minLevel. */
export function sortedRanks(ranks: RankDef[]): RankDef[] {
  return [...ranks].sort((a, b) => a.minLevel - b.minLevel)
}

export interface RankInfo {
  rank: RankDef
  index: number
  next: RankDef | null
}

/** Rank is a larger milestone than level: the highest rank whose minLevel ≤ level. */
export function rankForLevel(level: number, ranks: RankDef[]): RankInfo {
  const sorted = sortedRanks(ranks)
  let index = 0
  for (let i = 0; i < sorted.length; i++) if (sorted[i].minLevel <= level) index = i
  return { rank: sorted[index], index, next: sorted[index + 1] ?? null }
}

export interface LevelTransition {
  levelBefore: number
  levelAfter: number
  levelsGained: number
  rankBefore: RankDef
  rankAfter: RankDef
  rankChanged: boolean
}

export function describeTransition(totalBefore: number, totalAfter: number, rules: GameRules): LevelTransition {
  const before = levelInfo(totalBefore, rules)
  const after = levelInfo(totalAfter, rules)
  const rb = rankForLevel(before.level, rules.ranks)
  const ra = rankForLevel(after.level, rules.ranks)
  return {
    levelBefore: before.level,
    levelAfter: after.level,
    levelsGained: after.level - before.level,
    rankBefore: rb.rank,
    rankAfter: ra.rank,
    rankChanged: rb.rank.id !== ra.rank.id && ra.index > rb.index,
  }
}

/** Attribute level n requires base × (n − 1)² points. Attribute level 1 = 0 points. */
export function attributeLevel(points: number, base: number): { level: number; progress: number; next: number } {
  const p = Math.max(0, points)
  const level = Math.floor(Math.sqrt(p / base)) + 1
  const current = base * (level - 1) ** 2
  const next = base * level ** 2
  return { level, progress: (p - current) / (next - current), next }
}
