import { describe, expect, it } from 'vitest'
import { attributeLevel, describeTransition, levelFromTotalXp, rankForLevel, totalXpForLevel, xpToNextLevel } from './levels'
import { DEFAULT_RANKS, applyDailyCap, defaultRules, focusXp, gameRulesSchema, questBaseXp } from './rules'

const curve = { base: 100, exponent: 1.15 }

describe('level curve', () => {
  it('starts at level 1 with zero XP', () => {
    const info = levelFromTotalXp(0, curve)
    expect(info.level).toBe(1)
    expect(info.xpIntoLevel).toBe(0)
    expect(info.xpForNext).toBe(100)
  })

  it('is deterministic and increasing', () => {
    for (let l = 1; l < 60; l++) expect(xpToNextLevel(l + 1, curve)).toBeGreaterThan(xpToNextLevel(l, curve))
  })

  it('handles exact boundaries without drift', () => {
    for (let l = 2; l <= 40; l++) {
      const boundary = totalXpForLevel(l, curve)
      expect(levelFromTotalXp(boundary - 1, curve).level).toBe(l - 1)
      expect(levelFromTotalXp(boundary, curve).level).toBe(l)
      expect(levelFromTotalXp(boundary, curve).xpIntoLevel).toBe(0)
      expect(levelFromTotalXp(boundary + 1, curve).xpIntoLevel).toBe(1)
    }
  })

  it('reports consistent remaining XP', () => {
    const info = levelFromTotalXp(250, curve)
    expect(info.xpIntoLevel + info.xpRemaining).toBe(info.xpForNext)
    expect(totalXpForLevel(info.level, curve) + info.xpIntoLevel).toBe(250)
  })

  it('handles multiple level-ups from one award', () => {
    const rules = defaultRules()
    const t = describeTransition(0, totalXpForLevel(4, rules.levelCurve) + 5, rules)
    expect(t.levelBefore).toBe(1)
    expect(t.levelAfter).toBe(4)
    expect(t.levelsGained).toBe(3)
  })

  it('caps at the max level', () => {
    const info = levelFromTotalXp(10_000_000_000, curve, 50)
    expect(info.level).toBe(50)
    expect(info.isMaxLevel).toBe(true)
    expect(info.progress).toBe(1)
  })

  it('ignores negative and fractional totals', () => {
    expect(levelFromTotalXp(-50, curve).level).toBe(1)
    expect(levelFromTotalXp(99.9, curve).level).toBe(1)
  })
})

describe('ranks', () => {
  it('maps levels to ranks at their thresholds', () => {
    expect(rankForLevel(1, DEFAULT_RANKS).rank.id).toBe('E')
    expect(rankForLevel(4, DEFAULT_RANKS).rank.id).toBe('E')
    expect(rankForLevel(5, DEFAULT_RANKS).rank.id).toBe('D')
    expect(rankForLevel(10, DEFAULT_RANKS).rank.id).toBe('C')
    expect(rankForLevel(999, DEFAULT_RANKS).rank.id).toBe('S')
    expect(rankForLevel(999, DEFAULT_RANKS).next).toBeNull()
  })

  it('works with unsorted custom ranks', () => {
    const custom = [DEFAULT_RANKS[2], DEFAULT_RANKS[0], DEFAULT_RANKS[1]]
    expect(rankForLevel(6, custom).rank.id).toBe('D')
  })

  it('flags a rank change only when the rank actually increases', () => {
    const rules = defaultRules()
    const atFive = totalXpForLevel(5, rules.levelCurve)
    expect(describeTransition(atFive - 10, atFive, rules).rankChanged).toBe(true)
    expect(describeTransition(0, atFive - 1, rules).rankChanged).toBe(false)
  })
})

describe('rules', () => {
  it('uses difficulty defaults and clamps custom rewards', () => {
    const rules = defaultRules()
    expect(questBaseXp(rules, { difficulty: 'normal', xpOverride: null })).toBe(20)
    expect(questBaseXp(rules, { difficulty: 'easy', xpOverride: 99999 })).toBe(rules.questXpMax)
    expect(questBaseXp(rules, { difficulty: 'easy', xpOverride: 0 })).toBe(rules.questXpMin)
  })

  it('applies the daily cap', () => {
    const rules = { ...defaultRules(), dailyQuestXpCap: 100 }
    expect(applyDailyCap(rules, 30, 50)).toEqual({ amount: 30, capped: false })
    expect(applyDailyCap(rules, 30, 80)).toEqual({ amount: 20, capped: true })
    expect(applyDailyCap(rules, 30, 120)).toEqual({ amount: 0, capped: true })
  })

  it('awards focus XP only for qualifying sessions', () => {
    const rules = defaultRules()
    expect(focusXp(rules, 9 * 60 + 59)).toBe(0)
    expect(focusXp(rules, 25 * 60)).toBe(25)
    expect(focusXp(rules, 600 * 60)).toBe(rules.focus.maxXpPerSession)
  })

  it('rejects invalid custom rules', () => {
    expect(gameRulesSchema.safeParse({ questXpMin: 50, questXpMax: 10 }).success).toBe(false)
    expect(gameRulesSchema.safeParse({ ranks: [{ ...DEFAULT_RANKS[1] }] }).success).toBe(false)
    expect(gameRulesSchema.safeParse({}).success).toBe(true)
  })
})

describe('attribute levels', () => {
  it('grows quadratically', () => {
    expect(attributeLevel(0, 40).level).toBe(1)
    expect(attributeLevel(39, 40).level).toBe(1)
    expect(attributeLevel(40, 40).level).toBe(2)
    expect(attributeLevel(160, 40).level).toBe(3)
  })
})
