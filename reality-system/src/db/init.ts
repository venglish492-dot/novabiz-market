/**
 * Opens the local database, applies migrations and seeds default
 * configuration (attributes & categories) exactly once.
 * It never seeds fake progress and never resets existing data.
 */
import { getDb, type RealityDB } from './database'
import { CONFIG_KEYS, metaSchema, type Meta } from './config'
import { CURRENT_DATA_VERSION, runMigrations } from './migrations'
import { DEFAULT_ATTRIBUTES, DEFAULT_CATEGORIES } from '@/game/defaults'

export interface InitResult {
  firstRun: boolean
  meta: Meta
}

export class StorageUnavailableError extends Error {
  constructor(cause: unknown) {
    super(
      'Browser storage (IndexedDB) is not available. Private/incognito windows or strict privacy settings can block it, so progress cannot be saved.',
    )
    this.name = 'StorageUnavailableError'
    this.cause = cause
  }
}

export async function initDatabase(db: RealityDB = getDb()): Promise<InitResult> {
  try {
    await db.open()
  } catch (err) {
    throw new StorageUnavailableError(err)
  }

  return db.transaction('rw', db.tables, async () => {
    const now = new Date().toISOString()
    const rawMeta = (await db.config.get(CONFIG_KEYS.meta))?.value
    const parsed = metaSchema.safeParse(rawMeta)
    const firstRun = !parsed.success
    let meta: Meta = parsed.success
      ? parsed.data
      : { dataVersion: CURRENT_DATA_VERSION, createdAt: now, lastOpenedAt: now, seeded: false }

    if (!meta.seeded) {
      // Only fill tables that are empty, so a partially restored database is never overwritten.
      if ((await db.attributes.count()) === 0) await db.attributes.bulkAdd(DEFAULT_ATTRIBUTES)
      if ((await db.categories.count()) === 0) await db.categories.bulkAdd(DEFAULT_CATEGORIES)
      meta = { ...meta, seeded: true }
    }

    if (meta.dataVersion < CURRENT_DATA_VERSION) {
      meta = { ...meta, dataVersion: await runMigrations(db, meta.dataVersion) }
    }

    meta = { ...meta, lastOpenedAt: now }
    await db.config.put({ key: CONFIG_KEYS.meta, value: meta })
    return { firstRun, meta }
  })
}

export type PersistenceStatus = 'persistent' | 'best-effort' | 'unsupported'

/** Asks the browser to protect this origin's storage from automatic eviction. */
export async function requestPersistentStorage(): Promise<PersistenceStatus> {
  try {
    if (!navigator.storage?.persist) return 'unsupported'
    if (await navigator.storage.persisted()) return 'persistent'
    return (await navigator.storage.persist()) ? 'persistent' : 'best-effort'
  } catch {
    return 'unsupported'
  }
}
