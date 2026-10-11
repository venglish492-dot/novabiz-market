import { useState } from 'react'
import { HardDrive, X } from 'lucide-react'
import { useApp } from '@/store/app'
import { navigate } from '@/app/router'

/** A gentle banner when no backup has been exported recently (can be disabled in Settings). */
export function BackupReminder() {
  const general = useApp((s) => s.settings.general)
  const created = useApp((s) => s.profile.createdAt)
  const [hidden, setHidden] = useState(false)
  const [now] = useState(() => Date.now())
  if (!general.backupReminder || hidden) return null
  const last = general.lastBackupAt ? Date.parse(general.lastBackupAt) : Date.parse(created)
  const due = now - last > general.backupReminderDays * 86_400_000
  if (!due) return null
  return (
    <div role="status" className="mx-auto mt-3 flex w-full max-w-[1500px] items-center gap-3 px-4 sm:px-6">
      <div className="flex w-full items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
        <HardDrive className="size-4 shrink-0 text-warning" aria-hidden />
        <p className="flex-1 text-fg/90">
          {general.lastBackupAt ? `Your last backup was more than ${general.backupReminderDays} days ago.` : 'You have not exported a backup yet.'} Browser data can be lost if site data is cleared.
        </p>
        <button type="button" className="font-semibold text-warning hover:underline" onClick={() => navigate('settings')}>
          Back up now
        </button>
        <button type="button" aria-label="Hide backup reminder for now" className="rounded p-1 text-muted hover:text-fg" onClick={() => setHidden(true)}>
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
