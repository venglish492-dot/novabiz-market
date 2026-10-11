/**
 * The single source of truth for every persisted record.
 *
 * Types are inferred from these Zod schemas, and the same schemas validate
 * backups before import and fill in defaults for settings that were added in
 * newer versions of the app (so an update never wipes existing preferences).
 */
import { z } from 'zod'

export const idSchema = z.string().min(1).max(200)
export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
export const isoSchema = z.string().min(10).max(40)
export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a #RRGGBB colour')
const text = (max: number) => z.string().max(max)

/* ------------------------------------------------------------------ */
/* Attributes & categories                                            */
/* ------------------------------------------------------------------ */

export const attributeSchema = z.object({
  id: idSchema,
  abbr: z.string().min(1).max(6),
  name: z.string().min(1).max(40),
  description: text(400),
  color: hexColorSchema,
  order: z.number().int(),
  hidden: z.boolean(),
  builtin: z.boolean(),
})
export type AttributeDef = z.infer<typeof attributeSchema>

export const categorySchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(40),
  color: hexColorSchema,
  icon: z.string().max(40),
  attributeId: idSchema,
  order: z.number().int(),
  archived: z.boolean(),
  builtin: z.boolean(),
})
export type Category = z.infer<typeof categorySchema>

/* ------------------------------------------------------------------ */
/* Quests                                                             */
/* ------------------------------------------------------------------ */

export const DIFFICULTY_IDS = ['easy', 'normal', 'challenging', 'hard', 'epic'] as const
export const difficultySchema = z.enum(DIFFICULTY_IDS)
export type DifficultyId = z.infer<typeof difficultySchema>

export const QUEST_TYPES = [
  'one-time',
  'daily',
  'weekly',
  'custom',
  'milestone',
  'checklist',
  'measurable',
  'timed',
  'routine',
] as const
export const questTypeSchema = z.enum(QUEST_TYPES)
export type QuestType = z.infer<typeof questTypeSchema>

export const recurrenceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('daily') }),
  z.object({ kind: z.literal('weekdays'), days: z.array(z.number().int().min(0).max(6)).min(1).max(7) }),
  z.object({ kind: z.literal('weekly') }),
  z.object({ kind: z.literal('interval'), every: z.number().int().min(2).max(365) }),
])
export type Recurrence = z.infer<typeof recurrenceSchema>

export const checklistItemSchema = z.object({ id: idSchema, text: z.string().min(1).max(200) })
export type ChecklistItem = z.infer<typeof checklistItemSchema>

export const prioritySchema = z.enum(['low', 'normal', 'high'])
export type Priority = z.infer<typeof prioritySchema>

export const questSchema = z.object({
  id: idSchema,
  title: z.string().min(1).max(140),
  description: text(4000),
  type: questTypeSchema,
  categoryId: idSchema,
  difficulty: difficultySchema,
  estimatedMinutes: z.number().int().min(0).max(1440),
  /** Custom XP reward. null = use the difficulty default. Clamped by the game rules. */
  xpOverride: z.number().int().min(0).max(100_000).nullable(),
  attributeId: idSchema,
  goalId: idSchema.nullable(),
  milestoneId: idSchema.nullable(),
  dueDate: dateKeySchema.nullable(),
  startDate: dateKeySchema,
  recurrence: recurrenceSchema,
  tags: z.array(z.string().min(1).max(30)).max(20),
  checklist: z.array(checklistItemSchema).max(50),
  target: z.object({ value: z.number().positive().max(1_000_000), unit: text(20) }).nullable(),
  focusMinutes: z.number().int().min(1).max(240).nullable(),
  completionCondition: text(300),
  notes: text(4000),
  priority: prioritySchema,
  reminder: z.boolean(),
  status: z.enum(['active', 'completed', 'archived']),
  createdAt: isoSchema,
  updatedAt: isoSchema,
  completedAt: isoSchema.nullable(),
  archivedAt: isoSchema.nullable(),
})
export type Quest = z.infer<typeof questSchema>

/**
 * One completed occurrence. Its primary key is `${questId}::${occurrenceKey}`,
 * which makes a second completion of the same occurrence impossible.
 */
export const completionSchema = z.object({
  id: idSchema,
  completionId: idSchema,
  questId: idSchema,
  occurrenceKey: z.string().min(1).max(40),
  dateKey: dateKeySchema,
  completedAt: isoSchema,
  xpAwarded: z.number().int().min(0),
  xpCapped: z.boolean(),
  ledgerId: idSchema,
  title: z.string().max(140),
  categoryId: idSchema,
  attributeId: idSchema,
})
export type Completion = z.infer<typeof completionSchema>

