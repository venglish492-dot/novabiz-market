import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Lightbulb, ListTodo, Plus, Scissors, Sparkles } from 'lucide-react'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { useToday } from '@/hooks/useToday'
import { useCategories, useCategoryMap, useQuests, useTodayQuests } from '@/hooks/useData'
import { useMotion } from '@/hooks/useMotion'
import { buildDailyPlan } from '@/planner/planner'
import { splitQuest } from '@/quests/service'
import { getDb } from '@/db/database'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { EmptyState, LoadingBlock, SectionTitle } from '@/components/ui/Misc'
import { ProgressBar } from '@/components/ui/Progress'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { QuestCard } from '@/components/game/QuestCard'
import { formatDateKey } from '@/lib/dates'
import { formatMinutes } from '@/lib/format'
import { newId } from '@/lib/id'
import { cn } from '@/lib/cn'
import type { Quest } from '@/domain/schemas'

export default function QuestsView() {
  const today = useToday()
  const todayQuests = useTodayQuests(today)
  const allQuests = useQuests()
  const categories = useCategories()
  const categoryMap = useCategoryMap()
  const general = useApp((s) => s.settings.general)
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const openEditor = useUi((s) => s.openEditor)
  const pushToast = useUi((s) => s.pushToast)
  const m = useMotion()
  const [filter, setFilter] = useState<string | null>(null)
  const [split, setSplit] = useState<{ quest: Quest; parts: number } | null>(null)

  const plan = useMemo(
    () =>
      todayQuests
        ? buildDailyPlan(
            todayQuests.map((t) => ({ quest: t.quest, occurrenceKey: t.occurrenceKey, done: !!t.completion })),
            today,
            general.dailyCapacityMinutes,
            general.dailyQuestLimit,
            allQuests ?? [],
          )
        : null,
    [todayQuests, today, general.dailyCapacityMinutes, general.dailyQuestLimit, allQuests],
  )

  if (!todayQuests || !plan) return <LoadingBlock rows={5} label="Loading quests" />

  const completionOf = new Map(todayQuests.map((t) => [`${t.quest.id}::${t.occurrenceKey}`, t.completion]))
  const filtered = plan.ordered.filter((o) => !filter || o.quest.categoryId === filter)
  const open = filtered.filter((o) => !o.done)
  const done = filtered.filter((o) => o.done)
  const usedCategories = (categories ?? []).filter((c) => todayQuests.some((t) => t.quest.categoryId === c.id))

  return (
    <div>
      <SectionTitle
        eyebrow={formatDateKey(today, dateFormat, { weekday: true })}
        title="Daily Quests"
        description="Today's one-time and recurring quests. Completing one occurrence of a recurring quest never completes future ones."
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => openEditor(null)}>
            New quest
          </Button>
        }
      />

      <div className="grid gap-gap xl:grid-cols-[1fr_380px]">
        <div className="space-y-gap">
          <Panel title="Today's progress" icon={<CheckCircle2 className="size-4" />}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-48 flex-1">
                <ProgressBar value={plan.totalCount ? plan.completedCount / plan.totalCount : 0} label="Quests completed today" height="h-3" />
              </div>
              <p className="num text-sm">
                {plan.completedCount} / {plan.totalCount} complete · {formatMinutes(plan.remainingMinutes)} left
              </p>
            </div>
            {usedCategories.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
                <FilterChip on={!filter} onClick={() => setFilter(null)}>
                  All
                </FilterChip>
                {usedCategories.map((c) => (
                  <FilterChip key={c.id} on={filter === c.id} onClick={() => setFilter(c.id)} color={c.color}>
                    {c.name}
                  </FilterChip>
                ))}
              </div>
            )}
          </Panel>

          <Panel title={`Open (${open.length})`} icon={<ListTodo className="size-4" />}>
            {todayQuests.length === 0 ? (
              <EmptyState
                icon={<ListTodo className="size-6" />}
                title="Nothing planned for today"
                body="Create a one-time quest, or a recurring quest that appears automatically on the right days."
                action={
                  <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => openEditor(null)}>
                    Create a quest
                  </Button>
                }
              />
            ) : open.length === 0 ? (
              <EmptyState icon={<Sparkles className="size-6" />} title="All clear" body="Every quest in view is complete. Well done — rest counts too." />
            ) : (
              <ol className="space-y-2">
                <AnimatePresence initial={false}>
                  {open.map((o, i) => (
                    <motion.li key={`${o.quest.id}-${o.occurrenceKey}`} layout={m.distance ? 'position' : false} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 * m.distance, transition: { duration: 0.2 } }} className="flex items-center gap-2">
                      <span className="num w-5 shrink-0 text-right text-xs text-muted" aria-label={`Suggested position ${i + 1}`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <QuestCard quest={o.quest} occurrenceKey={o.occurrenceKey} completion={completionOf.get(`${o.quest.id}::${o.occurrenceKey}`) ?? null} category={categoryMap.get(o.quest.categoryId)} today={today} progressLabel={o.reasons[0]} />
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
            )}
          </Panel>

          {done.length > 0 && (
            <Panel title={`Completed today (${done.length})`} icon={<CheckCircle2 className="size-4" />}>
              <ul className="space-y-2">
                {done.map((o) => (
                  <li key={`${o.quest.id}-${o.occurrenceKey}`}>
                    <QuestCard quest={o.quest} occurrenceKey={o.occurrenceKey} completion={completionOf.get(`${o.quest.id}::${o.occurrenceKey}`) ?? null} category={categoryMap.get(o.quest.categoryId)} today={today} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="space-y-gap">
          <Panel title="Local planning assistant" icon={<Lightbulb className="size-4" />} eyebrow="Rule-based · not AI">
            <ul className="space-y-1.5 text-sm">
              {plan.summary.map((s) => (
                <li key={s} className={cn(s.includes('capacity') || s.includes('more open') ? 'text-warning' : 'text-fg/90')}>
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Suggested order puts past-due and due-today quests first, then high priority, recurring routines and quick wins. Daily capacity: {formatMinutes(general.dailyCapacityMinutes)} (change it in Settings).
            </p>
            {plan.splitSuggestions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="label-caps text-muted">Large quests</p>
                {plan.splitSuggestions.map((s) => (
                  <div key={s.quest.id} className="flex items-center gap-2 rounded-lg border border-line/70 p-2 text-sm">
                    <span className="flex-1 truncate">
                      {s.quest.title} <span className="text-muted">({formatMinutes(s.quest.estimatedMinutes)})</span>
                    </span>
                    <Button size="sm" variant="subtle" icon={<Scissors className="size-3.5" />} onClick={() => setSplit(s)}>
                      Split in {s.parts}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {plan.dueSoon.length > 0 && (
              <div className="mt-4">
                <p className="label-caps mb-1.5 text-muted">Deadlines in the next 7 days</p>
                <ul className="space-y-1 text-sm">
                  {plan.dueSoon.map((q) => (
                    <li key={q.id} className="flex justify-between gap-2">
                      <span className="truncate">{q.title}</span>
                      <span className="num shrink-0 text-xs text-muted">{formatDateKey(q.dueDate!, dateFormat)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
          <ReflectionPanel today={today} />
        </div>
      </div>

      <ConfirmDialog
        open={!!split}
        title="Split this quest?"
        confirmLabel={`Create ${split?.parts ?? 0} smaller quests`}
        body={
          <p>
            “{split?.quest.title}” will be archived and replaced with {split?.parts} one-time quests of about {split ? formatMinutes(split.quest.estimatedMinutes / split.parts) : ''} each. Nothing already earned changes.
          </p>
        }
        onClose={() => setSplit(null)}
        onConfirm={async () => {
          if (!split) return
          const parts = await splitQuest(split.quest.id, split.parts)
          setSplit(null)
          pushToast({ kind: 'success', title: `Split into ${parts.length} quests` })
        }}
      />
    </div>
  )
}

function FilterChip({ on, onClick, color, children }: { on: boolean; onClick: () => void; color?: string; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn('rounded-full border px-3 py-1 text-xs', on ? 'border-accent bg-accent/15 text-fg' : 'border-line text-muted hover:text-fg')}>
      {color && <span className="mr-1.5 inline-block size-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}

const MOODS = ['Drained', 'Low', 'Okay', 'Good', 'Great']

/** Daily reflection note, saved locally per day. */
function ReflectionPanel({ today }: { today: string }) {
  const note = useLiveQuery(() => getDb().notes.where('dateKey').equals(today).first(), [today])
  const [text, setText] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const loaded = note !== undefined

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the editor when the stored note for this day loads
    setText(note?.text ?? '')
    setMood(note?.mood ?? null)
  }, [note?.id, today]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    const db = getDb()
    const now = new Date().toISOString()
    const existing = await db.notes.where('dateKey').equals(today).first()
    if (existing) await db.notes.update(existing.id, { text, mood, updatedAt: now })
    else await db.notes.add({ id: newId('note'), dateKey: today, text, mood, createdAt: now, updatedAt: now })
    setSavedAt(now)
  }

  return (
    <Panel title="Daily reflection" icon={<Sparkles className="size-4" />}>
      <div className="mb-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="How did today feel?">
        {MOODS.map((label, i) => (
          <button key={label} type="button" role="radio" aria-checked={mood === i + 1} onClick={() => setMood(mood === i + 1 ? null : i + 1)} className={cn('rounded-full border px-2.5 py-1 text-xs', mood === i + 1 ? 'border-accent bg-accent/15' : 'border-line text-muted')}>
            {label}
          </button>
        ))}
      </div>
      <label htmlFor="reflection" className="sr-only">
        Reflection for today
      </label>
      <textarea id="reflection" className="input min-h-28" placeholder="What went well? What will you try tomorrow?" value={text} disabled={!loaded} maxLength={10000} onChange={(e) => setText(e.target.value)} />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">{savedAt ? 'Saved locally.' : 'Stored only on this device.'}</span>
        <Button size="sm" variant="subtle" onClick={() => void save()}>
          Save reflection
        </Button>
      </div>
    </Panel>
  )
}
