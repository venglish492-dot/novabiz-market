/**
 * Backup & restore.
 *
 * - Export: a versioned JSON archive of every user table.
 * - Import: parsed as plain JSON (never evaluated), validated record-by-record
 *   with Zod, checked for version compatibility, summarised, and only applied
 *   after explicit confirmation. Before a destructive import a snapshot of the
 *   current data is kept inside the local database so it can be restored.
 * - Nothing is uploaded anywhere; files go only where the user saves them.
 */
import { z } from 'zod'
import { DATA_TABLES, getDb, tableOf, type DataTableName } from '@/db/database'
import { CURRENT_DATA_VERSION } from '@/db/migrations'
import { CONFIG_KEYS } from '@/db/config'
import {
  achievementUnlockSchema,
  activitySchema,
  attributeSchema,
  calendarEventSchema,
  categorySchema,
  completionSchema,
  configRecordSchema,
  focusSessionSchema,
  goalSchema,
  milestoneSchema,
  noteSchema,
  notificationSchema,
  occurrenceProgressSchema,
  questSchema,
  rewardSchema,
  skillNodeSchema,
  skillUnlockSchema,
  xpEntrySchema,
} from '@/domain/schemas'
import { newId } from '@/lib/id'
import { sumLedger } from '@/game/progress'

export const BACKUP_APP_ID = 'reality-system'
export const BACKUP_FORMAT = 1
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024
const MAX_SNAPSHOTS = 3

const ROW_SCHEMAS: Record<DataTableName, z.ZodType> = {
  config: configRecordSchema,
  attributes: attributeSchema,
  categories: categorySchema,
  quests: questSchema,
  completions: completionSchema,
  progress: occurrenceProgressSchema,
  ledger: xpEntrySchema,
  focusSessions: focusSessionSchema,
  goals: goalSchema,
  milestones: milestoneSchema,
  events: calendarEventSchema,
  notes: noteSchema,
  achievements: achievementUnlockSchema,
  skillNodes: skillNodeSchema,
  skillUnlocks: skillUnlockSchema,
  rewards: rewardSchema,
  notifications: notificationSchema,
  activity: activitySchema,
}

const PRIMARY_KEY: Partial<Record<DataTableName, string>> = { config: 'key' }
const keyOf = (table: DataTableName, row: Record<string, unknown>) => String(row[PRIMARY_KEY[table] ?? 'id'])

export interface BackupArchive {
  app: typeof BACKUP_APP_ID
  format: number
  dataVersion: number
  exportedAt: string
  counts: Record<string, number>
  tables: Record<DataTableName, unknown[]>
}

const envelopeSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  format: z.number().int().min(1),
  dataVersion: z.number().int().min(1),
  exportedAt: z.string(),
  tables: z.record(z.string(), z.array(z.unknown())),
})

export async function buildBackup(): Promise<BackupArchive> {
  const db = getDb()
  return db.transaction('r', db.tables, async () => {
    const tables = {} as Record<DataTableName, unknown[]>
    const counts: Record<string, number> = {}
    for (const name of DATA_TABLES) {
      let rows = await tableOf(db, name).toArray()
      // A running timer is device-session state, not something to restore elsewhere.
      if (name === 'config') rows = rows.filter((r) => (r as { key: string }).key !== CONFIG_KEYS.activeTimer)
      tables[name] = rows
      counts[name] = rows.length
    }
    return { app: BACKUP_APP_ID, format: BACKUP_FORMAT, dataVersion: CURRENT_DATA_VERSION, exportedAt: new Date().toISOString(), counts, tables }
  })
}

export function backupFileName(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 16).replace(/[:T]/g, '-')
  return `reality-system-backup-${stamp}.json`
}

export interface ValidatedBackup {
  archive: BackupArchive
  counts: Record<DataTableName, number>
  exportedAt: string
  dataVersion: number
  warnings: string[]
}

export class BackupValidationError extends Error {
  constructor(
    message: string,
    public details: string[] = [],
  ) {
    super(message)
    this.name = 'BackupValidationError'
  }
}

