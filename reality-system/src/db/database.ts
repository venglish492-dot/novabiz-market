/**
 * IndexedDB persistence (via Dexie).
 *
 * Migration policy
 * ----------------
 * - Never delete or reset the database because the app version changed.
 * - Each schema change adds a NEW `this.version(n)` block below, with an
 *   `.upgrade()` function that transforms existing rows in place.
 * - Older version blocks are kept so any older database can be upgraded step by step.
 * - App-level data migrations (shape changes inside config values) live in
 *   `migrations.ts` and are tracked by `meta.dataVersion`.
 */
import Dexie, { type Table } from 'dexie'
import type {
  AchievementUnlock,
  ActivityEvent,
  AppNotification,
  AttributeDef,
  CalendarEvent,
  Category,
  Completion,
  ConfigRecord,
  FocusSession,
  Goal,
  Milestone,
  Note,
  OccurrenceProgress,
  Quest,
  Reward,
  SkillNodeDef,
  SkillUnlock,
  Snapshot,
  XpEntry,
} from '@/domain/schemas'

export const DB_NAME = 'reality-system'

export class RealityDB extends Dexie {
  config!: Table<ConfigRecord, string>
  attributes!: Table<AttributeDef, string>
  categories!: Table<Category, string>
  quests!: Table<Quest, string>
  completions!: Table<Completion, string>
  progress!: Table<OccurrenceProgress, string>
  ledger!: Table<XpEntry, string>
  focusSessions!: Table<FocusSession, string>
  goals!: Table<Goal, string>
  milestones!: Table<Milestone, string>
  events!: Table<CalendarEvent, string>
  notes!: Table<Note, string>
  achievements!: Table<AchievementUnlock, string>
  skillNodes!: Table<SkillNodeDef, string>
  skillUnlocks!: Table<SkillUnlock, string>
  rewards!: Table<Reward, string>
  notifications!: Table<AppNotification, string>
  activity!: Table<ActivityEvent, string>
  snapshots!: Table<Snapshot, string>

  constructor(name = DB_NAME) {
    super(name)
    this.version(1).stores({
      config: 'key',
      attributes: 'id, order',
      categories: 'id, order',
      quests: 'id, status, categoryId, goalId, milestoneId, dueDate, createdAt, type',
      completions: 'id, questId, dateKey, completedAt, categoryId',
      progress: 'id, questId',
      ledger: 'id, source, refId, dateKey, createdAt',
      focusSessions: 'id, dateKey, startedAt, questId, status',
      goals: 'id, status, targetDate, createdAt',
      milestones: 'id, goalId, dueDate, done',
      events: 'id, date',
      notes: 'id, dateKey',
      achievements: 'id, unlockedAt',
      skillNodes: 'id, branch',
      skillUnlocks: 'id',
      rewards: 'id, createdAt',
      notifications: 'id, createdAt, read',
      activity: 'id, dateKey, createdAt, type',
      snapshots: 'id, createdAt',
    })
  }
}

/** All user-data tables (used by backup, import, reset and record counts). */
export const DATA_TABLES = [
  'config',
  'attributes',
  'categories',
  'quests',
  'completions',
  'progress',
  'ledger',
  'focusSessions',
  'goals',
  'milestones',
  'events',
  'notes',
  'achievements',
  'skillNodes',
  'skillUnlocks',
  'rewards',
  'notifications',
  'activity',
] as const
export type DataTableName = (typeof DATA_TABLES)[number]

let instance: RealityDB | null = null

export function getDb(): RealityDB {
  if (!instance) instance = new RealityDB()
  return instance
}

/** Test helper: swap in a fresh database instance. */
export function setDbForTests(db: RealityDB): void {
  instance = db
}

export function tableOf(db: RealityDB, name: DataTableName): Table<unknown, string> {
  return db.table(name) as Table<unknown, string>
}
