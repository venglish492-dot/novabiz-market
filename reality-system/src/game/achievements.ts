/**
 * Modular achievement engine. Conditions are pure functions of `Stats`,
 * which is built from stored data, so nothing can be unlocked without a
 * matching real record. Unlocks are stored with the achievement id as the
 * primary key, so the same achievement can never be awarded twice.
 *
 * Achievements reward sustainable behaviour (total progress, returning after
 * a break) — never streak pressure, and nothing is lost for taking breaks.
 */
import type { Stats } from './stats'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  rarity: Rarity
  xp: number
  /** a profile title unlocked with this achievement */
  title?: string
  progress: (s: Stats) => { current: number; target: number }
}

const count = (fn: (s: Stats) => number, target: number) => (s: Stats) => ({ current: Math.min(fn(s), target), target })
const flag = (fn: (s: Stats) => boolean) => (s: Stats) => ({ current: fn(s) ? 1 : 0, target: 1 })

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-awakening',
    name: 'First Awakening',
    description: 'Initialize your system and complete the setup.',
    icon: 'sunrise',
    rarity: 'common',
    xp: 10,
    title: 'The Awakened',
    progress: flag((s) => s.onboardingComplete),
  },
  {
    id: 'first-quest',
    name: 'First Quest',
    description: 'Complete your first quest.',
    icon: 'swords',
    rarity: 'common',
    xp: 10,
    progress: count((s) => s.totalCompletions, 1),
  },
  {
    id: 'first-focus',
    name: 'First Focus Session',
    description: 'Finish a qualifying focus session in the Focus Chamber.',
    icon: 'timer',
    rarity: 'common',
    xp: 10,
    progress: count((s) => s.focusSessions, 1),
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Visit eight different sections of the system.',
    icon: 'compass',
    rarity: 'common',
    xp: 10,
    progress: count((s) => s.visitedViews, 8),
  },
  {
    id: 'return-to-system',
    name: 'Return to the System',
    description: 'Come back after a break of a few days. Rest is part of progress.',
    icon: 'rotate-ccw',
    rarity: 'common',
    xp: 15,
    progress: flag((s) => s.returnedAfterBreak),
  },
  {
    id: 'first-skill',
    name: 'First Skill',
    description: 'Unlock your first skill-tree node.',
    icon: 'git-branch',
    rarity: 'common',
    xp: 15,
    progress: count((s) => s.skillUnlocks, 1),
  },
  {
    id: 'quest-runner',
    name: 'Quest Runner',
    description: 'Complete 25 quests in total.',
    icon: 'zap',
    rarity: 'uncommon',
    xp: 25,
    progress: count((s) => s.totalCompletions, 25),
  },
  {
    id: 'consistent-learner',
    name: 'Consistent Learner',
    description: 'Complete learning quests (study, mathematics, English, programming) on 7 different days.',
    icon: 'graduation-cap',
    rarity: 'uncommon',
    xp: 30,
    title: 'Scholar in Training',
    progress: count((s) => s.learningDays, 7),
  },
  {
    id: 'project-builder',
    name: 'Project Builder',
    description: 'Complete 10 quests in projects, programming, design or creative work.',
    icon: 'hammer',
    rarity: 'uncommon',
    xp: 30,
    title: 'Builder',
    progress: count((s) => s.projectCompletions, 10),
  },
  {
    id: 'reading-milestone',
    name: 'Reading Milestone',
    description: 'Complete 10 reading quests or 300 minutes of reading focus.',
    icon: 'book-open',
    rarity: 'uncommon',
    xp: 30,
    progress: (s) => {
      const pct = Math.max(s.readingCompletions / 10, s.readingFocusMinutes / 300)
      return { current: Math.min(100, Math.floor(pct * 100)), target: 100 }
    },
  },
  {
    id: 'stepping-stones',
    name: 'Stepping Stones',
    description: 'Complete 5 goal milestones.',
    icon: 'milestone',
    rarity: 'uncommon',
    xp: 25,
    progress: count((s) => s.milestonesCompleted, 5),
  },
  {
    id: 'rising-signal',
    name: 'Rising Signal',
    description: 'Reach level 5.',
    icon: 'trending-up',
    rarity: 'uncommon',
    xp: 20,
    progress: count((s) => s.level, 5),
  },
  {
    id: 'goal-completed',
    name: 'Goal Completed',
    description: 'Finish a long-term goal.',
    icon: 'flag',
    rarity: 'rare',
    xp: 50,
    title: 'Goal Breaker',
    progress: count((s) => s.goalsCompleted, 1),
  },
  {
    id: 'master-of-routine',
    name: 'Master of Routine',
    description: 'Complete 30 occurrences of recurring quests or routines.',
    icon: 'repeat',
    rarity: 'rare',
    xp: 50,
    title: 'Master of Routine',
    progress: count((s) => s.recurringCompletions, 30),
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    description: 'Accumulate 10 hours of completed focus sessions.',
    icon: 'brain',
    rarity: 'rare',
    xp: 40,
    title: 'Deep Diver',
    progress: count((s) => s.focusMinutes, 600),
  },
  {
    id: 'centurion',
    name: 'Centurion of Quests',
    description: 'Complete 100 quests in total.',
    icon: 'shield',
    rarity: 'rare',
    xp: 50,
    title: 'Centurion',
    progress: count((s) => s.totalCompletions, 100),
  },
  {
    id: 'steady-ascent',
    name: 'Steady Ascent',
    description: 'Reach level 10.',
    icon: 'mountain',
    rarity: 'rare',
    xp: 40,
    progress: count((s) => s.level, 10),
  },
  {
    id: 'third-rank',
    name: 'Pathfinder Protocol',
    description: 'Reach the third rank of your rank system.',
    icon: 'award',
    rarity: 'epic',
    xp: 60,
    progress: count((s) => s.rankIndex, 2),
  },
  {
    id: 'thirty-days',
    name: 'Thirty Days of Presence',
    description: 'Be active on 30 different days — they do not need to be consecutive.',
    icon: 'calendar-check',
    rarity: 'epic',
    xp: 75,
    title: 'Ever-Present',
    progress: count((s) => s.activeDays, 30),
  },
  {
    id: 'top-rank',
    name: 'Sovereign Signal',
    description: 'Reach the sixth rank of your rank system.',
    icon: 'crown',
    rarity: 'legendary',
    xp: 150,
    title: 'Sovereign',
    progress: count((s) => s.rankIndex, 5),
  },
]

export function isAchieved(def: AchievementDef, stats: Stats): boolean {
  const p = def.progress(stats)
  return p.current >= p.target
}

export const RARITY_INFO: Record<Rarity, { label: string; color: string }> = {
  common: { label: 'Common', color: '#94a3b8' },
  uncommon: { label: 'Uncommon', color: '#34d399' },
  rare: { label: 'Rare', color: '#38bdf8' },
  epic: { label: 'Epic', color: '#c084fc' },
  legendary: { label: 'Legendary', color: '#fbbf24' },
}
