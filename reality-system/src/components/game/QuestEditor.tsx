import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2 } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Select, TextArea, TextInput } from '@/components/ui/Field'
import { Toggle } from '@/components/ui/Toggle'
import { useUi } from '@/store/ui'
import { useApp } from '@/store/app'
import { getDb } from '@/db/database'
import { useAttributes, useCategories } from '@/hooks/useData'
import { createQuest, emptyDraft, updateQuest, type QuestDraft } from '@/quests/service'
import { QUEST_TYPES, questSchema, type QuestType } from '@/domain/schemas'
import { QUEST_TYPE_INFO, defaultRecurrenceForType, describeRecurrence } from '@/quests/recurrence'
import { questBaseXp } from '@/game/rules'
import { newId } from '@/lib/id'
import { WEEKDAY_SHORT, toDateKey } from '@/lib/dates'
import { cn } from '@/lib/cn'

type Errors = Partial<Record<string, string>>

/** Create / edit quest dialog. Mounted once in the shell; driven by the UI store. */
export function QuestEditor() {
  const editor = useUi((s) => s.editor)
  const close = useUi((s) => s.closeEditor)
  const open = !!editor
  return (
    <Dialog open={open} onClose={close} title={editor?.questId ? 'Edit quest' : 'New quest'} size="lg" dismissable={false}>
      {editor && <QuestForm key={editor.questId ?? 'new'} questId={editor.questId} defaults={editor.defaults} onDone={close} />}
    </Dialog>
  )
}