export const occurrenceProgressSchema = z.object({
  id: idSchema,
  questId: idSchema,
  occurrenceKey: z.string().min(1).max(40),
  checked: z.array(idSchema),
  measured: z.number().min(0),
  updatedAt: isoSchema,
})
export type OccurrenceProgress = z.infer<typeof occurrenceProgressSchema>

/* ------------------------------------------------------------------ */
/* XP ledger                                                          */
/* ------------------------------------------------------------------ */

export const XP_SOURCES = ['quest', 'focus', 'achievement', 'goal', 'milestone', 'reversal'] as const
export const xpSourceSchema = z.enum(XP_SOURCES)
export type XpSource = z.infer<typeof xpSourceSchema>

/**
 * Append-only ledger. Lifetime XP, level, rank and attribute scores are all
 * derived from these rows, so every number on screen can be explained.
 */
export const xpEntrySchema = z.object({
  id: idSchema,
  amount: z.number().int(),
  source: xpSourceSchema,
  refId: idSchema,
  title: z.string().max(200),
  attributes: z.record(z.string(), z.number().int()),
  categoryId: idSchema.nullable(),
  createdAt: isoSchema,
  dateKey: dateKeySchema,
  reversesId: idSchema.nullable(),
})
export type XpEntry = z.infer<typeof xpEntrySchema>

/* ------------------------------------------------------------------ */
/* Focus                                                              */
/* ------------------------------------------------------------------ */

export const FOCUS_MODES = ['study', 'reading', 'coding', 'creative', 'general'] as const
export const focusModeSchema = z.enum(FOCUS_MODES)
export type FocusMode = z.infer<typeof focusModeSchema>
export const focusPhaseSchema = z.enum(['focus', 'break', 'long-break'])
export type FocusPhase = z.infer<typeof focusPhaseSchema>

export const focusSessionSchema = z.object({
  id: idSchema,
  mode: focusModeSchema,
  phase: focusPhaseSchema,
  plannedSeconds: z.number().int().min(1),
  actualSeconds: z.number().int().min(0),
  startedAt: isoSchema,
  endedAt: isoSchema,
  status: z.enum(['completed', 'canceled']),
  questId: idSchema.nullable(),
  occurrenceKey: z.string().max(40).nullable(),
  xpAwarded: z.number().int().min(0),
  ledgerId: idSchema.nullable(),
  dateKey: dateKeySchema,
})
export type FocusSession = z.infer<typeof focusSessionSchema>

export const activeTimerSchema = z.object({
  id: idSchema,
  mode: focusModeSchema,
  phase: focusPhaseSchema,
  plannedSeconds: z.number().int().min(1),
  /** epoch ms when the timer was (first) started */
  startedAt: z.number(),
  /** epoch ms when paused, or null while running */
  pausedAt: z.number().nullable(),
  pausedTotalMs: z.number().min(0),
  questId: idSchema.nullable(),
  occurrenceKey: z.string().max(40).nullable(),
  /** number of focus phases completed in this cycle (for long breaks) */
  cycle: z.number().int().min(0),
})
export type ActiveTimer = z.infer<typeof activeTimerSchema>

/* ------------------------------------------------------------------ */
/* Goals                                                              */
/* ------------------------------------------------------------------ */

export const goalSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(120),
  description: text(4000),
  categoryId: idSchema.nullable(),
  targetDate: dateKeySchema.nullable(),
  status: z.enum(['active', 'paused', 'completed', 'archived']),
  priority: prioritySchema,
  progressMode: z.enum(['milestones', 'quests', 'measurable']),
  measurable: z.object({ current: z.number().min(0), target: z.number().positive(), unit: text(20) }).nullable(),
  notes: text(4000),
  createdAt: isoSchema,
  updatedAt: isoSchema,
  completedAt: isoSchema.nullable(),
})
export type Goal = z.infer<typeof goalSchema>

export const milestoneSchema = z.object({
  id: idSchema,
  goalId: idSchema,
  title: z.string().min(1).max(140),
  dueDate: dateKeySchema.nullable(),
  done: z.boolean(),
  completedAt: isoSchema.nullable(),
  order: z.number().int(),
})
export type Milestone = z.infer<typeof milestoneSchema>

/* ------------------------------------------------------------------ */
/* Calendar, notes, notifications, activity                           */
/* ------------------------------------------------------------------ */

