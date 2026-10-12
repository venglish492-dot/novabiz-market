import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Database, Download, HardDrive, RotateCcw, ShieldAlert, Upload, History } from 'lucide-react'
import { getDb, DATA_TABLES } from '@/db/database'
import { initDatabase } from '@/db/init'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { applyBackup, backupFileName, BackupValidationError, buildBackup, recordCounts, resetAllData, restoreSnapshot, validateBackupText, type ImportMode, type ValidatedBackup } from '@/backup/backup'
import { defaultRules } from '@/game/rules'
import { defaultSettings } from '@/domain/settings'
import { reevaluateAchievements } from '@/game/engine'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Segmented } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Misc'
import { formatDateTime } from '@/lib/dates'
import { formatNumber } from '@/lib/format'
import { isNativeApp, saveJsonFile } from '@/platform/native'

const TABLE_LABELS: Record<string, string> = {
  config: 'Settings & profile',
  attributes: 'Attributes',
  categories: 'Categories',
  quests: 'Quests',
  completions: 'Completions',
  progress: 'Checklist / measured progress',
  ledger: 'XP ledger entries',
  focusSessions: 'Focus sessions',
  goals: 'Goals',
  milestones: 'Milestones',
  events: 'Calendar events',
  notes: 'Reflections',
  achievements: 'Achievements',
  skillNodes: 'Custom skill nodes',
  skillUnlocks: 'Skill unlocks',
  rewards: 'Rewards',
  notifications: 'Notifications',
  activity: 'Activity events',
}

