import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Award, CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, Clock, Flag, Hourglass, Milestone as MilestoneIcon, Sparkles, Trash2, TrendingUp } from 'lucide-react'
import { getDb } from '@/db/database'
import { useApp } from '@/store/app'
import { useCategories, useCategoryMap } from '@/hooks/useData'
import { useToday } from '@/hooks/useToday'
import { Panel } from '@/components/ui/Panel'
import { Button, IconButton } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Select, TextArea, TextInput } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/Tabs'
import { EmptyState, LoadingBlock, SectionTitle, Stat } from '@/components/ui/Misc'
import { addDays, addMonths, dateRange, daysInMonth, formatDateKey, monthStartKey, parseDateKey, toDateKey, weekStartKey, WEEKDAY_SHORT } from '@/lib/dates'
import { formatMinutes, formatNumber } from '@/lib/format'
import { newId } from '@/lib/id'
import { occurrenceKeyFor } from '@/quests/recurrence'
import { cn } from '@/lib/cn'
import { ACHIEVEMENTS } from '@/game/achievements'

type ViewMode = 'day' | 'week' | 'month'
type EntryType = 'completion' | 'focus' | 'deadline' | 'milestone' | 'achievement' | 'event' | 'level' | 'scheduled'

interface Entry {
  id: string
  type: EntryType
  date: string
  title: string
  time?: string
  categoryId?: string | null
  detail?: string
  eventId?: string
}

const TYPE_INFO: Record<EntryType, { label: string; color: string; icon: typeof Clock }> = {
  completion: { label: 'Completed quest', color: 'var(--rs-success)', icon: CheckCircle2 },
  focus: { label: 'Focus session', color: 'var(--rs-accent)', icon: Hourglass },
  deadline: { label: 'Deadline', color: 'var(--rs-warning)', icon: Flag },
  milestone: { label: 'Milestone', color: 'var(--rs-highlight)', icon: MilestoneIcon },
  achievement: { label: 'Achievement', color: 'var(--rs-highlight)', icon: Award },
  event: { label: 'Event', color: 'var(--rs-accent2)', icon: CalendarPlus },
  level: { label: 'Progression', color: 'var(--rs-accent)', icon: TrendingUp },
  scheduled: { label: 'Scheduled quest', color: 'var(--rs-muted)', icon: Clock },
}

const FILTERABLE: EntryType[] = ['completion', 'focus', 'deadline', 'milestone', 'achievement', 'event', 'level', 'scheduled']

