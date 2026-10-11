import { beforeEach, describe, expect, it } from 'vitest'
import { freshDb } from '@/test/db'
import { RealityDB, setDbForTests } from '@/db/database'
import { initDatabase } from '@/db/init'
import { createQuest, emptyDraft } from '@/quests/service'
import { completeQuest } from '@/game/engine'
import { applyBackup, buildBackup, BackupValidationError, resetAllData, restoreSnapshot, validateBackupText } from './backup'
import { loadSettings, saveSettings, CONFIG_KEYS } from '@/db/config'
import { computeProgress } from '@/game/progress'
import { defaultRules } from '@/game/rules'

let db: RealityDB
const now = new Date(2026, 9, 11, 12)

beforeEach(async () => {
  db = await freshDb({ onboarded: true })
})

describe('local persistence', () => {
  it('data survives closing and reopening the database (app reload)', async () => {
    const q = await createQuest(emptyDraft({ title: 'Persist me', difficulty: 'hard' }))
    await completeQuest(q.id, 'once', now)
    const settings = await loadSettings()
    await saveSettings({ ...settings, appearance: { ...settings.appearance, themeId: 'crimson-hunter' } })
    const name = db.name
    db.close()

    const reopened = new RealityDB(name)
    setDbForTests(reopened)
    const init = await initDatabase(reopened)
    expect(init.firstRun).toBe(false)
    expect((await reopened.quests.get(q.id))?.status).toBe('completed')
    expect(await reopened.completions.count()).toBe(1)
    expect(computeProgress(await reopened.ledger.toArray(), defaultRules()).totalXp).toBeGreaterThanOrEqual(50)
    expect((await loadSettings()).appearance.themeId).toBe('crimson-hunter')
    expect(await reopened.attributes.count()).toBe(8) // defaults are not duplicated
  })

  it('migrations upgrade old data without erasing it', async () => {
    const q = await createQuest(emptyDraft({ title: 'Legacy quest' }))
    // simulate an older record shape and an older data version
    await db.quests.update(q.id, { tags: undefined as unknown as string[] })
    await db.config.put({ key: CONFIG_KEYS.meta, value: { dataVersion: 1, createdAt: now.toISOString(), lastOpenedAt: now.toISOString(), seeded: true } })
    await initDatabase(db)
    const after = await db.quests.get(q.id)
    expect(after?.title).toBe('Legacy quest')
    expect(after?.tags).toEqual([])
    expect(((await db.config.get(CONFIG_KEYS.meta))?.value as { dataVersion: number }).dataVersion).toBeGreaterThan(1)
  })
})

describe('backup', () => {
  it('round-trips through export → reset → import', async () => {
    const q = await createQuest(emptyDraft({ title: 'Backed up', difficulty: 'epic' }))
    await completeQuest(q.id, 'once', now)
    const archive = await buildBackup()
    const text = JSON.stringify(archive)

    await resetAllData()
    expect(await db.quests.count()).toBe(0)
    expect(await db.snapshots.count()).toBe(1)

    const validated = validateBackupText(text)
    expect(validated.counts.quests).toBe(1)
    const report = await applyBackup(validated, 'replace')
    expect(report.added.quests).toBe(1)
    expect((await db.quests.get(q.id))?.title).toBe('Backed up')
    expect(report.lifetimeXp).toBe(computeProgress(archive.tables.ledger as never, defaultRules()).totalXp)
  })

  it('merge adds only missing records', async () => {
    await createQuest(emptyDraft({ title: 'One' }))
    const text = JSON.stringify(await buildBackup())
    await createQuest(emptyDraft({ title: 'Two' }))
    const report = await applyBackup(validateBackupText(text), 'merge')
    expect(report.added.quests).toBe(0)
    expect(report.skipped.quests).toBe(1)
    expect(await db.quests.count()).toBe(2)
  })

  it('rejects invalid files without touching data', async () => {
    await createQuest(emptyDraft({ title: 'Safe' }))
    expect(() => validateBackupText('not json')).toThrow(BackupValidationError)
    expect(() => validateBackupText(JSON.stringify({ hello: 'world' }))).toThrow(/not a REALITY SYSTEM backup/)
    const archive = await buildBackup()
    const broken = { ...archive, tables: { ...archive.tables, quests: [{ id: 'x', title: '' }] } }
    expect(() => validateBackupText(JSON.stringify(broken))).toThrow(/invalid records/)
    const newer = { ...archive, dataVersion: 999 }
    expect(() => validateBackupText(JSON.stringify(newer))).toThrow(/newer version/)
    const dupes = { ...archive, tables: { ...archive.tables, quests: [...archive.tables.quests, ...archive.tables.quests] } }
    expect(() => validateBackupText(JSON.stringify(dupes))).toThrow(/invalid records/)
    expect(await db.quests.count()).toBe(1)
  })

  it('a replace import keeps a restorable snapshot of the previous data', async () => {
    const q = await createQuest(emptyDraft({ title: 'Before' }))
    const empty = JSON.stringify({ ...(await buildBackup()), tables: { ...(await buildBackup()).tables, quests: [] } })
    const report = await applyBackup(validateBackupText(empty), 'replace')
    expect(await db.quests.count()).toBe(0)
    await restoreSnapshot(report.snapshotId!)
    expect((await db.quests.get(q.id))?.title).toBe('Before')
  })
})
