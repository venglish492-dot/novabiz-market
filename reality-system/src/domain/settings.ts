/**
 * Preferences and profile schemas. Every field has a default, so parsing an
 * older (or empty) object always yields a complete, valid value. New settings
 * added in future versions are filled in without touching existing choices.
 */
import { z } from 'zod'
import { dateKeySchema, hexColorSchema, isoSchema } from './schemas'

export const THEME_IDS = [
  'void-blue',
  'violet-eclipse',
  'crimson-hunter',
  'emerald-matrix',
  'arctic-silver',
  'golden-ascension',
  'cyberpunk-neon',
  'dark-obsidian',
  'celestial-purple',
  'midnight-rose',
  'monochrome',
  'custom',
] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const BACKGROUND_IDS = [
  'nebula',
  'void',
  'particles',
  'gradient',
  'grid',
  'starfield',
  'fog',
  'constellation',
  'waves',
  'circuit',
  'crystal',
  'arena',
] as const
export type BackgroundId = (typeof BACKGROUND_IDS)[number]

export const MOTION_LEVELS = ['minimal', 'balanced', 'cinematic', 'maximum'] as const
export type MotionLevel = (typeof MOTION_LEVELS)[number]

export const ROUTE_IDS = [
  'overview',
  'quests',
  'archive',
  'goals',
  'status',
  'skills',
  'focus',
  'calendar',
  'achievements',
  'reports',
  'customize',
  'settings',
] as const
export type RouteId = (typeof ROUTE_IDS)[number]

export const WIDGET_IDS = [
  'profile',
  'core',
  'message',
  'missions',
  'attributes',
  'productivity',
  'planner',
  'milestones',
  'activity',
] as const
export type WidgetId = (typeof WIDGET_IDS)[number]

export const DEFAULT_WIDGETS: Array<{ id: WidgetId; visible: boolean; collapsed: boolean; wide: boolean }> = [
  { id: 'profile', visible: true, collapsed: false, wide: false },
  { id: 'core', visible: true, collapsed: false, wide: false },
  { id: 'message', visible: true, collapsed: false, wide: true },
  { id: 'missions', visible: true, collapsed: false, wide: true },
  { id: 'attributes', visible: true, collapsed: false, wide: false },
  { id: 'productivity', visible: true, collapsed: false, wide: false },
  { id: 'planner', visible: true, collapsed: false, wide: false },
  { id: 'milestones', visible: true, collapsed: false, wide: false },
  { id: 'activity', visible: true, collapsed: false, wide: false },
]

const widgetSchema = z.object({
  id: z.enum(WIDGET_IDS),
  visible: z.boolean(),
  collapsed: z.boolean(),
  wide: z.boolean(),
})

export const appearanceSchema = z.object({
  themeId: z.enum(THEME_IDS).default('void-blue'),
  customTheme: z
    .object({
      accent: hexColorSchema.default('#38bdf8'),
      accent2: hexColorSchema.default('#8b5cf6'),
      highlight: hexColorSchema.default('#e2b955'),
      background: hexColorSchema.default('#060a17'),
    })
    .prefault({}),
  backgroundId: z.enum(BACKGROUND_IDS).default('nebula'),
  backgroundEnabled: z.boolean().default(true),
  /** 0 = still, 1 = full speed */
  backgroundMotion: z.number().min(0).max(1).default(0.5),
  backgroundIntensity: z.number().min(0).max(1).default(0.7),
  motion: z.enum(MOTION_LEVELS).default('balanced'),
  /** 'system' follows the OS setting; 'reduce' always reduces; 'allow' ignores the OS hint */
  reducedMotion: z.enum(['system', 'reduce', 'allow']).default('system'),
  density: z.enum(['comfortable', 'compact', 'spacious']).default('comfortable'),
  sidebar: z.enum(['left', 'right']).default('left'),
  navCompact: z.boolean().default(false),
  enable3D: z.boolean().default(true),
  quality: z.enum(['auto', 'low', 'medium', 'high']).default('auto'),
  statusMode: z.enum(['3d', '2d']).default('3d'),
  xpFormat: z.enum(['full', 'compact', 'percent']).default('full'),
  dateFormat: z.enum(['locale', 'iso', 'dmy', 'mdy']).default('locale'),
  profileCardStyle: z.enum(['holo', 'minimal', 'framed']).default('holo'),
})
export type Appearance = z.infer<typeof appearanceSchema>

export const AVATAR_STYLES = ['core', 'emblem', 'crystal', 'sphere', 'silhouette', 'initials', 'image'] as const
export const CORE_SHAPES = ['icosahedron', 'octahedron', 'dodecahedron', 'torus-knot', 'prism'] as const
export const AVATAR_FRAMES = ['hex', 'circle', 'diamond', 'shield', 'none'] as const

export const avatarSchema = z.object({
  style: z.enum(AVATAR_STYLES).default('core'),
  coreShape: z.enum(CORE_SHAPES).default('icosahedron'),
  /** null = follow the theme accent */
  coreColor: hexColorSchema.nullable().default(null),
  emission: z.number().min(0).max(2).default(1),
  rotation: z.enum(['still', 'calm', 'steady', 'fast']).default('calm'),
  particles: z.enum(['none', 'orbit', 'sparks', 'halo']).default('orbit'),
  frame: z.enum(AVATAR_FRAMES).default('hex'),
  /** A locally imported image stored as a data URL. Never uploaded. */
  imageDataUrl: z.string().max(2_000_000).nullable().default(null),
})
export type AvatarConfig = z.infer<typeof avatarSchema>

