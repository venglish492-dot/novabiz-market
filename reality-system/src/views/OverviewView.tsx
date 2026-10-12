import { useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Activity, ArrowDown, ArrowUp, Brain, CalendarClock, Eye, EyeOff, LayoutGrid, ListTodo, Maximize2, Minimize2, Plus, RotateCcw, Sparkles, Target, Zap } from 'lucide-react'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { navigate } from '@/app/router'
import { useToday } from '@/hooks/useToday'
import { useAttributes, useCategoryMap, useProgress, useQuests, useTodayQuests } from '@/hooks/useData'
import { useMotion } from '@/hooks/useMotion'
import { useDashboardData, type DashboardData } from './overview/useDashboardData'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { EmptyState, LoadingBlock, SectionTitle, Stat } from '@/components/ui/Misc'
import { AnimatedNumber, ProgressBar, Ring } from '@/components/ui/Progress'
import { AvatarEmblem } from '@/components/game/AvatarEmblem'
import { RankEmblem } from '@/components/game/RankEmblem'
import { XpBar } from '@/components/game/XpBar'
import { AttributeList } from '@/components/game/AttributeList'
import { QuestCard } from '@/components/game/QuestCard'
import { CoreViewport } from '@/three/CoreViewport'
import { systemMessages } from '@/game/messages'
import { buildDailyPlan } from '@/planner/planner'
import { goalProgress } from '@/goals/service'
import { DEFAULT_WIDGETS, type WidgetConfig, type WidgetId } from '@/domain/settings'
import { formatMinutes, formatNumber, formatXp, percent } from '@/lib/format'
import { daysBetween, formatDateKey, formatDateTime, formatTime, parseDateKey } from '@/lib/dates'
import { cn } from '@/lib/cn'
import type { ProgressState } from '@/game/progress'
import type { TodayQuest } from '@/hooks/useData'

const WIDGET_META: Record<WidgetId, { title: string; icon: ReactNode }> = {
  profile: { title: 'Status', icon: <Sparkles className="size-4" /> },
  core: { title: 'System core', icon: <Zap className="size-4" /> },
  message: { title: 'System message', icon: <Brain className="size-4" /> },
  missions: { title: 'Daily missions', icon: <ListTodo className="size-4" /> },
  attributes: { title: 'Attributes', icon: <Activity className="size-4" /> },
  productivity: { title: 'Productivity', icon: <LayoutGrid className="size-4" /> },
  planner: { title: 'Today’s plan', icon: <CalendarClock className="size-4" /> },
  milestones: { title: 'Goals & milestones', icon: <Target className="size-4" /> },
  activity: { title: 'Recent progression', icon: <Zap className="size-4" /> },
}

