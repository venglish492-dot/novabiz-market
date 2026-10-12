/**
 * Global app state: settings, profile and game rules.
 * The database is the source of truth — every update is persisted first.
 * Domain data (quests, ledger…) is read live from IndexedDB with useLiveQuery.
 */
import { create } from 'zustand'
import { defaultSettings, parseProfile, type Profile, type Settings } from '@/domain/settings'
import { defaultRules, gameRulesSchema, type GameRules } from '@/game/rules'
import { loadProfile, loadRules, loadSettings, saveProfile, saveRules, saveSettings } from '@/db/config'
import { initDatabase, requestPersistentStorage, StorageUnavailableError, type PersistenceStatus } from '@/db/init'

interface AppState {
  status: 'booting' | 'ready' | 'error'
  error: string | null
  firstRun: boolean
  persistence: PersistenceStatus
  settings: Settings
  profile: Profile
  rules: GameRules
  boot: () => Promise<void>
  reload: () => Promise<void>
  updateSettings: (fn: (s: Settings) => Settings) => Promise<void>
  updateProfile: (fn: (p: Profile) => Profile) => Promise<void>
  updateRules: (rules: GameRules) => Promise<void>
}

export const useApp = create<AppState>((set, get) => ({
  status: 'booting',
  error: null,
  firstRun: false,
  persistence: 'unsupported',
  settings: defaultSettings(),
  profile: parseProfile({}),
  rules: defaultRules(),

  boot: async () => {
    try {
      const { firstRun } = await initDatabase()
      const [settings, profile, rules] = await Promise.all([loadSettings(), loadProfile(), loadRules()])
      set({ status: 'ready', firstRun, settings, profile, rules, error: null })
      void requestPersistentStorage().then((persistence) => set({ persistence }))
    } catch (err) {
      const message =
        err instanceof StorageUnavailableError ? err.message : `The local database could not be opened: ${err instanceof Error ? err.message : String(err)}`
      set({ status: 'error', error: message })
    }
  },

  reload: async () => {
    const [settings, profile, rules] = await Promise.all([loadSettings(), loadProfile(), loadRules()])
    set({ settings, profile, rules })
  },

  updateSettings: async (fn) => {
    const next = fn(get().settings)
    set({ settings: next })
    await saveSettings(next)
  },

  updateProfile: async (fn) => {
    const next = fn(get().profile)
    set({ profile: next })
    await saveProfile(next)
  },

  updateRules: async (rules) => {
    const parsed = gameRulesSchema.parse(rules)
    await saveRules(parsed)
    set({ rules: { ...parsed, ranks: [...parsed.ranks].sort((a, b) => a.minLevel - b.minLevel) } })
  },
}))

export const useSettings = () => useApp((s) => s.settings)
export const useRules = () => useApp((s) => s.rules)
export const useProfile = () => useApp((s) => s.profile)