export default function CalendarView() {
  const today = useToday()
  const weekStart = useApp((s) => s.settings.general.weekStart)
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const categoryMap = useCategoryMap()
  const [mode, setMode] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState(today)
  const [types, setTypes] = useState<Set<EntryType>>(new Set(FILTERABLE))
  const [category, setCategory] = useState('')
  const [eventOpen, setEventOpen] = useState(false)

  const range = useMemo(() => {
    if (mode === 'day') return { start: cursor, end: cursor }
    if (mode === 'week') {
      const s = weekStartKey(cursor, weekStart)
      return { start: s, end: addDays(s, 6) }
    }
    const s = monthStartKey(cursor)
    return { start: s, end: addDays(s, daysInMonth(s) - 1) }
  }, [mode, cursor, weekStart])

  const data = useLiveQuery(async () => {
    const db = getDb()
    const { start, end } = range
    const [completions, focus, quests, milestones, goals, achievements, events, activity, ledger, notes] = await Promise.all([
      db.completions.where('dateKey').between(start, end, true, true).toArray(),
      db.focusSessions.where('dateKey').between(start, end, true, true).toArray(),
      db.quests.toArray(),
      db.milestones.toArray(),
      db.goals.toArray(),
      db.achievements.toArray(),
      db.events.where('date').between(start, end, true, true).toArray(),
      db.activity.where('dateKey').between(start, end, true, true).toArray(),
      db.ledger.where('dateKey').between(start, end, true, true).toArray(),
      db.notes.where('dateKey').between(start, end, true, true).toArray(),
    ])
    return { completions, focus, quests, milestones, goals, achievements, events, activity, ledger, notes }
  }, [range.start, range.end])

  const entries = useMemo<Entry[]>(() => {
    if (!data) return []
    const out: Entry[] = []
    const inRange = (d: string | null) => !!d && d >= range.start && d <= range.end
    for (const c of data.completions) out.push({ id: c.id, type: 'completion', date: c.dateKey, title: c.title, time: c.completedAt, categoryId: c.categoryId, detail: `+${c.xpAwarded} XP` })
    for (const f of data.focus)
      if (f.phase === 'focus') out.push({ id: f.id, type: 'focus', date: f.dateKey, title: `${formatMinutes(f.actualSeconds / 60)} ${f.mode} focus${f.status === 'canceled' ? ' (cancelled)' : ''}`, time: f.startedAt, detail: f.xpAwarded ? `+${f.xpAwarded} XP` : undefined })
    for (const q of data.quests) if (q.status === 'active' && inRange(q.dueDate)) out.push({ id: `due-${q.id}`, type: 'deadline', date: q.dueDate!, title: q.title, categoryId: q.categoryId })
    for (const g of data.goals) if ((g.status === 'active' || g.status === 'paused') && inRange(g.targetDate)) out.push({ id: `goal-${g.id}`, type: 'deadline', date: g.targetDate!, title: `Goal target: ${g.name}`, categoryId: g.categoryId })
    for (const m of data.milestones) {
      if (!m.done && inRange(m.dueDate)) out.push({ id: `ms-${m.id}`, type: 'milestone', date: m.dueDate!, title: `Milestone due: ${m.title}` })
    }
    for (const a of data.activity) {
      if (a.type === 'milestone-completed' || a.type === 'goal-completed') out.push({ id: a.id, type: 'milestone', date: a.dateKey, title: a.type === 'goal-completed' ? `Goal completed: ${a.title}` : `Milestone reached: ${a.title}`, time: a.createdAt })
      if (a.type === 'level-up' || a.type === 'rank-up' || a.type === 'skill-unlocked') out.push({ id: a.id, type: 'level', date: a.dateKey, title: a.title, time: a.createdAt })
    }
    for (const a of data.achievements) {
      const d = toDateKey(new Date(a.unlockedAt))
      if (inRange(d)) out.push({ id: `ach-${a.id}`, type: 'achievement', date: d, title: ACHIEVEMENTS.find((x) => x.id === a.id)?.name ?? a.id, time: a.unlockedAt })
    }
    for (const e of data.events) out.push({ id: e.id, type: 'event', date: e.date, title: e.title, categoryId: e.categoryId, detail: e.time ?? undefined, eventId: e.id })
    // Scheduled occurrences are shown for today and future days only (never invented for the past).
    if (mode !== 'month') {
      for (const d of dateRange(range.start, range.end)) {
        if (d < today) continue
        for (const q of data.quests) {
          if (q.status !== 'active' || q.recurrence.kind === 'none' || q.recurrence.kind === 'weekly') continue
          const key = occurrenceKeyFor(q, d, weekStart)
          if (key && !data.completions.some((c) => c.id === `${q.id}::${key}`)) out.push({ id: `sch-${q.id}-${d}`, type: 'scheduled', date: d, title: q.title, categoryId: q.categoryId })
        }
      }
    }
    return out.filter((e) => types.has(e.type) && (!category || e.categoryId === category)).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  }, [data, range, types, category, mode, today, weekStart])

  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const e of entries) map.set(e.date, [...(map.get(e.date) ?? []), e])
    return map
  }, [entries])

  const summary = useMemo(() => {
    if (!data) return null
    const focusMin = data.focus.filter((f) => f.status === 'completed' && f.phase === 'focus').reduce((n, f) => n + Math.floor(f.actualSeconds / 60), 0)
    return { quests: data.completions.length, focusMin, xp: data.ledger.reduce((n, e) => n + e.amount, 0), events: data.activity.filter((a) => a.type === 'achievement').length }
  }, [data])

  const step = (dir: -1 | 1) => setCursor((c) => (mode === 'day' ? addDays(c, dir) : mode === 'week' ? addDays(c, dir * 7) : addMonths(c, dir)))
  const title =
    mode === 'month'
      ? parseDateKey(cursor).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : mode === 'week'
        ? `${formatDateKey(range.start, dateFormat)} – ${formatDateKey(range.end, dateFormat)}`
        : formatDateKey(cursor, dateFormat, { weekday: true })

  return (
    <div>
      <SectionTitle
        eyebrow="Calendar & history"
        title="Calendar"
        description="Completed quests, focus sessions, deadlines, milestones and achievements — from your stored records only."
        actions={
          <Button variant="primary" icon={<CalendarPlus className="size-4" />} onClick={() => setEventOpen(true)}>
            Add event
          </Button>
        }
      />
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <IconButton label="Previous" onClick={() => step(-1)}>
            <ChevronLeft className="size-5" />
          </IconButton>
          <IconButton label="Next" onClick={() => step(1)}>
            <ChevronRight className="size-5" />
          </IconButton>
          <Button size="sm" onClick={() => setCursor(today)}>
            Today
          </Button>
          <h2 className="ml-2 font-display text-base tracking-wide" aria-live="polite">
            {title}
          </h2>
          <span className="flex-1" />
          <Segmented label="Calendar view" value={mode} onChange={setMode} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Show entry types">
          {FILTERABLE.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={types.has(t)}
              onClick={() => setTypes((s) => (s.has(t) ? new Set([...s].filter((x) => x !== t)) : new Set([...s, t])))}
              className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs', types.has(t) ? 'border-line bg-surface2 text-fg' : 'border-line/50 text-muted line-through')}
            >
              <span className="size-2 rounded-full" style={{ background: TYPE_INFO[t].color }} />
              {TYPE_INFO[t].label}
            </button>
          ))}
          <CategoryFilter value={category} onChange={setCategory} />
        </div>

        {summary && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={`Quests · ${mode}`} value={summary.quests} />
            <Stat label="Focus" value={formatMinutes(summary.focusMin)} />
            <Stat label="XP earned" value={formatNumber(summary.xp)} />
            <Stat label="Achievements" value={summary.events} />
          </div>
        )}

        <div className="mt-4">
          {!data ? (
            <LoadingBlock rows={4} label="Loading calendar" />
          ) : mode === 'month' ? (
            <MonthGrid start={range.start} weekStart={weekStart} today={today} byDay={byDay} onPick={(d) => (setCursor(d), setMode('day'))} />
          ) : mode === 'week' ? (
            <div className="grid gap-2 md:grid-cols-7">
              {dateRange(range.start, range.end).map((d) => (
                <div key={d} className={cn('min-h-36 rounded-xl border p-2', d === today ? 'border-accent/60 bg-accent/5' : 'border-line/60')}>
                  <button type="button" className="label-caps mb-2 text-muted hover:text-fg" onClick={() => (setCursor(d), setMode('day'))}>
                    {WEEKDAY_SHORT[parseDateKey(d).getDay()]} {parseDateKey(d).getDate()}
                  </button>
                  <ul className="space-y-1">
                    {(byDay.get(d) ?? []).map((e) => (
                      <li key={e.id} className="truncate rounded-md px-1.5 py-0.5 text-[11px]" style={{ background: `color-mix(in srgb, ${TYPE_INFO[e.type].color} 15%, transparent)` }} title={e.title}>
                        {e.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <DayList entries={byDay.get(cursor) ?? []} note={data.notes.find((n) => n.dateKey === cursor)?.text} categoryMap={categoryMap} />
          )}
        </div>
      </Panel>
      <EventDialog open={eventOpen} date={mode === 'day' ? cursor : today} onClose={() => setEventOpen(false)} />
    </div>
  )
}

function CategoryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const categories = useCategories(true)
  return (
    <Select aria-label="Filter by category" className="ml-auto w-auto py-1 text-xs" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All categories</option>
      {categories?.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </Select>
  )
}

function MonthGrid({ start, weekStart, today, byDay, onPick }: { start: string; weekStart: 0 | 1; today: string; byDay: Map<string, Entry[]>; onPick: (d: string) => void }) {
  const gridStart = weekStartKey(start, weekStart)
  const month = start.slice(0, 7)
  const days = dateRange(gridStart, addDays(gridStart, 41))
  const headers = Array.from({ length: 7 }, (_, i) => WEEKDAY_SHORT[(i + weekStart) % 7])
  return (
    <div role="grid" aria-label="Month">
      <div role="row" className="grid grid-cols-7 gap-1">
        {headers.map((h) => (
          <div key={h} role="columnheader" className="label-caps pb-1 text-center text-muted">
            {h}
          </div>
        ))}
      </div>
      {Array.from({ length: 6 }, (_, w) => (
        <div role="row" key={w} className="grid grid-cols-7 gap-1">
          {days.slice(w * 7, w * 7 + 7).map((d) => {
            const list = byDay.get(d) ?? []
            const inMonth = d.startsWith(month)
            const counts = new Map<EntryType, number>()
            for (const e of list) counts.set(e.type, (counts.get(e.type) ?? 0) + 1)
            return (
              <button
                key={d}
                role="gridcell"
                type="button"
                onClick={() => onPick(d)}
                aria-label={`${formatDateKey(d)}: ${list.length} entries`}
                className={cn('flex min-h-16 flex-col items-start rounded-lg border p-1.5 text-left transition-colors sm:min-h-20', d === today ? 'border-accent/70 bg-accent/10' : 'border-line/40 hover:border-accent/40', !inMonth && 'opacity-40')}
              >
                <span className="num text-xs">{parseDateKey(d).getDate()}</span>
                <span className="mt-auto flex flex-wrap gap-1">
                  {[...counts.entries()].map(([t, n]) => (
                    <span key={t} className="num inline-flex items-center gap-0.5 rounded px-1 text-[10px]" style={{ background: `color-mix(in srgb, ${TYPE_INFO[t].color} 22%, transparent)` }} title={`${n} × ${TYPE_INFO[t].label}`}>
                      {n}
                    </span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function DayList({ entries, note, categoryMap }: { entries: Entry[]; note?: string; categoryMap: Map<string, { name: string; color: string }> }) {
  return (
    <div className="space-y-4">
      {entries.length === 0 ? (
        <EmptyState icon={<Sparkles className="size-6" />} title="Nothing recorded for this day" body="No records are invented for empty days." />
      ) : (
        <ol className="relative space-y-2 border-l border-line pl-4">
          {entries.map((e) => {
            const I = TYPE_INFO[e.type].icon
            return (
              <li key={e.id} className="relative flex items-center gap-3 rounded-lg bg-surface/40 px-3 py-2 text-sm">
                <span className="absolute top-1/2 -left-[21px] size-2.5 -translate-y-1/2 rounded-full" style={{ background: TYPE_INFO[e.type].color }} />
                <I className="size-4 shrink-0" style={{ color: TYPE_INFO[e.type].color }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{e.title}</span>
                  <span className="text-xs text-muted">
                    {TYPE_INFO[e.type].label}
                    {e.categoryId && categoryMap.get(e.categoryId) ? ` · ${categoryMap.get(e.categoryId)!.name}` : ''}
                    {e.time ? ` · ${new Date(e.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : ''}
                    {e.type === 'event' && e.detail ? ` · ${e.detail}` : ''}
                  </span>
                </span>
                {e.type !== 'event' && e.detail && <span className="num text-xs text-highlight">{e.detail}</span>}
                {e.eventId && (
                  <IconButton size="sm" label={`Delete event ${e.title}`} onClick={() => void getDb().events.delete(e.eventId!)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                )}
              </li>
            )
          })}
        </ol>
      )}
      {note && (
        <div className="rounded-xl border border-line/60 p-3">
          <p className="label-caps mb-1 text-muted">Reflection</p>
          <p className="whitespace-pre-wrap text-sm">{note}</p>
        </div>
      )}
    </div>
  )
}

function EventDialog({ open, date, onClose }: { open: boolean; date: string; onClose: () => void }) {
  const categories = useCategories()
  const [title, setTitle] = useState('')
  const [day, setDay] = useState(date)
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [lastDate, setLastDate] = useState(date)
  if (date !== lastDate) {
    setLastDate(date)
    setDay(date)
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await getDb().events.add({ id: newId('ev'), title: title.trim().slice(0, 140), date: day, time: time || null, notes, categoryId: categoryId || null, createdAt: new Date().toISOString() })
    setTitle('')
    setNotes('')
    setTime('')
    onClose()
  }
  return (
    <Dialog open={open} onClose={onClose} title="Add calendar event" size="sm">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title">{(id) => <TextInput id={id} value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} required data-autofocus />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">{(id) => <TextInput id={id} type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} />}</Field>
          <Field label="Time (optional)">{(id) => <TextInput id={id} type="time" value={time} onChange={(e) => setTime(e.target.value)} />}</Field>
        </div>
        <Field label="Category">
          {(id) => (
            <Select id={id} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">None</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Notes">{(id) => <TextArea id={id} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />}</Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!title.trim()}>
            Add event
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
