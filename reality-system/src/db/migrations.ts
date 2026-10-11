/**
 * App-level data migrations. Each migration runs once, in order, and is
 * recorded in `meta.dataVersion`. Migrations transform data in place; they
 * must never clear user tables.
 */
import type { RealityDB } from './database'

export interface DataMigration {
  version: number
  description: string
  run: (db: RealityDB) => Promise<void>
}

export const DATA_MIGRATIONS: DataMigration[] = [
  {
    version: 1,
    description: 'Initial data layout.',
    run: async () => {
      /* baseline — nothing to transform */
    },
  },
  {
    version: 2,
    description: 'Ensure every quest has a tags array and a completion condition string.',
    run: async (db) => {
      await db.quests.toCollection().modify((q) => {
        const quest = q as unknown as Record<string, unknown>
        if (!Array.isArray(quest.tags)) quest.tags = []
        if (typeof quest.completionCondition !== 'string') quest.completionCondition = ''
      })
    },
  },
]

export const CURRENT_DATA_VERSION = DATA_MIGRATIONS[DATA_MIGRATIONS.length - 1].version

export async function runMigrations(db: RealityDB, fromVersion: number): Promise<number> {
  let version = fromVersion
  for (const m of DATA_MIGRATIONS) {
    if (m.version > version) {
      await m.run(db)
      version = m.version
    }
  }
  return version
}