/** Parses and validates backup file text. Throws BackupValidationError with readable details. */
export function validateBackupText(text: string): ValidatedBackup {
  if (text.length > MAX_BACKUP_BYTES) throw new BackupValidationError('This file is too large to be a REALITY SYSTEM backup.')
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupValidationError('This file is not valid JSON.')
  }
  const env = envelopeSchema.safeParse(raw)
  if (!env.success) throw new BackupValidationError('This file is not a REALITY SYSTEM backup.', env.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`))
  if (env.data.format > BACKUP_FORMAT || env.data.dataVersion > CURRENT_DATA_VERSION) {
    throw new BackupValidationError('This backup was created by a newer version of REALITY SYSTEM. Update the app before importing it.')
  }

  const errors: string[] = []
  const warnings: string[] = []
  const tables = {} as Record<DataTableName, unknown[]>
  const counts = {} as Record<DataTableName, number>
  for (const name of DATA_TABLES) {
    const rows = env.data.tables[name] ?? []
    if (!(name in env.data.tables)) warnings.push(`No "${name}" data in this backup.`)
    const seen = new Set<string>()
    const valid: unknown[] = []
    rows.forEach((row, i) => {
      const parsed = ROW_SCHEMAS[name].safeParse(row)
      if (!parsed.success) {
        if (errors.length < 12) errors.push(`${name}[${i}]: ${parsed.error.issues[0]?.path.join('.')} ${parsed.error.issues[0]?.message}`)
        return
      }
      const key = keyOf(name, parsed.data as Record<string, unknown>)
      if (seen.has(key)) {
        if (errors.length < 12) errors.push(`${name}: duplicate id "${key}"`)
        return
      }
      seen.add(key)
      valid.push(parsed.data)
    })
    tables[name] = valid
    counts[name] = valid.length
  }
  for (const key of Object.keys(env.data.tables)) {
    if (!(DATA_TABLES as readonly string[]).includes(key)) warnings.push(`Unknown section "${key}" was ignored.`)
  }
  if (errors.length) throw new BackupValidationError('The backup contains invalid records, so nothing was imported.', errors)

  return {
    archive: { app: BACKUP_APP_ID, format: env.data.format, dataVersion: env.data.dataVersion, exportedAt: env.data.exportedAt, counts, tables },
    counts,
    exportedAt: env.data.exportedAt,
    dataVersion: env.data.dataVersion,
    warnings,
  }
}

/** Stores a copy of the current data inside the database (keeps the newest few). */
export async function createSnapshot(reason: string): Promise<string> {
  const archive = await buildBackup()
  const db = getDb()
  const id = newId('snap')
  await db.snapshots.add({ id, createdAt: new Date().toISOString(), reason, json: JSON.stringify(archive) })
  const all = await db.snapshots.orderBy('createdAt').reverse().toArray()
  for (const old of all.slice(MAX_SNAPSHOTS)) await db.snapshots.delete(old.id)
  return id
}

export type ImportMode = 'replace' | 'merge'

export interface ImportReport {
  mode: ImportMode
  added: Record<string, number>
  skipped: Record<string, number>
  snapshotId: string | null
  lifetimeXp: number
}

/**
 * Applies a validated backup.
 *  - replace: snapshot current data, then replace every user table with the backup.
 *  - merge:   add records whose ids do not exist yet; existing records (and settings) are kept.
 */
export async function applyBackup(validated: ValidatedBackup, mode: ImportMode): Promise<ImportReport> {
  const snapshotId = mode === 'replace' ? await createSnapshot('Before importing a backup (replace)') : null
  const db = getDb()
  const added: Record<string, number> = {}
  const skipped: Record<string, number> = {}

  await db.transaction('rw', db.tables, async () => {
    for (const name of DATA_TABLES) {
      const table = tableOf(db, name)
      const rows = validated.archive.tables[name] as Record<string, unknown>[]
      if (mode === 'replace') {
        await table.clear()
        await table.bulkAdd(rows)
        added[name] = rows.length
        skipped[name] = 0
      } else {
        const existing = new Set((await table.toCollection().primaryKeys()).map(String))
        const fresh = rows.filter((r) => !existing.has(keyOf(name, r)))
        if (fresh.length) await table.bulkAdd(fresh)
        added[name] = fresh.length
        skipped[name] = rows.length - fresh.length
      }
    }
  })

  // Verify integrity after the import.
  if (mode === 'replace') {
    for (const name of DATA_TABLES) {
      const n = await tableOf(db, name).count()
      if (n !== validated.counts[name]) throw new Error(`Import verification failed for "${name}" (${n} ≠ ${validated.counts[name]}). Your previous data is kept as a snapshot.`)
    }
  }
  return { mode, added, skipped, snapshotId, lifetimeXp: sumLedger(await db.ledger.toArray()) }
}

export async function restoreSnapshot(snapshotId: string): Promise<ImportReport> {
  const snap = await getDb().snapshots.get(snapshotId)
  if (!snap) throw new Error('Snapshot not found.')
  return applyBackup(validateBackupText(snap.json), 'replace')
}

export async function recordCounts(): Promise<Record<DataTableName, number>> {
  const db = getDb()
  const out = {} as Record<DataTableName, number>
  for (const name of DATA_TABLES) out[name] = await tableOf(db, name).count()
  return out
}

/** Deletes every user record (a snapshot is kept first so it can be undone). */
export async function resetAllData(): Promise<void> {
  await createSnapshot('Before resetting all data')
  const db = getDb()
  await db.transaction('rw', db.tables, async () => {
    for (const name of DATA_TABLES) await tableOf(db, name).clear()
  })
}