function QuestForm({ questId, defaults, onDone }: { questId: string | null; defaults?: Partial<QuestDraft>; onDone: () => void }) {
  const rules = useApp((s) => s.rules)
  const pushToast = useUi((s) => s.pushToast)
  const categories = useCategories()
  const attributes = useAttributes(true)
  const goals = useLiveQuery(() => getDb().goals.where('status').anyOf('active', 'paused').toArray(), [])
  const existing = useLiveQuery(async () => (questId ? getDb().quests.get(questId) : undefined), [questId])
  const [draft, setDraft] = useState<QuestDraft>(() => emptyDraft({ startDate: toDateKey(new Date()), ...defaults }))
  const [loaded, setLoaded] = useState(!questId)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [tagText, setTagText] = useState((defaults?.tags ?? []).join(', '))
  const milestones = useLiveQuery(async () => (draft.goalId ? getDb().milestones.where('goalId').equals(draft.goalId).sortBy('order') : []), [draft.goalId])

  useEffect(() => {
    if (questId && existing && !loaded) {
      const { id: _i, createdAt: _c, updatedAt: _u, completedAt: _d, archivedAt: _a, status: _s, ...rest } = existing
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of the form from the stored quest
      setDraft(rest)
      setTagText(rest.tags.join(', '))
      setLoaded(true)
    }
  }, [questId, existing, loaded])

  const set = <K extends keyof QuestDraft>(key: K, value: QuestDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const onType = (type: QuestType) => {
    setDraft((d) => ({
      ...d,
      type,
      recurrence: d.type === type ? d.recurrence : defaultRecurrenceForType(type),
      focusMinutes: type === 'timed' ? (d.focusMinutes ?? 25) : d.focusMinutes,
      target: type === 'measurable' ? (d.target ?? { value: 10, unit: 'pages' }) : d.target,
      checklist: type === 'checklist' && d.checklist.length === 0 ? [{ id: newId('ci'), text: '' }] : d.checklist,
    }))
  }

  const onCategory = (categoryId: string) => {
    const cat = categories?.find((c) => c.id === categoryId)
    setDraft((d) => ({ ...d, categoryId, attributeId: cat?.attributeId ?? d.attributeId }))
  }

  const xpPreview = useMemo(() => questBaseXp(rules, draft), [rules, draft])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const tags = tagText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20)
    const candidate: QuestDraft = {
      ...draft,
      title: draft.title.trim(),
      tags,
      checklist: draft.type === 'checklist' ? draft.checklist.filter((c) => c.text.trim()).map((c) => ({ ...c, text: c.text.trim() })) : [],
      target: draft.type === 'measurable' ? draft.target : null,
      focusMinutes: draft.type === 'timed' ? draft.focusMinutes : null,
      milestoneId: draft.goalId ? draft.milestoneId : null,
    }
    const errs: Errors = {}
    if (!candidate.title) errs.title = 'Give the quest a title.'
    if (candidate.type === 'checklist' && candidate.checklist.length === 0) errs.checklist = 'Add at least one checklist item.'
    if (candidate.type === 'measurable' && (!candidate.target || candidate.target.value <= 0)) errs.target = 'Enter a target above zero.'
    const check = questSchema.safeParse({ ...candidate, id: 'x', status: 'active', createdAt: 'xxxxxxxxxxxx', updatedAt: 'xxxxxxxxxxxx', completedAt: null, archivedAt: null })
    if (!check.success) {
      for (const issue of check.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        errs[key] ??= issue.message
      }
    }
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      if (questId) await updateQuest(questId, candidate)
      else await createQuest(candidate)
      pushToast({ kind: 'success', title: questId ? 'Quest updated' : 'Quest created', body: candidate.title })
      onDone()
    } catch (err) {
      pushToast({ kind: 'error', title: 'Could not save the quest', body: err instanceof Error ? err.message : String(err) })
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <p className="text-sm text-muted">Loading quest…</p>

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Title" error={errors.title} className="sm:col-span-2">
        {(id, d) => <TextInput id={id} aria-describedby={d} aria-invalid={!!errors.title} value={draft.title} maxLength={140} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Solve 15 calculus problems" data-autofocus />}
      </Field>

      <Field label="Quest type" hint={QUEST_TYPE_INFO[draft.type].hint}>
        {(id, d) => (
          <Select id={id} aria-describedby={d} value={draft.type} onChange={(e) => onType(e.target.value as QuestType)}>
            {QUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {QUEST_TYPE_INFO[t].label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Repeats" hint={describeRecurrence(draft.recurrence)}>
        {(id, d) => (
          <Select
            id={id}
            aria-describedby={d}
            value={draft.recurrence.kind}
            onChange={(e) => {
              const kind = e.target.value
              set(
                'recurrence',
                kind === 'weekdays' ? { kind, days: [1, 3, 5] } : kind === 'interval' ? { kind, every: 2 } : ({ kind } as QuestDraft['recurrence']),
              )
            }}
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Every day</option>
            <option value="weekdays">On specific weekdays</option>
            <option value="weekly">Once per week</option>
            <option value="interval">Every N days</option>
          </Select>
        )}
      </Field>

      {draft.recurrence.kind === 'weekdays' && (
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium">Weekdays</legend>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_SHORT.map((label, day) => {
              const r = draft.recurrence as { kind: 'weekdays'; days: number[] }
              const on = r.days.includes(day)
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    const days = on ? r.days.filter((x) => x !== day) : [...r.days, day]
                    if (days.length) set('recurrence', { kind: 'weekdays', days: days.sort() })
                  }}
                  className={cn('h-9 w-12 rounded-lg border text-sm', on ? 'border-accent bg-accent/15 text-fg' : 'border-line text-muted')}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
      {draft.recurrence.kind === 'interval' && (
        <Field label="Repeat every (days)">
          {(id) => (
            <TextInput id={id} type="number" min={2} max={365} value={(draft.recurrence as { every: number }).every} onChange={(e) => set('recurrence', { kind: 'interval', every: Math.max(2, Math.min(365, Number(e.target.value) || 2)) })} />
          )}
        </Field>
      )}
      {draft.recurrence.kind !== 'none' && (
        <Field label="Starts on">{(id) => <TextInput id={id} type="date" value={draft.startDate} onChange={(e) => e.target.value && set('startDate', e.target.value)} />}</Field>
      )}

      <Field label="Category">
        {(id) => (
          <Select id={id} value={draft.categoryId} onChange={(e) => onCategory(e.target.value)}>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Attribute it grows" hint="Quests add their XP to this attribute.">
        {(id, d) => (
          <Select id={id} aria-describedby={d} value={draft.attributeId} onChange={(e) => set('attributeId', e.target.value)}>
            {attributes?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.abbr} — {a.name}
                {a.hidden ? ' (hidden)' : ''}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Difficulty">
        {(id) => (
          <Select id={id} value={draft.difficulty} onChange={(e) => set('difficulty', e.target.value as QuestDraft['difficulty'])}>
            {rules.difficulties.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} ({d.xp} XP)
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Priority">
        {(id) => (
          <Select id={id} value={draft.priority} onChange={(e) => set('priority', e.target.value as QuestDraft['priority'])}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </Select>
        )}
      </Field>

      <Field label="Estimated time (minutes)" error={errors.estimatedMinutes}>
        {(id) => <TextInput id={id} type="number" min={0} max={1440} value={draft.estimatedMinutes} onChange={(e) => set('estimatedMinutes', Math.max(0, Math.min(1440, Math.round(Number(e.target.value) || 0))))} />}
      </Field>
      <Field label="Due date (optional)">
        {(id) => <TextInput id={id} type="date" value={draft.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value || null)} />}
      </Field>

      {draft.type === 'timed' && (
        <Field label="Focus minutes required" hint="Completing a focus session of at least this length completes the quest.">
          {(id, d) => <TextInput id={id} aria-describedby={d} type="number" min={1} max={240} value={draft.focusMinutes ?? 25} onChange={(e) => set('focusMinutes', Math.max(1, Math.min(240, Math.round(Number(e.target.value) || 25))))} />}
        </Field>
      )}

      {draft.type === 'measurable' && (
        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
          <Field label="Target amount" error={errors.target}>
            {(id) => <TextInput id={id} type="number" min={1} value={draft.target?.value ?? 10} onChange={(e) => set('target', { value: Math.max(0, Number(e.target.value) || 0), unit: draft.target?.unit ?? '' })} />}
          </Field>
          <Field label="Unit">{(id) => <TextInput id={id} maxLength={20} value={draft.target?.unit ?? ''} placeholder="pages, reps, km…" onChange={(e) => set('target', { value: draft.target?.value ?? 10, unit: e.target.value })} />}</Field>
        </div>
      )}

      {draft.type === 'checklist' && (
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium">Checklist items</legend>
          <ul className="space-y-2">
            {draft.checklist.map((item, i) => (
              <li key={item.id} className="flex gap-2">
                <TextInput
                  aria-label={`Checklist item ${i + 1}`}
                  value={item.text}
                  maxLength={200}
                  onChange={(e) => set('checklist', draft.checklist.map((c) => (c.id === item.id ? { ...c, text: e.target.value } : c)))}
                />
                <Button variant="ghost" aria-label={`Remove item ${i + 1}`} onClick={() => set('checklist', draft.checklist.filter((c) => c.id !== item.id))}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          {errors.checklist && <p className="mt-1 text-xs text-danger">{errors.checklist}</p>}
          <Button size="sm" variant="subtle" className="mt-2" icon={<Plus className="size-4" />} onClick={() => set('checklist', [...draft.checklist, { id: newId('ci'), text: '' }])} disabled={draft.checklist.length >= 50}>
            Add item
          </Button>
        </fieldset>
      )}

      <Field label="Linked goal (optional)">
        {(id) => (
          <Select id={id} value={draft.goalId ?? ''} onChange={(e) => setDraft((d) => ({ ...d, goalId: e.target.value || null, milestoneId: null }))}>
            <option value="">No goal</option>
            {goals?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Milestone (optional)" hint={draft.goalId ? 'The milestone completes when all its linked one-time quests are done.' : 'Choose a goal first.'}>
        {(id, d) => (
          <Select id={id} aria-describedby={d} value={draft.milestoneId ?? ''} disabled={!draft.goalId} onChange={(e) => set('milestoneId', e.target.value || null)}>
            <option value="">No milestone</option>
            {milestones?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Description" className="sm:col-span-2">
        {(id) => <TextArea id={id} maxLength={4000} value={draft.description} onChange={(e) => set('description', e.target.value)} />}
      </Field>
      <Field label="Completion condition (optional)" hint="How you will know it is done, e.g. “all exercises checked against the answer key”.">
        {(id, d) => <TextInput id={id} aria-describedby={d} maxLength={300} value={draft.completionCondition} onChange={(e) => set('completionCondition', e.target.value)} />}
      </Field>
      <Field label="Tags (comma separated)">{(id) => <TextInput id={id} value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="exam, chapter-3" />}</Field>

      <Field label="Custom XP reward (optional)" hint={`Leave empty to use the difficulty default. Rewards are kept between ${rules.questXpMin} and ${rules.questXpMax} XP. This quest will award ${xpPreview} XP.`}>
        {(id, d) => (
          <TextInput id={id} aria-describedby={d} type="number" min={0} placeholder="Default" value={draft.xpOverride ?? ''} onChange={(e) => set('xpOverride', e.target.value === '' ? null : Math.max(0, Math.round(Number(e.target.value) || 0)))} />
        )}
      </Field>
      <div className="flex items-end">
        <Toggle className="w-full" checked={draft.reminder} onChange={(v) => set('reminder', v)} label="In-app reminder" description="Adds a reminder to your notification center on days this quest is open." />
      </div>

      <Field label="Notes" className="sm:col-span-2">
        {(id) => <TextArea id={id} maxLength={4000} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />}
      </Field>

      {errors.form && <p className="text-sm text-danger sm:col-span-2">{errors.form}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving}>
          {questId ? 'Save changes' : 'Create quest'}
        </Button>
      </div>
    </form>
  )
}

/** Small quick-add dialog for creating a quest without leaving the current screen. */
export function QuickAdd() {
  const open = useUi((s) => s.quickAddOpen)
  const setOpen = useUi((s) => s.setQuickAdd)
  const openEditor = useUi((s) => s.openEditor)
  const pushToast = useUi((s) => s.pushToast)
  const categories = useCategories()
  const rules = useApp((s) => s.rules)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('general')
  const [difficulty, setDifficulty] = useState<QuestDraft['difficulty']>('normal')
  const [daily, setDaily] = useState(false)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setTitle('')
    setDaily(false)
  }
  const draft = (): QuestDraft => {
    const cat = categories?.find((c) => c.id === categoryId)
    return emptyDraft({
      title: title.trim(),
      categoryId,
      attributeId: cat?.attributeId ?? 'disc',
      difficulty,
      type: daily ? 'daily' : 'one-time',
      recurrence: daily ? { kind: 'daily' } : { kind: 'none' },
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    try {
      await createQuest(draft())
      pushToast({ kind: 'success', title: 'Quest added', body: title.trim() })
      reset()
      setOpen(false)
    } catch (err) {
      pushToast({ kind: 'error', title: 'Could not add quest', body: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="Quick add quest" size="sm">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Quest title">{(id) => <TextInput id={id} value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} placeholder="What will you do?" data-autofocus required />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            {(id) => (
              <Select id={id} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Difficulty">
            {(id) => (
              <Select id={id} value={difficulty} onChange={(e) => setDifficulty(e.target.value as QuestDraft['difficulty'])}>
                {rules.difficulties.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label} ({d.xp} XP)
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Toggle checked={daily} onChange={setDaily} label="Repeat daily" />
        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false)
              openEditor(null, draft())
              reset()
            }}
          >
            More options…
          </Button>
          <Button type="submit" variant="primary" loading={busy} disabled={!title.trim()}>
            Add quest
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
