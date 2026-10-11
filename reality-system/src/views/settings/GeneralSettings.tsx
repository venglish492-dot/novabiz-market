import { useState } from 'react'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Field, Select, TextInput } from '@/components/ui/Field'
import { Toggle } from '@/components/ui/Toggle'
import { Segmented } from '@/components/ui/Tabs'
import type { Settings } from '@/domain/settings'

export function GeneralSettings() {
  const profile = useApp((s) => s.profile)
  const general = useApp((s) => s.settings.general)
  const updateProfile = useApp((s) => s.updateProfile)
  const updateSettings = useApp((s) => s.updateSettings)
  const pushToast = useUi((s) => s.pushToast)
  const [name, setName] = useState(profile.displayName)
  const setGeneral = (patch: Partial<Settings['general']>) => void updateSettings((s) => ({ ...s, general: { ...s.general, ...patch } }))
  const permission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'

  return (
    <div className="grid gap-gap lg:grid-cols-2">
      <Panel title="Profile">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void updateProfile((p) => ({ ...p, displayName: name.trim().slice(0, 40) })).then(() => pushToast({ kind: 'success', title: 'Name saved' }))
          }}
        >
          <Field label="Display name" className="flex-1">
            {(id) => <TextInput id={id} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />}
          </Field>
          <Button type="submit" variant="subtle">
            Save
          </Button>
        </form>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Weekly quest goal">{(id) => <TextInput id={id} type="number" min={0} max={500} value={profile.weeklyQuestGoal} onChange={(e) => void updateProfile((p) => ({ ...p, weeklyQuestGoal: Math.max(0, Math.min(500, Number(e.target.value) || 0)) }))} />}</Field>
          <Field label="Weekly focus goal (min)">{(id) => <TextInput id={id} type="number" min={0} max={10000} value={profile.weeklyFocusMinutesGoal} onChange={(e) => void updateProfile((p) => ({ ...p, weeklyFocusMinutesGoal: Math.max(0, Math.min(10000, Number(e.target.value) || 0)) }))} />}</Field>
        </div>
        <p className="mt-3 text-xs text-muted">Local profile id: <span className="num">{profile.id}</span>. No account, email or real name is ever required.</p>
      </Panel>

      <Panel title="Days & weeks">
        <Field label="A new day starts at" hint="Activity before this hour counts toward the previous day. Past records keep the day they were saved on, so changing this (or travelling across time zones) never rewrites history.">
          {(id, d) => (
            <Select id={id} aria-describedby={d} value={general.resetHour} onChange={(e) => setGeneral({ resetHour: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Week starts on</p>
          <Segmented label="Week start" value={String(general.weekStart) as '0' | '1'} onChange={(v) => setGeneral({ weekStart: Number(v) as 0 | 1 })} options={[{ value: '1', label: 'Monday' }, { value: '0', label: 'Sunday' }]} />
        </div>
        <Field label="Daily capacity (minutes)" className="mt-4" hint="The planner warns when today's open quests exceed this.">
          {(id, d) => <TextInput id={id} aria-describedby={d} type="number" min={15} max={1440} value={general.dailyCapacityMinutes} onChange={(e) => setGeneral({ dailyCapacityMinutes: Math.max(15, Math.min(1440, Number(e.target.value) || 15)) })} />}
        </Field>
        <p className="mt-3 text-xs text-muted">Time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone} (from this device).</p>
      </Panel>

      <Panel title="Notifications & reminders">
        <p className="mb-3 text-sm text-muted">The in-app notification center (bell icon) is always available and needs no permission.</p>
        <Toggle
          checked={general.browserNotifications && permission === 'granted'}
          disabled={permission === 'unsupported' || permission === 'denied'}
          onChange={async (v) => {
            if (!v) return setGeneral({ browserNotifications: false })
            const result = await Notification.requestPermission()
            setGeneral({ browserNotifications: result === 'granted' })
            if (result !== 'granted') pushToast({ kind: 'info', title: 'Browser notifications not enabled', body: 'Permission was not granted. In-app notifications still work.' })
          }}
          label="Also show browser notifications for reminders"
          description={
            permission === 'unsupported'
              ? 'This browser does not support notifications.'
              : permission === 'denied'
                ? 'Notifications are blocked for this site in your browser settings.'
                : 'Asks your browser for permission only when you switch this on. Behaviour depends on your browser and operating system, and only works while the app is open.'
          }
        />
      </Panel>

      <Panel title="Backup reminder">
        <Toggle checked={general.backupReminder} onChange={(v) => setGeneral({ backupReminder: v })} label="Remind me to export a backup" description="Shows a small banner when your last export is older than the interval below." />
        <Field label="Remind after (days)" className="mt-3">
          {(id) => <TextInput id={id} type="number" min={1} max={90} value={general.backupReminderDays} onChange={(e) => setGeneral({ backupReminderDays: Math.max(1, Math.min(90, Number(e.target.value) || 7)) })} />}
        </Field>
      </Panel>
    </div>
  )
}
