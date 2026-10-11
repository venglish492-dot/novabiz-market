/**
 * Initial configuration created once, on the very first launch.
 * These are editable starting points, not progress. No fake activity is seeded.
 */
import type { AttributeDef, Category } from '@/domain/schemas'

export const DEFAULT_ATTRIBUTES: AttributeDef[] = [
  {
    id: 'int',
    abbr: 'INT',
    name: 'Intelligence',
    description: 'Learning and analytical work: study, mathematics, languages, programming.',
    color: '#38bdf8',
    order: 0,
    hidden: false,
    builtin: true,
  },
  {
    id: 'str',
    abbr: 'STR',
    name: 'Strength',
    description: 'Physical activity: exercise, training, movement and sport.',
    color: '#f87171',
    order: 1,
    hidden: false,
    builtin: true,
  },
  {
    id: 'disc',
    abbr: 'DISC',
    name: 'Discipline',
    description: 'Consistency. Grows from recurring quests and routines you keep returning to.',
    color: '#fbbf24',
    order: 2,
    hidden: false,
    builtin: true,
  },
  {
    id: 'wis',
    abbr: 'WIS',
    name: 'Wisdom',
    description: 'Reading, reflection, journaling and healthy routines.',
    color: '#34d399',
    order: 3,
    hidden: false,
    builtin: true,
  },
  {
    id: 'cre',
    abbr: 'CRE',
    name: 'Creativity',
    description: 'Creative work, design and personal projects.',
    color: '#c084fc',
    order: 4,
    hidden: false,
    builtin: true,
  },
  {
    id: 'foc',
    abbr: 'FOC',
    name: 'Focus',
    description: 'Completed focus sessions in the Focus Chamber.',
    color: '#22d3ee',
    order: 5,
    hidden: false,
    builtin: true,
  },
  {
    id: 'cons',
    abbr: 'CONS',
    name: 'Consistency',
    description: 'Optional extra stat for habits. Assign it to quests you want to track as habits.',
    color: '#a3e635',
    order: 6,
    hidden: true,
    builtin: true,
  },
  {
    id: 'soc',
    abbr: 'SOC',
    name: 'Social Confidence',
    description: 'Optional stat for social goals: conversations, presentations, meeting people.',
    color: '#fb923c',
    order: 7,
    hidden: true,
    builtin: true,
  },
]

const cat = (id: string, name: string, color: string, icon: string, attributeId: string, order: number): Category => ({
  id,
  name,
  color,
  icon,
  attributeId,
  order,
  archived: false,
  builtin: true,
})

export const DEFAULT_CATEGORIES: Category[] = [
  cat('study', 'Study', '#38bdf8', 'graduation-cap', 'int', 0),
  cat('math', 'Mathematics', '#60a5fa', 'sigma', 'int', 1),
  cat('english', 'English', '#818cf8', 'languages', 'int', 2),
  cat('reading', 'Reading', '#34d399', 'book-open', 'wis', 3),
  cat('exercise', 'Exercise', '#f87171', 'dumbbell', 'str', 4),
  cat('projects', 'Personal projects', '#c084fc', 'rocket', 'cre', 5),
  cat('programming', 'Programming', '#22d3ee', 'code', 'int', 6),
  cat('design', 'Design', '#f472b6', 'pen-tool', 'cre', 7),
  cat('creative', 'Creative work', '#e879f9', 'palette', 'cre', 8),
  cat('health', 'Healthy routines', '#a3e635', 'heart-pulse', 'wis', 9),
  cat('reflection', 'Reflection', '#fbbf24', 'sparkles', 'wis', 10),
  cat('general', 'General', '#94a3b8', 'circle-dot', 'disc', 11),
]

/** Category groups used by achievements and skill nodes. */
export const LEARNING_CATEGORIES = ['study', 'math', 'english', 'programming']
export const PROJECT_CATEGORIES = ['projects', 'programming', 'design', 'creative']
