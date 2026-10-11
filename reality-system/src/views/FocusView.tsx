import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Coffee, Flag, Hourglass, Pause, Play, Square, Volume2, VolumeX } from 'lucide-react'
import { getDb } from '@/db/database'
import { saveActiveTimer } from '@/db/config'
import { FOCUS_MODES, type ActiveTimer, type FocusMode } from '@/domain/schemas'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { useToday } from '@/hooks/useToday'
import { useTodayQuests } from '@/hooks/useData'
import { focusSessionAction } from '@/app/actions'
import { elapsedSeconds, FOCUS_MODE_INFO, pauseTimer, phaseMinutes, remainingSeconds, resumeTimer, startTimer } from '@/focus/timer'
import { useActiveTimer, useNow } from '@/hooks/useActiveTimer'
import { focusXp } from '@/game/rules'
import { startAmbient } from '@/audio/sound'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'
import { Segmented } from '@/components/ui/Tabs'
import { Badge, EmptyState, SectionTitle, Stat } from '@/components/ui/Misc'
import { Ring } from '@/components/ui/Progress'
import { formatClock, formatMinutes } from '@/lib/format'
import { formatDateTime, weekStartKey } from '@/lib/dates'
import { cn } from '@/lib/cn'

export default function FocusView() {
  const today = useToday()
  const focus = useApp((s) => s.settings.focus)
  const sound = useApp((s) => s.settings.sound)
  const rules = useApp((s) => s.rules)
  const weekStart = useApp((s) => s.settings.general.weekStart)
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const updateSettings = useApp((s) => s.updateSettings)
  const focusTarget = useUi((s) => s.focusTarget)
  const setFocusTarget = useUi((s) => s.setFocusTarget)
  const todayQuests = useTodayQuests(today)
  const stored = useActiveTimer()
  const sessions = useLiveQuery(() => getDb().focusSessions.orderBy('startedAt').reverse().limit(30).toArray(), [])
  const weekSessions = useLiveQuery(() => getDb().focusSessions.where('dateKey').aboveOrEqual(weekStartKey(today, weekStart)).toArray(), [today, weekStart])

  const [mode, setMode] = useState<FocusMode>(focus.defaultMode)
  const [questKey, setQuestKey] = useState('')
  const [ambientOn, setAmbientOn] = useState(false)
  const timer: ActiveTimer | null = stored ?? null
  const now = useNow(!!timer && timer.pausedAt === null)

  // Pre-select a quest when arriving from a timed quest.
  useEffect(() => {
    if (!focusTarget || !todayQuests) return
    const q = todayQuests.find((t) => t.quest.id === focusTarget.questId)
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time handoff from another screen
      setQuestKey(`${q.quest.id}::${q.occurrenceKey}`)
      if (q.quest.focusMinutes) void updateSettings((s) => ({ ...s, focus: { ...s.focus, focusMinutes: Math.max(5, Math.min(120, q.quest.focusMinutes!)) } }))
    }
    setFocusTarget(null)
  }, [focusTarget, todayQuests, setFocusTarget, updateSettings])

  // Show the countdown in the tab title.
  useEffect(() => {
    if (!timer) return
    const prev = document.title
    document.title = `${formatClock(remainingSeconds(timer, now))} · ${timer.phase === 'focus' ? 'Focus' : 'Break'} — REALITY SYSTEM`
    return () => {
      document.title = prev
    }
  }, [timer, now])

  // Optional locally generated ambient sound.
  useEffect(() => {
    if (!ambientOn || !timer || timer.pausedAt !== null || timer.phase !== 'focus') return
    return startAmbient(sound.volume)
  }, [ambientOn, timer, sound.volume])

  const openQuests = useMemo(() => (todayQuests ?? []).filter((t) => !t.completion), [todayQuests])
  const linked = timer?.questId ? todayQuests?.find((t) => t.quest.id === timer.questId)?.quest : undefined

  const start = async (phase: 'focus' | 'break' | 'long-break' = 'focus') => {
    const [questId, occurrenceKey] = questKey ? questKey.split('::') : [null, null]
    const t = startTimer({ mode, phase, minutes: phaseMinutes(phase, focus), now: Date.now(), questId: phase === 'focus' ? questId : null, occurrenceKey: phase === 'focus' ? occurrenceKey : null, cycle: timer?.cycle ?? 0 })
    await saveActiveTimer(t)
  }

  const stop = async (status: 'completed' | 'canceled') => {
    if (!timer) return
    const t = Date.now()
    await focusSessionAction({
      sessionId: timer.id,
      mode: timer.mode,
      phase: timer.phase,
      plannedSeconds: timer.plannedSeconds,
      actualSeconds: elapsedSeconds(timer, t),
      startedAtMs: timer.startedAt,
      status,
      questId: timer.questId,
      occurrenceKey: timer.occurrenceKey,
    })
    await saveActiveTimer(null)
  }

  const remaining = timer ? remainingSeconds(timer, now) : focus.focusMinutes * 60
  const total = timer ? timer.plannedSeconds : focus.focusMinutes * 60
  const elapsed = timer ? elapsedSeconds(timer, now) : 0
  const earlyXp = timer && timer.phase === 'focus' ? focusXp(rules, elapsed) : 0
  const isBreak = timer && timer.phase !== 'focus'

  const completedWeek = (weekSessions ?? []).filter((s) => s.status === 'completed' && s.phase === 'focus')
  const todayMinutes = completedWeek.filter((s) => s.dateKey === today).reduce((n, s) => n + Math.floor(s.actualSeconds / 60), 0)
  const weekMinutes = completedWeek.reduce((n, s) => n + Math.floor(s.actualSeconds / 60), 0)

  return (
    <div>
      <SectionTitle eyebrow="Deep work" title="Focus Chamber" description="A timestamp-based focus timer. It keeps running correctly if you switch tabs, and resumes after a page reload." />
      <div className="grid gap-gap lg:grid-cols-[1fr_380px]">
        <Panel glow={!!timer && !isBreak} className="items-center">
          <div className="flex flex-col items-center py-4">
            <Badge color={isBreak ? '#34d399' : undefined}>{timer ? (timer.phase === 'focus' ? `${FOCUS_MODE_INFO[timer.mode].label} focus` : timer.phase === 'long-break' ? 'Long break' : 'Short break') : 'Ready'}</Badge>
            <div className="my-6">
              <Ring value={timer ? 1 - remaining / total : 0} size={260} stroke={10} label="Timer progress" color={isBreak ? 'var(--rs-success)' : 'var(--rs-accent)'}>
                <div className="text-center" aria-live="off">
                  <p className="num text-glow text-6xl font-semibold" role="timer" aria-label={`${formatClock(remaining)} remaining`}>
                    {formatClock(remaining)}
                  </p>
                  {timer?.pausedAt && <p className="label-caps mt-1 text-warning">Paused</p>}
                  {linked && <p className="mx-auto mt-2 max-w-44 truncate text-xs text-muted">{linked.title}</p>}
                </div>
              </Ring>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {!timer ? (
                <>
                  <Button variant="primary" size="lg" icon={<Play className="size-5" />} onClick={() => void start('focus')}>
                    Start {focus.focusMinutes} min focus
                  </Button>
                  {focus.breaksEnabled && (
                    <Button size="lg" icon={<Coffee className="size-5" />} onClick={() => void start('break')}>
                      Break
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {timer.pausedAt ? (
                    <Button variant="primary" size="lg" icon={<Play className="size-5" />} onClick={() => void saveActiveTimer(resumeTimer(timer, Date.now()))}>
                      Resume
                    </Button>
                  ) : (
                    <Button variant="secondary" size="lg" icon={<Pause className="size-5" />} onClick={() => void saveActiveTimer(pauseTimer(timer, Date.now()))}>
                      Pause
                    </Button>
                  )}
                  {timer.phase === 'focus' ? (
                    <Button size="lg" icon={<Flag className="size-5" />} onClick={() => void stop('completed')} title="Finish now and record the time so far">
                      Finish early
                    </Button>
                  ) : (
                    <Button size="lg" icon={<Play className="size-5" />} onClick={() => void stop('completed').then(() => start('focus'))}>
                      Skip break
                    </Button>
                  )}
                  <Button variant="danger" size="lg" icon={<Square className="size-5" />} onClick={() => void stop('canceled')}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
            {timer?.phase === 'focus' && (
              <p className="mt-4 max-w-md text-center text-xs text-muted">
                {earlyXp > 0 ? `Finishing now would record ${Math.floor(elapsed / 60)} minutes and award ${earlyXp} XP.` : `Sessions earn XP after ${rules.focus.minQualifyingMinutes} minutes.`} Cancelling records the session without XP.
              </p>
            )}
            {sound.enabled && (
              <button type="button" onClick={() => setAmbientOn((v) => !v)} className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg" aria-pressed={ambientOn}>
                {ambientOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />} Ambient hum {ambientOn ? 'on' : 'off'}
              </button>
            )}
          </div>
        </Panel>

        <div className="space-y-gap">
          <Panel title="Session setup" icon={<Hourglass className="size-4" />}>
            <fieldset disabled={!!timer} className="space-y-4 disabled:opacity-60">
              <div>
                <p className="mb-2 text-sm font-medium">Mode</p>
                <Segmented label="Focus mode" value={mode} onChange={setMode} options={FOCUS_MODES.map((m) => ({ value: m, label: FOCUS_MODE_INFO[m].label }))} />
                <p className="mt-1 text-xs text-muted">{FOCUS_MODE_INFO[mode].hint}</p>
              </div>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Link to a quest (optional)</span>
                <Select value={questKey} onChange={(e) => setQuestKey(e.target.value)}>
                  <option value="">No quest</option>
                  {openQuests.map((t) => (
                    <option key={`${t.quest.id}::${t.occurrenceKey}`} value={`${t.quest.id}::${t.occurrenceKey}`}>
                      {t.quest.title}
                      {t.quest.type === 'timed' ? ` (completes after ${t.quest.focusMinutes} min)` : ''}
                    </option>
                  ))}
                </Select>
              </label>
              <Slider label="Focus length" min={5} max={120} step={5} value={focus.focusMinutes} format={(v) => `${v} min`} onChange={(v) => void updateSettings((s) => ({ ...s, focus: { ...s.focus, focusMinutes: v } }))} />
              <Toggle checked={focus.breaksEnabled} onChange={(v) => void updateSettings((s) => ({ ...s, focus: { ...s.focus, breaksEnabled: v } }))} label="Automatic breaks" description="A break starts automatically when a focus session ends." />
              {focus.breaksEnabled && (
                <>
                  <Slider label="Short break" min={1} max={30} value={focus.breakMinutes} format={(v) => `${v} min`} onChange={(v) => void updateSettings((s) => ({ ...s, focus: { ...s.focus, breakMinutes: v } }))} />
                  <Slider label="Long break" min={5} max={60} step={5} value={focus.longBreakMinutes} format={(v) => `${v} min`} onChange={(v) => void updateSettings((s) => ({ ...s, focus: { ...s.focus, longBreakMinutes: v } }))} />
                  <Slider label="Long break every" min={2} max={8} value={focus.longBreakEvery} format={(v) => `${v} sessions`} onChange={(v) => void updateSettings((s) => ({ ...s, focus: { ...s.focus, longBreakEvery: v } }))} />
                </>
              )}
            </fieldset>
            <p className="mt-4 text-xs text-muted">
              Reward rule: a finished focus session of at least {rules.focus.minQualifyingMinutes} minutes earns {rules.focus.xpPerMinute} XP per minute (max {rules.focus.maxXpPerSession}) and grows Focus. The app cannot verify that you stayed focused — it trusts you.
            </p>
          </Panel>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Focus today" value={formatMinutes(todayMinutes)} />
            <Stat label="This week" value={formatMinutes(weekMinutes)} />
          </div>
        </div>
      </div>

      <Panel title="Session history" className="mt-gap">
        {!sessions?.length ? (
          <EmptyState icon={<Hourglass className="size-6" />} title="No sessions yet" body="Completed, finished-early and cancelled sessions will be listed here." />
        ) : (
          <ul className="divide-y divide-line/40 text-sm">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-2">
                <Badge color={s.status === 'canceled' ? '#94a3b8' : s.phase === 'focus' ? undefined : '#34d399'}>{s.phase === 'focus' ? FOCUS_MODE_INFO[s.mode].label : s.phase.replace('-', ' ')}</Badge>
                <span className={cn('flex-1', s.status === 'canceled' && 'text-muted line-through')}>
                  {formatMinutes(s.actualSeconds / 60)} of {formatMinutes(s.plannedSeconds / 60)}
                </span>
                <span className="num text-xs text-muted">{formatDateTime(s.startedAt, dateFormat)}</span>
                <span className="num w-16 text-right text-highlight">{s.xpAwarded ? `+${s.xpAwarded} XP` : s.status === 'canceled' ? 'cancelled' : '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
