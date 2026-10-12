/**
 * Derives the player's progression state from the XP ledger.
 * The ledger is the single source of truth; nothing here is stored.
 */
import type { XpEntry } from '@/domain/schemas'
import { attributeLevel, levelInfo, rankForLevel, type LevelInfo, type RankInfo } from './levels'
import type { GameRules } from './rules'

export interface ProgressState {
  totalXp: number
  level: LevelInfo
  rank: RankInfo
  attributePoints: Record<string, number>
  attributeLevels: Record<string, { level: number; progress: number; next: number }>
}

export function sumLedger(entries: Pick<XpEntry, 'amount'>[]): number {
  let total = 0
  for (const e of entries) total += e.amount
  return Math.max(0, total)
}

export function attributeTotals(entries: Pick<XpEntry, 'attributes'>[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const e of entries) {
    for (const [attr, pts] of Object.entries(e.attributes)) totals[attr] = (totals[attr] ?? 0) + pts
  }
  for (const k of Object.keys(totals)) totals[k] = Math.max(0, totals[k])
  return totals
}

export function computeProgress(entries: XpEntry[], rules: GameRules): ProgressState {
  const totalXp = sumLedger(entries)
  const level = levelInfo(totalXp, rules)
  const attributePoints = attributeTotals(entries)
  const attributeLevels: ProgressState['attributeLevels'] = {}
  for (const [k, v] of Object.entries(attributePoints)) attributeLevels[k] = attributeLevel(v, rules.attributeCurveBase)
  return { totalXp, level, rank: rankForLevel(level.level, rules.ranks), attributePoints, attributeLevels }
}
