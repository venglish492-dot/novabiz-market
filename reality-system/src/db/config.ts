/** Typed access to the key/value `config` table. */
import { getDb } from './database'
import { parseProfile, parseSettings, type Profile, type Settings } from '@/domain/settings'
import { parseRules, type GameRules } from '@/game/rules'
import { activeTimerSchema, type ActiveTimer } from '@/domain/schemas'
import { z } from 'zod'

export const CONFIG_KEYS = {
  meta: 'meta',
  profile: 'profile',
  settings: 'settings',
  rules: 'rules',
  activeTimer: 'activeTimer',
  achievementOverrides: 'achievementOverrides',
} as const

export const metaSchema = z.object({
  dataVersion: z.number().int().min(1),
  createdAt: z.string(),
  lastOpenedAt: z.string(),
  seeded: z.boolean(),
})
export type Meta = z.infer<typeof metaSchema>

export async function readConfig(key: string): Promise<unknown> {
  return (await getDb().config.get(key))?.value
}

export async function writeConfig(key: string, value: unknown): Promise<void> {
  await getDb().config.put({ key, value })
}

export async function loadProfile(): Promise<Profile> {
  return parseProfile(await readConfig(CONFIG_KEYS.profile))
}
export async function saveProfile(profile: Profile): Promise<void> {
  await writeConfig(CONFIG_KEYS.profile, profile)
}
export async function loadSettings(): Promise<Settings> {
  return parseSettings(await readConfig(CONFIG_KEYS.settings))
}
export async function saveSettings(settings: Settings): Promise<void> {
  await writeConfig(CONFIG_KEYS.settings, settings)
}
export async function loadRules(): Promise<GameRules> {
  return parseRules(await readConfig(CONFIG_KEYS.rules))
}
export async function saveRules(rules: GameRules): Promise<void> {
  await writeConfig(CONFIG_KEYS.rules, rules)
}

export async function loadActiveTimer(): Promise<ActiveTimer | null> {
  const parsed = activeTimerSchema.safeParse(await readConfig(CONFIG_KEYS.activeTimer))
  return parsed.success ? parsed.data : null
}
export async function saveActiveTimer(timer: ActiveTimer | null): Promise<void> {
  if (timer) await writeConfig(CONFIG_KEYS.activeTimer, timer)
  else await getDb().config.delete(CONFIG_KEYS.activeTimer)
}

export const achievementOverridesSchema = z.record(
  z.string(),
  z.object({ name: z.string().max(60).optional(), description: z.string().max(300).optional() }),
)
export type AchievementOverrides = z.infer<typeof achievementOverridesSchema>

export async function loadAchievementOverrides(): Promise<AchievementOverrides> {
  const parsed = achievementOverridesSchema.safeParse(await readConfig(CONFIG_KEYS.achievementOverrides))
  return parsed.success ? parsed.data : {}
}