export function DataSettings() {
  const persistence = useApp((s) => s.persistence)
  const lastBackupAt = useApp((s) => s.settings.general.lastBackupAt)
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const updateSettings = useApp((s) => s.updateSettings)
  const updateRules = useApp((s) => s.updateRules)
  const reload = useApp((s) => s.reload)
  const pushToast = useUi((s) => s.pushToast)
  const counts = useLiveQuery(() => recordCounts(), [])
  const snapshots = useLiveQuery(() => getDb().snapshots.orderBy('createdAt').reverse().toArray(), [])
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [pending, setPending] = useState<ValidatedBackup | null>(null)
  const [importError, setImportError] = useState<{ message: string; details: string[] } | null>(null)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [importing, setImporting] = useState(false)
  const [confirm, setConfirm] = useState<null | 'visual' | 'rules' | 'all' | { snapshot: string }>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then((e) => setEstimate({ usage: e.usage ?? 0, quota: e.quota ?? 0 }))
      .catch(() => setEstimate(null))
  }, [counts])

  const exportBackup = async () => {
    setExporting(true)
    try {
      const archive = await buildBackup()
      const how = await saveJsonFile(backupFileName(), archive)
      await updateSettings((s) => ({ ...s, general: { ...s.general, lastBackupAt: new Date().toISOString() } }))
      pushToast({
        kind: 'success',
        title: 'Backup exported',
        body: how === 'shared' ? 'Choose where to keep it (Files, Drive, …) in the share sheet. Keep a copy somewhere safe.' : 'Saved by your browser to its downloads folder. Keep a copy somewhere safe.',
      })
    } catch (err) {
      pushToast({ kind: 'error', title: 'Export failed', body: err instanceof Error ? err.message : String(err) })
    } finally {
      setExporting(false)
    }
  }

  const onFile = async (file: File) => {
    setImportError(null)
    try {
      const text = await file.text()
      setPending(validateBackupText(text))
      setMode('merge')
    } catch (err) {
      setImportError(err instanceof BackupValidationError ? { message: err.message, details: err.details } : { message: err instanceof Error ? err.message : String(err), details: [] })
    }
  }

  const runImport = async () => {
    if (!pending) return
    setImporting(true)
    try {
      const report = await applyBackup(pending, mode)
      await initDatabase()
      await reload()
      await reevaluateAchievements()
      const added = Object.values(report.added).reduce((a, b) => a + b, 0)
      const skipped = Object.values(report.skipped).reduce((a, b) => a + b, 0)
      pushToast({
        kind: 'success',
        title: 'Backup imported',
        body: mode === 'merge' ? `${added} records added, ${skipped} already present and kept unchanged.` : `All data replaced (${added} records). Your previous data was kept as a snapshot.`,
      })
      setPending(null)
    } catch (err) {
      pushToast({ kind: 'error', title: 'Import failed', body: err instanceof Error ? err.message : String(err) })
    } finally {
      setImporting(false)
    }
  }

  const totalRecords = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="grid gap-gap lg:grid-cols-2">
      <Panel title="Backup" icon={<Download className="size-4" />}>
        <p className="text-sm text-muted">Exports everything — quests, progress, XP ledger, goals, focus history, achievements and all settings — as one versioned JSON file. Nothing is uploaded; the file is saved by your browser.</p>
        <p className="mt-2 text-sm">
          Last export: <span className="text-fg">{lastBackupAt ? formatDateTime(lastBackupAt, dateFormat) : 'never'}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" icon={<Download className="size-4" />} loading={exporting} onClick={() => void exportBackup()}>
            Export backup
          </Button>
          <Button icon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>
            Import backup…
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Choose a backup file"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void onFile(f)
            }}
          />
        </div>
        {importError && (
          <div role="alert" className="mt-4 rounded-xl border border-danger/50 bg-danger/10 p-3 text-sm">
            <p className="font-semibold text-danger">{importError.message}</p>
            {importError.details.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-xs text-muted">
                {importError.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-xs text-muted">Nothing was changed.</p>
          </div>
        )}
      </Panel>

      <Panel title="Where your data lives" icon={<HardDrive className="size-4" />}>
        <ul className="space-y-2 text-sm text-muted">
          {isNativeApp() ? (
            <>
              <li>
                Data is stored in this app's private <strong className="text-fg">IndexedDB</strong> storage on this phone only.
              </li>
              <li>Uninstalling the app or using Android's “Clear storage” for it erases your data. Export backups regularly.</li>
              <li>App storage is private to this app, but it is not encrypted by REALITY SYSTEM — anyone with access to your unlocked phone could open the app.</li>
            </>
          ) : (
            <>
              <li>
                Data is stored in this browser's <strong className="text-fg">IndexedDB</strong> for <span className="num text-fg">{window.location.origin}</span>, on this device only.
              </li>
              <li>Always open the app at the same address — a different address or browser has its own separate storage.</li>
              <li>Clearing site data / browsing history for this site, uninstalling the browser, or a disk failure can erase it. Export backups regularly.</li>
              <li>Browser storage is private to your Windows account and browser profile, but it is not encrypted by this app — anyone using the same account and browser profile could read it.</li>
            </>
          )}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge color={persistence === 'persistent' ? '#34d399' : '#fbbf24'}>{persistence === 'persistent' ? 'Persistent storage granted' : persistence === 'best-effort' ? 'Best-effort storage (browser may evict under pressure)' : 'Persistence status unknown'}</Badge>
          {estimate && estimate.quota > 0 && (
            <Badge>
              Using {(estimate.usage / 1024 / 1024).toFixed(1)} MB of {(estimate.quota / 1024 / 1024 / 1024).toFixed(1)} GB available
            </Badge>
          )}
        </div>
      </Panel>

      <Panel title={`Stored records (${formatNumber(totalRecords)})`} icon={<Database className="size-4" />}>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {DATA_TABLES.map((t) => (
            <li key={t} className="flex justify-between gap-2 border-b border-line/30 py-0.5">
              <span className="truncate text-muted">{TABLE_LABELS[t]}</span>
              <span className="num">{counts?.[t] ?? '…'}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Recovery snapshots" icon={<History className="size-4" />}>
        <p className="mb-3 text-sm text-muted">Before a replacing import or a full reset, the system saves a snapshot of your data here (the newest 3 are kept, inside this browser). Export a backup file for real off-device safety.</p>
        {!snapshots?.length ? (
          <p className="text-sm text-muted">No snapshots yet.</p>
        ) : (
          <ul className="space-y-2">
            {snapshots.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line/60 p-2 text-sm">
                <span className="flex-1">
                  {s.reason}
                  <span className="num block text-xs text-muted">{formatDateTime(s.createdAt, dateFormat)}</span>
                </span>
                <Button size="sm" onClick={() => void saveJsonFile(`reality-system-snapshot-${s.createdAt.slice(0, 10)}.json`, JSON.parse(s.json))}>
                  Download
                </Button>
                <Button size="sm" variant="subtle" onClick={() => setConfirm({ snapshot: s.id })}>
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Resets" icon={<ShieldAlert className="size-4" />} className="lg:col-span-2">
        <p className="mb-3 text-sm text-muted">Each reset only affects its own area.</p>
        <div className="flex flex-wrap gap-2">
          <Button icon={<RotateCcw className="size-4" />} onClick={() => setConfirm('visual')}>
            Reset visual settings
          </Button>
          <Button icon={<RotateCcw className="size-4" />} onClick={() => setConfirm('rules')}>
            Reset game rules
          </Button>
          <Button variant="danger" icon={<ShieldAlert className="size-4" />} onClick={() => setConfirm('all')}>
            Reset ALL app data…
          </Button>
        </div>
      </Panel>

      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        title="Import backup"
        size="md"
        dismissable={false}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant={mode === 'replace' ? 'danger' : 'primary'} loading={importing} onClick={() => void runImport()}>
              {mode === 'replace' ? 'Replace my data' : 'Merge into my data'}
            </Button>
          </>
        }
      >
        {pending && (
          <div className="space-y-4 text-sm">
            <p>
              Valid REALITY SYSTEM backup from <strong>{formatDateTime(pending.exportedAt, dateFormat)}</strong> (data version {pending.dataVersion}).
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-xl border border-line/60 p-3">
              {DATA_TABLES.filter((t) => pending.counts[t] > 0).map((t) => (
                <li key={t} className="flex justify-between gap-2">
                  <span className="text-muted">{TABLE_LABELS[t]}</span>
                  <span className="num">{pending.counts[t]}</span>
                </li>
              ))}
            </ul>
            {pending.warnings.length > 0 && <p className="text-xs text-warning">{pending.warnings.join(' ')}</p>}
            <div>
              <p className="mb-2 font-medium">How should it be imported?</p>
              <Segmented label="Import mode" value={mode} onChange={setMode} options={[{ value: 'merge', label: 'Merge' }, { value: 'replace', label: 'Replace' }]} />
              <p className="mt-2 text-muted">
                {mode === 'merge'
                  ? 'Merge adds records that do not exist yet. Anything you already have (including your current settings) is kept unchanged. Nothing is deleted.'
                  : 'Replace deletes all current data and restores exactly what is in the backup. A snapshot of your current data is saved first so you can undo this from “Recovery snapshots”.'}
              </p>
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirm === 'visual'}
        title="Reset visual settings?"
        confirmLabel="Reset visuals"
        body={<p>Theme, background, motion, layout, navigation and avatar return to defaults. Quests and progress are untouched.</p>}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const d = defaultSettings()
          await updateSettings((s) => ({ ...s, appearance: d.appearance, avatar: d.avatar, navigation: d.navigation, dashboard: d.dashboard }))
          setConfirm(null)
          pushToast({ kind: 'info', title: 'Visual settings reset' })
        }}
      />
      <ConfirmDialog
        open={confirm === 'rules'}
        title="Reset game rules?"
        confirmLabel="Reset rules"
        body={<p>Rewards, level curve and ranks return to defaults. Your XP ledger and history are untouched.</p>}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await updateRules(defaultRules())
          setConfirm(null)
          pushToast({ kind: 'info', title: 'Game rules reset' })
        }}
      />
      <ConfirmDialog
        open={confirm === 'all'}
        danger
        title="Reset ALL app data?"
        confirmLabel="Erase everything"
        typeToConfirm="RESET"
        body={
          <>
            <p className="text-fg">This deletes every quest, goal, XP record, achievement, focus session and setting in this browser.</p>
            <p>A recovery snapshot is saved first (inside this browser). For real safety, export a backup file before continuing.</p>
          </>
        }
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await resetAllData()
          setConfirm(null)
          window.location.reload()
        }}
      />
      <ConfirmDialog
        open={typeof confirm === 'object' && confirm !== null}
        danger
        title="Restore this snapshot?"
        confirmLabel="Restore snapshot"
        body={<p>Your current data will be replaced by the snapshot. A new snapshot of the current data is taken first, so this can be undone.</p>}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (typeof confirm === 'object' && confirm) {
            try {
              await restoreSnapshot(confirm.snapshot)
              await initDatabase()
              await reload()
              pushToast({ kind: 'success', title: 'Snapshot restored' })
            } catch (err) {
              pushToast({ kind: 'error', title: 'Restore failed', body: err instanceof Error ? err.message : String(err) })
            }
          }
          setConfirm(null)
        }}
      />
    </div>
  )
}
