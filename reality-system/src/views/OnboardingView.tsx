/**
 * Setup wizard. Every step is saved locally as soon as you continue, every
 * optional step can be skipped, and every choice can be changed later in
 * Customization or Settings. No real name, email or account is needed.
 */
import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useApp } from '@/store/app'
import { useMotion } from '@/hooks/useMotion'
import { Button } from '@/components/ui/Button'
import { Field, Select, TextInput } from '@/components/ui/Field'
import { Toggle } from '@/components/ui/Toggle'
import { Segmented } from '@/components/ui/Tabs'
import { Logo } from '@/components/layout/Logo'
import { THEMES } from '@/theme/themes'
import { RANK_PRESETS } from '@/game/rankPresets'
import { DEFAULT_CATEGORIES } from '@/game/defaults'
import { getDb } from '@/db/database'
import { createQuest, emptyDraft, type QuestDraft } from '@/quests/service'
import { finishOnboarding } from '@/game/engine'
import { presentResult } from '@/app/actions'
import { MOTION_LEVELS, type MotionLevel } from '@/domain/settings'
import { cn } from '@/lib/cn'
import { useUi } from '@/store/ui'

const AREAS = ['Study', 'Fitness', 'Reading', 'Projects', 'Creativity', 'Health', 'Languages', 'Career', 'Mindfulness', 'Social life']
const ACTIVITIES = ['Walking', 'Running', 'Gym', 'Home workout', 'Yoga', 'Cycling', 'Swimming', 'Team sports', 'Stretching']
const STEPS = ['Identity', 'Appearance', 'Ranks', 'Focus areas', 'Goals', 'Daily rhythm', 'Starter quests'] as const

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn('rounded-full border px-3 py-1.5 text-sm transition-colors', on ? 'border-accent bg-accent/15 text-fg' : 'border-line text-muted hover:text-fg')}
    >
      {on && <Check className="mr-1 inline size-3.5" aria-hidden />}
      {children}
    </button>
  )
}