export const soundSchema = z.object({
  enabled: z.boolean().default(false),
  volume: z.number().min(0).max(1).default(0.5),
  quest: z.boolean().default(true),
  levelUp: z.boolean().default(true),
  rankUp: z.boolean().default(true),
  achievement: z.boolean().default(true),
  ui: z.boolean().default(false),
  timer: z.boolean().default(true),
  ambient: z.boolean().default(false),
})
export type SoundSettings = z.infer<typeof soundSchema>

export const generalSchema = z.object({
  weekStart: z.union([z.literal(0), z.literal(1)]).default(1),
  /** hour (0–23) at which a new logical day begins */
  resetHour: z.number().int().min(0).max(23).default(4),
  defaultView: z.enum(ROUTE_IDS).default('overview'),
  dailyQuestLimit: z.number().int().min(1).max(50).default(8),
  dailyCapacityMinutes: z.number().int().min(15).max(1440).default(240),
  playIntroOnLaunch: z.boolean().default(false),
  backupReminder: z.boolean().default(true),
  backupReminderDays: z.number().int().min(1).max(90).default(7),
  lastBackupAt: isoSchema.nullable().default(null),
  browserNotifications: z.boolean().default(false),
})
export type GeneralSettings = z.infer<typeof generalSchema>

export const navigationSchema = z.object({
  labels: z.record(z.string(), z.string().max(30)).default({}),
  hidden: z.array(z.enum(ROUTE_IDS)).default([]),
})

export const focusSettingsSchema = z.object({
  focusMinutes: z.number().int().min(5).max(120).default(25),
  breakMinutes: z.number().int().min(1).max(60).default(5),
  longBreakMinutes: z.number().int().min(5).max(60).default(15),
  longBreakEvery: z.number().int().min(2).max(8).default(4),
  breaksEnabled: z.boolean().default(true),
  defaultMode: z.enum(['study', 'reading', 'coding', 'creative', 'general']).default('study'),
})
export type FocusSettings = z.infer<typeof focusSettingsSchema>

export const settingsSchema = z.object({
  appearance: appearanceSchema.prefault({}),
  avatar: avatarSchema.prefault({}),
  sound: soundSchema.prefault({}),
  general: generalSchema.prefault({}),
  navigation: navigationSchema.prefault({}),
  focus: focusSettingsSchema.prefault({}),
  dashboard: z
    .object({ widgets: z.array(widgetSchema).default(DEFAULT_WIDGETS) })
    .prefault({}),
})
export type Settings = z.infer<typeof settingsSchema>
export type WidgetConfig = Settings['dashboard']['widgets'][number]

export function defaultSettings(): Settings {
  return settingsSchema.parse({})
}

/** Parses stored settings; invalid sections fall back to defaults instead of crashing. */
export function parseSettings(raw: unknown): Settings {
  const ok = settingsSchema.safeParse(raw ?? {})
  if (ok.success) return normalizeWidgets(ok.data)
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const merged: Record<string, unknown> = {}
  for (const key of Object.keys(settingsSchema.shape) as Array<keyof Settings>) {
    const section = settingsSchema.shape[key].safeParse(obj[key] ?? {})
    merged[key] = section.success ? section.data : settingsSchema.shape[key].parse({})
  }
  return normalizeWidgets(merged as Settings)
}

/** Ensures every known widget appears exactly once (new widgets get appended). */
function normalizeWidgets(settings: Settings): Settings {
  const seen = new Set<string>()
  const widgets = settings.dashboard.widgets.filter((w) => (seen.has(w.id) ? false : (seen.add(w.id), true)))
  for (const w of DEFAULT_WIDGETS) if (!seen.has(w.id)) widgets.push({ ...w })
  return { ...settings, dashboard: { widgets } }
}

export const profileSchema = z.object({
  id: z.string().min(1).default('local-profile'),
  displayName: z.string().max(40).default(''),
  createdAt: isoSchema.default(() => new Date().toISOString()),
  introSeen: z.boolean().default(false),
  onboardingComplete: z.boolean().default(false),
  focusAreas: z.array(z.string().max(40)).max(20).default([]),
  projects: z.array(z.string().max(80)).max(20).default([]),
  activities: z.array(z.string().max(40)).max(20).default([]),
  studyMinutesGoal: z.number().int().min(0).max(1440).default(60),
  weeklyQuestGoal: z.number().int().min(0).max(500).default(20),
  weeklyFocusMinutesGoal: z.number().int().min(0).max(10_000).default(300),
  equippedTitle: z.string().max(60).nullable().default(null),
  visitedViews: z.array(z.string().max(30)).max(30).default([]),
  /** level/rank last acknowledged by the user (used to replay a missed celebration) */
  lastSeenLevel: z.number().int().min(1).default(1),
  firstActiveDate: dateKeySchema.nullable().default(null),
})
export type Profile = z.infer<typeof profileSchema>

export function parseProfile(raw: unknown): Profile {
  const parsed = profileSchema.safeParse(raw ?? {})
  return parsed.success ? parsed.data : profileSchema.parse({})
}