export const calendarEventSchema = z.object({
  id: idSchema,
  title: z.string().min(1).max(140),
  date: dateKeySchema,
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  notes: text(2000),
  categoryId: idSchema.nullable(),
  createdAt: isoSchema,
})
export type CalendarEvent = z.infer<typeof calendarEventSchema>

export const noteSchema = z.object({
  id: idSchema,
  dateKey: dateKeySchema,
  text: text(10_000),
  mood: z.number().int().min(1).max(5).nullable(),
  createdAt: isoSchema,
  updatedAt: isoSchema,
})
export type Note = z.infer<typeof noteSchema>

export const NOTIFICATION_KINDS = [
  'success',
  'info',
  'warning',
  'error',
  'level-up',
  'rank-up',
  'achievement',
  'goal',
  'focus',
] as const
export const notificationSchema = z.object({
  id: idSchema,
  kind: z.enum(NOTIFICATION_KINDS),
  title: z.string().max(200),
  body: text(1000),
  createdAt: isoSchema,
  read: z.boolean(),
})
export type AppNotification = z.infer<typeof notificationSchema>
export type NotificationKind = AppNotification['kind']

export const ACTIVITY_TYPES = [
  'quest-completed',
  'quest-undone',
  'focus-completed',
  'level-up',
  'rank-up',
  'achievement',
  'goal-completed',
  'milestone-completed',
  'skill-unlocked',
  'reward-claimed',
] as const
export const activitySchema = z.object({
  id: idSchema,
  type: z.enum(ACTIVITY_TYPES),
  title: z.string().max(200),
  createdAt: isoSchema,
  dateKey: dateKeySchema,
  refId: idSchema.nullable(),
  categoryId: idSchema.nullable(),
  xp: z.number().int(),
})
export type ActivityEvent = z.infer<typeof activitySchema>
export type ActivityType = ActivityEvent['type']

/* ------------------------------------------------------------------ */
/* Achievements, skills, rewards                                      */
/* ------------------------------------------------------------------ */

export const achievementUnlockSchema = z.object({
  id: idSchema,
  unlockedAt: isoSchema,
  xpAwarded: z.number().int().min(0),
})
export type AchievementUnlock = z.infer<typeof achievementUnlockSchema>

export const skillRequirementSchema = z.object({
  attributeXp: z.number().int().min(0).max(10_000_000),
  minRankIndex: z.number().int().min(0).max(20).nullable(),
  categoryId: idSchema.nullable(),
  categoryCompletions: z.number().int().min(0).max(100_000),
  goalsCompleted: z.number().int().min(0).max(10_000),
  goalId: idSchema.nullable(),
})
export type SkillRequirement = z.infer<typeof skillRequirementSchema>

export const skillNodeSchema = z.object({
  id: idSchema,
  branch: idSchema,
  name: z.string().min(1).max(60),
  description: text(400),
  prerequisiteId: idSchema.nullable(),
  requirement: skillRequirementSchema,
  /** a title unlocked together with this node */
  title: z.string().max(40).nullable(),
  custom: z.boolean(),
  createdAt: isoSchema,
})
export type SkillNodeDef = z.infer<typeof skillNodeSchema>

export const skillUnlockSchema = z.object({ id: idSchema, unlockedAt: isoSchema })
export type SkillUnlock = z.infer<typeof skillUnlockSchema>

export const rewardTriggerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('manual') }),
  z.object({ type: z.literal('level'), level: z.number().int().min(1).max(9999) }),
  z.object({ type: z.literal('goal'), goalId: idSchema }),
  z.object({ type: z.literal('milestone'), milestoneId: idSchema }),
  z.object({ type: z.literal('achievement'), achievementId: idSchema }),
])
export type RewardTrigger = z.infer<typeof rewardTriggerSchema>

export const rewardSchema = z.object({
  id: idSchema,
  title: z.string().min(1).max(120),
  description: text(1000),
  trigger: rewardTriggerSchema,
  claimedAt: isoSchema.nullable(),
  createdAt: isoSchema,
})
export type Reward = z.infer<typeof rewardSchema>

export const snapshotSchema = z.object({
  id: idSchema,
  createdAt: isoSchema,
  reason: z.string().max(200),
  json: z.string(),
})
export type Snapshot = z.infer<typeof snapshotSchema>

export const configRecordSchema = z.object({ key: idSchema, value: z.unknown() })
export type ConfigRecord = z.infer<typeof configRecordSchema>