const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export default function OnboardingView() {
  const m = useMotion()
  const { settings, profile, rules, updateSettings, updateProfile, updateRules } = useApp()
  const pushToast = useUi((s) => s.pushToast)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState(profile.displayName)
  const [themeId, setThemeId] = useState(settings.appearance.themeId)
  const [motionLevel, setMotionLevel] = useState<MotionLevel>(settings.appearance.motion)
  const [reduced, setReduced] = useState(settings.appearance.reducedMotion)
  const [soundOn, setSoundOn] = useState(settings.sound.enabled)
  const [rankPreset, setRankPreset] = useState('classic')
  const [areas, setAreas] = useState<string[]>(profile.focusAreas)
  const [cats, setCats] = useState<string[]>(DEFAULT_CATEGORIES.map((c) => c.id))
  const [studyMinutes, setStudyMinutes] = useState(profile.studyMinutesGoal)
  const [projects, setProjects] = useState(profile.projects.join('\n'))
  const [activities, setActivities] = useState<string[]>(profile.activities)
  const [dailyCount, setDailyCount] = useState(settings.general.dailyQuestLimit)
  const [weeklyQuests, setWeeklyQuests] = useState(profile.weeklyQuestGoal)
  const [weeklyFocus, setWeeklyFocus] = useState(profile.weeklyFocusMinutesGoal)
  const [resetHour, setResetHour] = useState(settings.general.resetHour)
  const [weekStart, setWeekStart] = useState<0 | 1>(settings.general.weekStart)
  const [starters, setStarters] = useState<string[]>([])

  const projectList = projects
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 20)

  const starterOptions: Array<{ id: string; label: string; draft: Partial<QuestDraft> }> = [
    { id: 'study', label: `Study for ${studyMinutes || 30} minutes (daily)`, draft: { title: `Study for ${studyMinutes || 30} minutes`, categoryId: 'study', attributeId: 'int', type: 'timed', focusMinutes: Math.min(240, Math.max(5, studyMinutes || 30)), recurrence: { kind: 'daily' }, estimatedMinutes: studyMinutes || 30 } },
    { id: 'read', label: 'Read 20 pages (daily)', draft: { title: 'Read 20 pages', categoryId: 'reading', attributeId: 'wis', type: 'measurable', target: { value: 20, unit: 'pages' }, recurrence: { kind: 'daily' }, estimatedMinutes: 30 } },
    { id: 'move', label: `${activities[0] ?? 'Exercise'} for 30 minutes (Mon / Wed / Fri)`, draft: { title: `${activities[0] ?? 'Exercise'} for 30 minutes`, categoryId: 'exercise', attributeId: 'str', type: 'custom', recurrence: { kind: 'weekdays', days: [1, 3, 5] }, estimatedMinutes: 30, difficulty: 'challenging' } },
    { id: 'reflect', label: 'Evening reflection (daily routine)', draft: { title: 'Evening reflection', categoryId: 'reflection', attributeId: 'wis', type: 'routine', recurrence: { kind: 'daily' }, estimatedMinutes: 10, difficulty: 'easy' } },
    ...projectList.slice(0, 3).map((p, i) => ({ id: `project-${i}`, label: `Work on “${p}” (weekly)`, draft: { title: `Work on ${p}`.slice(0, 140), categoryId: 'projects', attributeId: 'cre', type: 'weekly' as const, recurrence: { kind: 'weekly' as const }, estimatedMinutes: 90, difficulty: 'hard' as const } })),
  ]

  /** Saves the current step, then advances. */
  const saveStep = async (s: number) => {
    switch (s) {
      case 0:
        await updateProfile((p) => ({ ...p, displayName: name.trim().slice(0, 40) }))
        break
      case 1:
        await updateSettings((x) => ({ ...x, appearance: { ...x.appearance, themeId, motion: motionLevel, reducedMotion: reduced }, sound: { ...x.sound, enabled: soundOn } }))
        break
      case 2: {
        const preset = RANK_PRESETS.find((r) => r.id === rankPreset) ?? RANK_PRESETS[0]
        await updateRules({ ...rules, ranks: preset.ranks })
        break
      }
      case 3: {
        await updateProfile((p) => ({ ...p, focusAreas: areas }))
        const db = getDb()
        await db.transaction('rw', db.categories, async () => {
          for (const c of DEFAULT_CATEGORIES) await db.categories.update(c.id, { archived: !cats.includes(c.id) && c.id !== 'general' })
        })
        break
      }
      case 4:
        await updateProfile((p) => ({ ...p, studyMinutesGoal: studyMinutes, projects: projectList, activities, weeklyQuestGoal: weeklyQuests, weeklyFocusMinutesGoal: weeklyFocus }))
        await updateSettings((x) => ({ ...x, general: { ...x.general, dailyQuestLimit: dailyCount } }))
        break
      case 5:
        await updateSettings((x) => ({ ...x, general: { ...x.general, resetHour, weekStart } }))
        break
    }
  }

  const next = async () => {
    setBusy(true)
    try {
      await saveStep(step)
      setStep((s) => Math.min(STEPS.length - 1, s + 1))
    } finally {
      setBusy(false)
    }
  }

  const finish = async () => {
    setBusy(true)
    try {
      for (const id of starters) {
        const opt = starterOptions.find((o) => o.id === id)
        if (opt) await createQuest(emptyDraft(opt.draft))
      }
      const result = await finishOnboarding()
      await useApp.getState().reload()
      presentResult(result)
      pushToast({ kind: 'success', title: 'System online', body: 'Welcome. Your progress is stored only on this device.' })
    } catch (err) {
      pushToast({ kind: 'error', title: 'Setup could not be saved', body: err instanceof Error ? err.message : String(err) })
      setBusy(false)
    }
  }

  const body: ReactNode[] = [
    <div key="0" className="space-y-4">
      <p className="text-sm text-muted">What should the system call you? Any name or nickname works — no real name, email or account is needed.</p>
      <Field label="Display name" hint="Optional. You can change it later.">
        {(id, d) => <TextInput id={id} aria-describedby={d} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Player" data-autofocus />}
      </Field>
    </div>,
    <div key="1" className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">Visual theme</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={themeId === t.id}
              onClick={() => {
                setThemeId(t.id)
                void updateSettings((x) => ({ ...x, appearance: { ...x.appearance, themeId: t.id } }))
              }}
              className={cn('flex items-center gap-2 rounded-xl border p-2 text-left text-xs', themeId === t.id ? 'border-accent ring-1 ring-accent' : 'border-line')}
              style={{ background: t.tokens.bg }}
            >
              <span className="flex -space-x-1">
                {[t.tokens.accent, t.tokens.accent2, t.tokens.highlight].map((c) => (
                  <span key={c} className="size-4 rounded-full ring-2" style={{ background: c, ['--tw-ring-color' as string]: t.tokens.bg }} />
                ))}
              </span>
              <span style={{ color: t.tokens.text }}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Animation intensity</p>
        <Segmented label="Animation intensity" value={motionLevel} onChange={setMotionLevel} options={MOTION_LEVELS.map((l) => ({ value: l, label: l[0].toUpperCase() + l.slice(1) }))} />
      </div>
      <Field label="Reduced motion">
        {(id) => (
          <Select id={id} value={reduced} onChange={(e) => setReduced(e.target.value as typeof reduced)}>
            <option value="system">Follow my operating system</option>
            <option value="reduce">Always reduce motion</option>
            <option value="allow">Allow full motion</option>
          </Select>
        )}
      </Field>
      <Toggle checked={soundOn} onChange={setSoundOn} label="Sound effects" description="Off by default. Sounds are generated locally and only play after your actions." />
    </div>,
    <div key="2" className="space-y-3">
      <p className="text-sm text-muted">Ranks are big milestones. Levels grow with every quest; ranks change only at certain levels. You can rename ranks and change thresholds later.</p>
      {RANK_PRESETS.map((r) => (
        <button key={r.id} type="button" aria-pressed={rankPreset === r.id} onClick={() => setRankPreset(r.id)} className={cn('w-full rounded-xl border p-3 text-left', rankPreset === r.id ? 'border-accent bg-accent/10' : 'border-line')}>
          <p className="font-medium">{r.name}</p>
          <p className="text-sm text-muted">{r.description}</p>
        </button>
      ))}
    </div>,
    <div key="3" className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">Main areas of improvement</p>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <Chip key={a} on={areas.includes(a)} onClick={() => setAreas((x) => toggleIn(x, a))}>
              {a}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Quest categories to use</p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_CATEGORIES.filter((c) => c.id !== 'general').map((c) => (
            <Chip key={c.id} on={cats.includes(c.id)} onClick={() => setCats((x) => toggleIn(x, c.id))}>
              {c.name}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Unselected categories are hidden, not deleted. You can add custom categories in Settings.</p>
      </div>
    </div>,
    <div key="4" className="grid gap-4 sm:grid-cols-2">
      <Field label="Daily study goal (minutes)" hint="Set 0 if this does not apply.">
        {(id, d) => <TextInput id={id} aria-describedby={d} type="number" min={0} max={600} value={studyMinutes} onChange={(e) => setStudyMinutes(Math.max(0, Math.min(600, Number(e.target.value) || 0)))} />}
      </Field>
      <Field label="Quests per day (target)" hint="The planner warns when a day has more.">
        {(id, d) => <TextInput id={id} aria-describedby={d} type="number" min={1} max={50} value={dailyCount} onChange={(e) => setDailyCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} />}
      </Field>
      <Field label="Weekly quest goal">{(id) => <TextInput id={id} type="number" min={0} max={500} value={weeklyQuests} onChange={(e) => setWeeklyQuests(Math.max(0, Math.min(500, Number(e.target.value) || 0)))} />}</Field>
      <Field label="Weekly focus goal (minutes)">{(id) => <TextInput id={id} type="number" min={0} max={10000} value={weeklyFocus} onChange={(e) => setWeeklyFocus(Math.max(0, Math.min(10000, Number(e.target.value) || 0)))} />}</Field>
      <Field label="Personal projects (one per line)" className="sm:col-span-2">
        {(id) => <textarea id={id} className="input min-h-20" value={projects} onChange={(e) => setProjects(e.target.value)} placeholder={'Portfolio website\nShort story'} />}
      </Field>
      <div className="sm:col-span-2">
        <p className="mb-2 text-sm font-medium">Physical activities you enjoy</p>
        <div className="flex flex-wrap gap-2">
          {ACTIVITIES.map((a) => (
            <Chip key={a} on={activities.includes(a)} onClick={() => setActivities((x) => toggleIn(x, a))}>
              {a}
            </Chip>
          ))}
        </div>
      </div>
    </div>,
    <div key="5" className="space-y-4">
      <Field label="A new day starts at" hint="Late-night work before this hour still counts for the previous day. Times use this device's time zone; past records keep the day they were saved on.">
        {(id, d) => (
          <Select id={id} aria-describedby={d} value={resetHour} onChange={(e) => setResetHour(Number(e.target.value))}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div>
        <p className="mb-2 text-sm font-medium">Weeks start on</p>
        <Segmented label="Week start" value={String(weekStart) as '0' | '1'} onChange={(v) => setWeekStart(Number(v) as 0 | 1)} options={[{ value: '1', label: 'Monday' }, { value: '0', label: 'Sunday' }]} />
      </div>
      <p className="text-xs text-muted">Detected time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
    </div>,
    <div key="6" className="space-y-3">
      <p className="text-sm text-muted">Optionally create a few starter quests from your answers. Nothing is created unless you select it — and no progress is invented.</p>
      {starterOptions.map((o) => (
        <label key={o.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 hover:border-accent/50">
          <input type="checkbox" className="size-4 accent-[var(--rs-accent)]" checked={starters.includes(o.id)} onChange={() => setStarters((x) => toggleIn(x, o.id))} />
          <span className="text-sm">{o.label}</span>
        </label>
      ))}
    </div>,
  ]

  const last = step === STEPS.length - 1
  return (
    <div className="grid min-h-dvh place-items-center bg-bg bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--rs-accent)_14%,transparent),transparent_60%)] p-4">
      <div className="panel panel-glow w-full max-w-2xl">
        <header className="flex items-center gap-3 border-b border-line/70 px-pad py-4">
          <Logo size={36} />
          <div className="flex-1">
            <p className="label-caps text-accent">
              Setup · step {step + 1} of {STEPS.length}
            </p>
            <h1 className="font-display text-lg tracking-wider">{STEPS[step]}</h1>
          </div>
        </header>
        <div className="flex gap-1 px-pad pt-4" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-accent' : 'bg-surface2')} />
          ))}
        </div>
        <div className="min-h-[300px] px-pad py-5">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 * m.distance }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 * m.distance }} transition={{ duration: 0.25 * m.speed }}>
              {body[step]}
            </motion.div>
          </AnimatePresence>
        </div>
        <footer className="flex flex-wrap items-center gap-2 border-t border-line/70 px-pad py-3">
          <Button variant="ghost" icon={<ArrowLeft className="size-4" />} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || busy}>
            Back
          </Button>
          <span className="flex-1" />
          {!last && step > 0 && (
            <Button variant="ghost" onClick={() => setStep((s) => s + 1)} disabled={busy}>
              Skip
            </Button>
          )}
          {last ? (
            <Button variant="primary" loading={busy} onClick={() => void finish()} icon={<Check className="size-4" />}>
              Enter the system
            </Button>
          ) : (
            <Button variant="primary" loading={busy} onClick={() => void next()} iconRight={<ArrowRight className="size-4" />}>
              Continue
            </Button>
          )}
        </footer>
      </div>
    </div>
  )
}