export default function OverviewView() {
  const today = useToday()
  const progress = useProgress()
  const todayQuests = useTodayQuests(today)
  const data = useDashboardData(today)
  const widgets = useApp((s) => s.settings.dashboard.widgets)
  const updateSettings = useApp((s) => s.updateSettings)
  const [editing, setEditing] = useState(false)

  const setWidgets = (fn: (w: WidgetConfig[]) => WidgetConfig[]) => void updateSettings((s) => ({ ...s, dashboard: { widgets: fn(s.dashboard.widgets) } }))
  const patch = (id: WidgetId, p: Partial<WidgetConfig>) => setWidgets((ws) => ws.map((w) => (w.id === id ? { ...w, ...p } : w)))
  const move = (id: WidgetId, dir: -1 | 1) =>
    setWidgets((ws) => {
      const i = ws.findIndex((w) => w.id === id)
      const j = i + dir
      if (j < 0 || j >= ws.length) return ws
      const next = [...ws]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  if (!progress || !todayQuests || !data) {
    return <LoadingBlock rows={5} label="Loading dashboard" />
  }
  const visible = widgets.filter((w) => w.visible)
  const hidden = widgets.filter((w) => !w.visible)

  return (
    <div>
      <SectionTitle
        eyebrow="System overview"
        title="Mainframe"
        actions={
          <>
            {editing && (
              <Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" />} onClick={() => setWidgets(() => DEFAULT_WIDGETS.map((w) => ({ ...w })))}>
                Restore default layout
              </Button>
            )}
            <Button size="sm" variant={editing ? 'primary' : 'secondary'} icon={<LayoutGrid className="size-4" />} onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
              {editing ? 'Done' : 'Customize layout'}
            </Button>
          </>
        }
      />
      {editing && hidden.length > 0 && (
        <div className="panel mb-gap flex flex-wrap items-center gap-2 p-3 text-sm">
          <span className="text-muted">Hidden widgets:</span>
          {hidden.map((w) => (
            <Button key={w.id} size="sm" variant="subtle" icon={<Eye className="size-3.5" />} onClick={() => patch(w.id, { visible: true })}>
              {WIDGET_META[w.id].title}
            </Button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-gap lg:grid-cols-3">
        <AnimatePresence initial={false}>
          {visible.map((w, i) => (
            <motion.div key={w.id} layout className={cn(w.wide ? 'lg:col-span-2' : 'lg:col-span-1')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Panel
                id={`widget-${w.id}`}
                title={WIDGET_META[w.id].title}
                icon={WIDGET_META[w.id].icon}
                className="h-full"
                collapsed={w.collapsed}
                onToggleCollapse={() => patch(w.id, { collapsed: !w.collapsed })}
                actions={
                  editing ? (
                    <div className="flex gap-0.5">
                      <WidgetBtn label="Move up" onClick={() => move(w.id, -1)} disabled={i === 0}>
                        <ArrowUp className="size-4" />
                      </WidgetBtn>
                      <WidgetBtn label="Move down" onClick={() => move(w.id, 1)} disabled={i === visible.length - 1}>
                        <ArrowDown className="size-4" />
                      </WidgetBtn>
                      <WidgetBtn label={w.wide ? 'Make narrow' : 'Make wide'} onClick={() => patch(w.id, { wide: !w.wide })}>
                        {w.wide ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                      </WidgetBtn>
                      <WidgetBtn label="Hide widget" onClick={() => patch(w.id, { visible: false })}>
                        <EyeOff className="size-4" />
                      </WidgetBtn>
                    </div>
                  ) : undefined
                }
              >
                <WidgetBody id={w.id} progress={progress} todayQuests={todayQuests} data={data} today={today} />
              </Panel>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function WidgetBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="rounded-lg p-1.5 text-muted hover:bg-accent/10 hover:text-fg disabled:opacity-30">
      {children}
    </button>
  )
}

interface BodyProps {
  id: WidgetId
  progress: ProgressState
  todayQuests: TodayQuest[]
  data: DashboardData
  today: string
}

function WidgetBody(props: BodyProps) {
  switch (props.id) {
    case 'profile':
      return <ProfileWidget {...props} />
    case 'core':
      return <CoreWidget {...props} />
    case 'message':
      return <MessageWidget {...props} />
    case 'missions':
      return <MissionsWidget {...props} />
    case 'attributes':
      return <AttributesWidget {...props} />
    case 'productivity':
      return <ProductivityWidget {...props} />
    case 'planner':
      return <PlannerWidget {...props} />
    case 'milestones':
      return <MilestonesWidget {...props} />
    case 'activity':
      return <ActivityWidget {...props} />
  }
}

function ProfileWidget({ progress, todayQuests, data }: BodyProps) {
  const profile = useApp((s) => s.profile)
  const avatar = useApp((s) => s.settings.avatar)
  const xpFormat = useApp((s) => s.settings.appearance.xpFormat)
  const done = todayQuests.filter((q) => q.completion).length
  const todayPct = percent(done, todayQuests.length)
  const goalPcts = data.goals.filter((g) => g.status === 'active').map((g) => goalProgress(g, data.milestones.filter((m) => m.goalId === g.id), []).percent)
  const goalAvg = goalPcts.length ? Math.round(goalPcts.reduce((a, b) => a + b, 0) / goalPcts.length) : null
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <AvatarEmblem avatar={avatar} name={profile.displayName} size={68} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold tracking-wide">{profile.displayName || 'Player'}</p>
          {profile.equippedTitle && <p className="text-xs text-highlight">«{profile.equippedTitle}»</p>}
          <p className="text-sm text-muted">
            Rank <span style={{ color: progress.rank.rank.color }}>{progress.rank.rank.label}</span> · {progress.rank.rank.title}
          </p>
        </div>
        <div className="text-center">
          <RankEmblem rank={progress.rank.rank} index={progress.rank.index} size={58} />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div>
          <p className="label-caps text-muted">Level</p>
          <AnimatedNumber value={progress.level.level} className="text-glow text-4xl font-bold text-fg" />
        </div>
        <div className="flex-1 pb-1">
          <XpBar level={progress.level} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Lifetime XP" value={<AnimatedNumber value={progress.totalXp} format={(n) => formatXp(n, xpFormat)} />} />
        <Stat label="Today" value={`${todayPct}%`} hint={`${done}/${todayQuests.length} quests`} />
        <Stat label="Goals" value={goalAvg === null ? '—' : `${goalAvg}%`} hint={goalAvg === null ? 'No active goals' : 'avg. progress'} />
      </div>
    </div>
  )
}

function CoreWidget({ progress }: BodyProps) {
  return (
    <div>
      <CoreViewport className="h-64" pulseKey={progress.level.level} onActivate={() => navigate('status')} label="System core. Activate to open your status profile." />
      <p className="text-center text-xs text-muted">Drag to rotate · click to open your status</p>
    </div>
  )
}

function MessageWidget({ progress, todayQuests, data, today }: BodyProps) {
  const profile = useApp((s) => s.profile)
  const msgs = systemMessages({
    today,
    totalQuests: data.questCount,
    todayTotal: todayQuests.length,
    todayDone: todayQuests.filter((q) => q.completion).length,
    lastActiveDate: data.lastActiveDate,
    weekCompletions: data.weekCompletions,
    weeklyQuestGoal: profile.weeklyQuestGoal,
    focusMinutesToday: data.focusToday,
    weekFocusMinutes: data.weekFocus,
    weeklyFocusGoal: profile.weeklyFocusMinutesGoal,
    dueSoon: todayQuests.filter((q) => !q.completion && q.quest.dueDate && daysBetween(today, q.quest.dueDate) <= 3).length,
    xpRemaining: progress.level.xpRemaining,
    xpForNext: progress.level.xpForNext,
    nextLevel: progress.level.level + 1,
    lastCompletedTitle: data.lastCompletedTitle,
  })
  return (
    <ul className="space-y-2" aria-live="polite">
      {msgs.map((m, i) => (
        <li key={i} className={cn('flex items-start gap-3 rounded-lg border-l-2 bg-surface/40 px-3 py-2 text-sm', m.tone === 'success' ? 'border-success' : m.tone === 'welcome' ? 'border-highlight' : 'border-accent')}>
          <span className="label-caps mt-0.5 shrink-0 text-accent">[System]</span>
          <span>{m.text}</span>
        </li>
      ))}
    </ul>
  )
}

function MissionsWidget({ todayQuests, today }: BodyProps) {
  const limit = useApp((s) => s.settings.general.dailyQuestLimit)
  const categories = useCategoryMap()
  const openEditor = useUi((s) => s.openEditor)
  const setQuickAdd = useUi((s) => s.setQuickAdd)
  const m = useMotion()
  const plan = useMemo(() => buildDailyPlan(todayQuests.map((t) => ({ quest: t.quest, occurrenceKey: t.occurrenceKey, done: !!t.completion })), today, 9999, 999), [todayQuests, today])
  const byId = new Map(todayQuests.map((t) => [`${t.quest.id}::${t.occurrenceKey}`, t]))
  const ordered = plan.ordered.map((p) => byId.get(`${p.quest.id}::${p.occurrenceKey}`)!).filter(Boolean)
  const shown = ordered.slice(0, limit)
  if (todayQuests.length === 0) {
    return (
      <EmptyState
        icon={<ListTodo className="size-6" />}
        title="No missions today"
        body="Create a quest to give today a direction. Recurring quests appear here automatically."
        action={
          <div className="flex gap-2">
            <Button variant="primary" size="sm" icon={<Plus className="size-4" />} onClick={() => setQuickAdd(true)}>
              Quick add
            </Button>
            <Button size="sm" onClick={() => openEditor(null)}>
              Full editor
            </Button>
          </div>
        }
      />
    )
  }
  return (
    <div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {shown.map((t) => (
            <motion.li key={`${t.quest.id}-${t.occurrenceKey}`} layout={m.distance ? 'position' : false} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
              <QuestCard quest={t.quest} occurrenceKey={t.occurrenceKey} completion={t.completion} category={categories.get(t.quest.categoryId)} today={today} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">
          {todayQuests.filter((q) => q.completion).length} of {todayQuests.length} complete
          {ordered.length > shown.length && ` · ${ordered.length - shown.length} more`}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => setQuickAdd(true)}>
            Quick add
          </Button>
          <Button size="sm" variant="subtle" onClick={() => navigate('quests')}>
            All daily quests
          </Button>
        </div>
      </div>
    </div>
  )
}

function AttributesWidget({ progress }: BodyProps) {
  const attributes = useAttributes()
  if (!attributes) return null
  return (
    <div>
      <AttributeList attributes={attributes} progress={progress} compact />
      <p className="mt-3 text-[11px] text-muted">Attributes are gamified tracking scores, not scientific measurements.</p>
    </div>
  )
}

function ProductivityWidget({ todayQuests, data, today }: BodyProps) {
  const categories = useCategoryMap()
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const max = Math.max(1, ...data.perDay.map((d) => d.quests))
  const doneToday = todayQuests.filter((q) => q.completion).length
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Quests today" value={doneToday} />
        <Stat label="Focus today" value={formatMinutes(data.focusToday)} />
      </div>
      <figure>
        <figcaption className="label-caps mb-2 text-muted">Last 7 days · completed quests</figcaption>
        <div className="flex h-24 items-end gap-1.5" role="img" aria-label={`Completed quests per day: ${data.perDay.map((d) => `${formatDateKey(d.date, dateFormat)} ${d.quests}`).join(', ')}`}>
          {data.perDay.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="num text-[10px] text-muted">{d.quests || ''}</span>
              <div className={cn('w-full rounded-t-md', d.date === today ? 'bg-accent' : 'bg-accent/35')} style={{ height: `${Math.max(4, (d.quests / max) * 64)}px` }} />
              <span className="text-[10px] text-muted">{parseDateKey(d.date).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
            </div>
          ))}
        </div>
      </figure>
      {data.topCategories.length > 0 && (
        <div>
          <p className="label-caps mb-2 text-muted">Most active categories (7 days)</p>
          <ul className="space-y-1.5">
            {data.topCategories.map(([id, n]) => {
              const c = categories.get(id)
              return (
                <li key={id} className="flex items-center gap-2 text-sm">
                  <span className="size-2 rounded-full" style={{ background: c?.color }} />
                  <span className="flex-1 truncate">{c?.name ?? id}</span>
                  <span className="num text-muted">{n}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {data.recent.length > 0 && (
        <div>
          <p className="label-caps mb-2 text-muted">Recently completed</p>
          <ul className="space-y-1 text-sm">
            {data.recent.map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span className="truncate">{c.title}</span>
                <span className="num shrink-0 text-xs text-muted">{formatTime(c.completedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.questCount > 0 && data.recent.length === 0 && <p className="text-sm text-muted">Complete a quest to start your activity history.</p>}
    </div>
  )
}

function PlannerWidget({ todayQuests, today }: BodyProps) {
  const general = useApp((s) => s.settings.general)
  const quests = useQuests()
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const plan = useMemo(
    () => buildDailyPlan(todayQuests.map((t) => ({ quest: t.quest, occurrenceKey: t.occurrenceKey, done: !!t.completion })), today, general.dailyCapacityMinutes, general.dailyQuestLimit, quests ?? []),
    [todayQuests, today, general.dailyCapacityMinutes, general.dailyQuestLimit, quests],
  )
  const load = plan.remainingMinutes / general.dailyCapacityMinutes
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Ring value={Math.min(1, load)} label="Planned workload vs. capacity" color={plan.overloaded ? 'var(--rs-warning)' : 'var(--rs-accent)'} size={72}>
          <span className="num text-xs">{Math.round(load * 100)}%</span>
        </Ring>
        <div className="text-sm">
          <p>
            <span className="num text-fg">{formatMinutes(plan.remainingMinutes)}</span> <span className="text-muted">remaining of {formatMinutes(general.dailyCapacityMinutes)} capacity</span>
          </p>
          {plan.overloaded && <p className="text-warning">More than your daily capacity.</p>}
        </div>
      </div>
      <ul className="space-y-1 text-sm text-muted">
        {plan.summary.map((s) => (
          <li key={s}>· {s}</li>
        ))}
      </ul>
      {plan.dueSoon.length > 0 && (
        <div>
          <p className="label-caps mb-1.5 text-muted">Upcoming deadlines</p>
          <ul className="space-y-1 text-sm">
            {plan.dueSoon.slice(0, 4).map((q) => (
              <li key={q.id} className="flex justify-between gap-2">
                <span className="truncate">{q.title}</span>
                <span className="num shrink-0 text-xs text-muted">{formatDateKey(q.dueDate!, dateFormat)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button size="sm" variant="subtle" onClick={() => navigate('quests')}>
        Open planner
      </Button>
    </div>
  )
}

function MilestonesWidget({ data }: BodyProps) {
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const active = data.goals.filter((g) => g.status === 'active')
  if (active.length === 0) {
    return <EmptyState icon={<Target className="size-6" />} title="No active goals" body="Turn a long-term ambition into milestones and quests." action={<Button size="sm" variant="subtle" onClick={() => navigate('goals')}>Create a goal</Button>} />
  }
  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {active.slice(0, 3).map((g) => {
          const p = goalProgress(g, data.milestones.filter((m) => m.goalId === g.id), [])
          return (
            <li key={g.id}>
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <span className="truncate">{g.name}</span>
                <span className="num text-muted">{p.percent}%</span>
              </div>
              <ProgressBar value={p.percent / 100} label={`${g.name} progress`} height="h-1.5" />
            </li>
          )
        })}
      </ul>
      {data.upcomingMilestones.length > 0 && (
        <div>
          <p className="label-caps mb-1.5 text-muted">Next milestones</p>
          <ul className="space-y-1 text-sm">
            {data.upcomingMilestones.map((m) => (
              <li key={m.id} className="flex justify-between gap-2">
                <span className="truncate">{m.title}</span>
                {m.dueDate && <span className="num shrink-0 text-xs text-muted">{formatDateKey(m.dueDate, dateFormat)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ActivityWidget({ data }: BodyProps) {
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  if (data.activity.length === 0) return <EmptyState title="No events yet" body="Completed quests, focus sessions, level-ups and achievements will appear here." />
  return (
    <ol className="relative space-y-3 border-l border-line pl-4">
      {data.activity.map((a) => (
        <li key={a.id} className="relative text-sm">
          <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-bg bg-accent" />
          <p className="truncate">{a.title}</p>
          <p className="num text-xs text-muted">
            {a.type.replace('-', ' ')} · {formatDateTime(a.createdAt, dateFormat)}
            {a.xp !== 0 && <span className={a.xp > 0 ? 'text-highlight' : 'text-warning'}> · {a.xp > 0 ? '+' : ''}{formatNumber(a.xp)} XP</span>}
          </p>
        </li>
      ))}
    </ol>
  )
}
