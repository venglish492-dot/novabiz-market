import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Archive, CheckCircle2, Flag, Pause, Pencil, Play, Plus, RotateCcw, Target, Trash2 } from 'lucide-react'
import { getDb } from '@/db/database'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { useCategories, useCategoryMap } from '@/hooks/useData'
import { addMilestone, createGoal, deleteGoal, deleteMilestone, emptyGoalDraft, goalProgress, setGoalStatus, updateGoal, type GoalDraft } from '@/goals/service'
import { completeGoalAction, milestoneAction } from '@/app/actions'
import { reopenGoal } from '@/game/engine'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Select, TextArea, TextInput } from '@/components/ui/Field'
import { Tabs } from '@/components/ui/Tabs'
import { Badge, EmptyState, LoadingBlock, SectionTitle } from '@/components/ui/Misc'
import { ProgressBar } from '@/components/ui/Progress'
import { formatDateKey } from '@/lib/dates'
import type { Goal, Milestone, Quest } from '@/domain/schemas'
import { useToday } from '@/hooks/useToday'

type Filter = 'active' | 'paused' | 'completed' | 'archived'

export default function GoalsView() {
  const [filter, setFilter] = useState<Filter>('active')
  const [editing, setEditing] = useState<Goal | 'new' | null>(null)
  const data = useLiveQuery(async () => {
    const db = getDb()
    const [goals, milestones, quests] = await Promise.all([db.goals.toArray(), db.milestones.toArray(), db.quests.filter((q) => q.goalId !== null).toArray()])
    return { goals, milestones, quests }
  }, [])
  if (!data) return <LoadingBlock rows={4} label="Loading goals" />
  const counts = (s: Filter) => data.goals.filter((g) => g.status === s).length
  const list = data.goals.filter((g) => g.status === filter).sort((a, b) => (a.targetDate ?? '9999').localeCompare(b.targetDate ?? '9999'))

  return (
    <div>
      <SectionTitle
        eyebrow="Long-term"
        title="Goals"
        description="Break ambitions into milestones and linked quests. Progress only reflects work you have actually recorded — deadlines never complete a goal on their own."
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
            New goal
          </Button>
        }
      />
      <Tabs
        label="Goal status"
        value={filter}
        onChange={setFilter}
        className="mb-gap w-fit"
        items={(['active', 'paused', 'completed', 'archived'] as Filter[]).map((f) => ({ id: f, label: f[0].toUpperCase() + f.slice(1), badge: <span className="num text-xs text-muted">{counts(f)}</span> }))}
      />
      {list.length === 0 ? (
        <EmptyState
          icon={<Target className="size-6" />}
          title={filter === 'active' ? 'No active goals' : `No ${filter} goals`}
          body={filter === 'active' ? 'Examples: finish a course, prepare for an exam, ship a programming project, build a reading habit.' : undefined}
          action={
            filter === 'active' && (
              <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
                Create a goal
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-gap lg:grid-cols-2">
          {list.map((g) => (
            <GoalCard key={g.id} goal={g} milestones={data.milestones.filter((m) => m.goalId === g.id).sort((a, b) => a.order - b.order)} quests={data.quests.filter((q) => q.goalId === g.id)} onEdit={() => setEditing(g)} />
          ))}
        </div>
      )}
      <GoalEditor goal={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function GoalCard({ goal, milestones, quests, onEdit }: { goal: Goal; milestones: Milestone[]; quests: Quest[]; onEdit: () => void }) {
  const categories = useCategoryMap()
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const openEditor = useUi((s) => s.openEditor)
  const pushToast = useUi((s) => s.pushToast)
  const today = useToday()
  const [newMilestone, setNewMilestone] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [measure, setMeasure] = useState('')
  const p = goalProgress(goal, milestones, quests)
  const cat = goal.categoryId ? categories.get(goal.categoryId) : undefined
  const done = goal.status === 'completed'
  const overdue = !done && goal.targetDate && goal.targetDate < today

  return (
    <Panel
      title={goal.name}
      icon={<Flag className="size-4" style={{ color: cat?.color }} />}
      actions={
        <Button size="sm" variant="ghost" aria-label={`Edit ${goal.name}`} onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {cat && <Badge color={cat.color}>{cat.name}</Badge>}
        <Badge color={goal.priority === 'high' ? '#f59e0b' : undefined}>{goal.priority} priority</Badge>
        {goal.targetDate && <Badge color={overdue ? '#fbbf24' : undefined}>Target {formatDateKey(goal.targetDate, dateFormat)}</Badge>}
        {overdue && <Badge color="#fbbf24">Past target date — still open</Badge>}
      </div>
      {goal.description && <p className="mb-3 text-sm text-muted">{goal.description}</p>}
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted">{p.label}</span>
        <span className="num">{p.percent}%</span>
      </div>
      <ProgressBar value={p.percent / 100} label={`${goal.name} progress`} color={done ? 'var(--rs-success)' : undefined} />

      {goal.progressMode === 'measurable' && goal.measurable && !done && (
        <div className="mt-3 flex gap-2">
          <TextInput type="number" aria-label="Update current amount" placeholder={`Current (${goal.measurable.unit})`} value={measure} onChange={(e) => setMeasure(e.target.value)} />
          <Button
            variant="subtle"
            onClick={async () => {
              const n = Number(measure)
              if (!Number.isFinite(n) || n < 0) return
              await updateGoal(goal.id, { measurable: { ...goal.measurable!, current: n } })
              setMeasure('')
            }}
          >
            Update
          </Button>
        </div>
      )}

      <div className="mt-4">
        <p className="label-caps mb-2 text-muted">Milestones</p>
        {milestones.length === 0 && <p className="text-sm text-muted">No milestones yet.</p>}
        <ul className="space-y-1">
          {milestones.map((m) => (
            <li key={m.id} className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-accent/5">
              <input type="checkbox" className="size-4 accent-[var(--rs-accent)]" checked={m.done} disabled={done} aria-label={`Milestone ${m.title}`} onChange={() => void milestoneAction(m.id, !m.done)} />
              <span className={m.done ? 'flex-1 text-sm text-muted line-through' : 'flex-1 text-sm'}>{m.title}</span>
              {quests.some((q) => q.milestoneId === m.id) && <span className="text-xs text-muted">{quests.filter((q) => q.milestoneId === m.id && q.status === 'completed').length}/{quests.filter((q) => q.milestoneId === m.id).length} quests</span>}
              <button type="button" aria-label={`Delete milestone ${m.title}`} className="rounded p-1 text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-danger" onClick={() => void deleteMilestone(m.id)}>
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        {!done && (
          <form
            className="mt-2 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!newMilestone.trim()) return
              await addMilestone(goal.id, newMilestone.slice(0, 140))
              setNewMilestone('')
            }}
          >
            <TextInput aria-label="New milestone" placeholder="Add a milestone…" value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} />
            <Button type="submit" variant="subtle" aria-label="Add milestone">
              <Plus className="size-4" />
            </Button>
          </form>
        )}
      </div>

      {quests.length > 0 && (
        <div className="mt-4">
          <p className="label-caps mb-1 text-muted">Linked quests ({quests.length})</p>
          <ul className="space-y-0.5 text-sm">
            {quests.slice(0, 6).map((q) => (
              <li key={q.id} className="flex justify-between gap-2">
                <span className={q.status === 'completed' ? 'truncate text-muted line-through' : 'truncate'}>{q.title}</span>
                <span className="text-xs text-muted">{q.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {goal.status === 'active' && (
          <>
            <Button size="sm" variant="primary" icon={<CheckCircle2 className="size-4" />} onClick={() => void completeGoalAction(goal.id, goal.name)}>
              Mark complete
            </Button>
            <Button size="sm" icon={<Plus className="size-4" />} onClick={() => openEditor(null, { goalId: goal.id, categoryId: goal.categoryId ?? 'general' })}>
              Linked quest
            </Button>
            <Button size="sm" variant="ghost" icon={<Pause className="size-4" />} onClick={() => void setGoalStatus(goal.id, 'paused')}>
              Pause
            </Button>
          </>
        )}
        {goal.status === 'paused' && (
          <Button size="sm" icon={<Play className="size-4" />} onClick={() => void setGoalStatus(goal.id, 'active')}>
            Resume
          </Button>
        )}
        {goal.status === 'completed' && (
          <Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" />} onClick={() => void reopenGoal(goal.id).then(() => pushToast({ kind: 'info', title: 'Goal reopened', body: 'The completion bonus was reversed in the XP ledger.' }))}>
            Reopen
          </Button>
        )}
        {goal.status !== 'archived' ? (
          <Button size="sm" variant="ghost" icon={<Archive className="size-4" />} onClick={() => void setGoalStatus(goal.id, 'archived')}>
            Archive
          </Button>
        ) : (
          <Button size="sm" icon={<RotateCcw className="size-4" />} onClick={() => void setGoalStatus(goal.id, 'active')}>
            Restore
          </Button>
        )}
        <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
          Delete
        </Button>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        danger
        title="Delete goal?"
        confirmLabel="Delete goal"
        body={<p>“{goal.name}” and its milestones will be removed. Linked quests are kept (only unlinked). XP already earned stays in your records.</p>}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteGoal(goal.id)
          setConfirmDelete(false)
        }}
      />
    </Panel>
  )
}

function GoalEditor({ goal, onClose }: { goal: Goal | 'new' | null; onClose: () => void }) {
  return (
    <Dialog open={!!goal} onClose={onClose} title={goal === 'new' ? 'New goal' : 'Edit goal'} size="md" dismissable={false}>
      {goal && <GoalForm key={goal === 'new' ? 'new' : goal.id} goal={goal === 'new' ? null : goal} onClose={onClose} />}
    </Dialog>
  )
}

function GoalForm({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const categories = useCategories()
  const pushToast = useUi((s) => s.pushToast)
  const [draft, setDraft] = useState<GoalDraft>(() => (goal ? { ...goal } : emptyGoalDraft()))
  const [milestones, setMilestones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof GoalDraft>(k: K, v: GoalDraft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.name.trim()) return setError('Give the goal a name.')
    if (draft.progressMode === 'measurable' && (!draft.measurable || draft.measurable.target <= 0)) return setError('Enter a measurable target above zero.')
    setBusy(true)
    try {
      const clean = { ...draft, name: draft.name.trim(), measurable: draft.progressMode === 'measurable' ? draft.measurable : null }
      if (goal) await updateGoal(goal.id, clean)
      else await createGoal(clean, milestones.split('\n'))
      pushToast({ kind: 'success', title: goal ? 'Goal updated' : 'Goal created', body: clean.name })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Goal name" error={error} className="sm:col-span-2">
        {(id, d) => <TextInput id={id} aria-describedby={d} value={draft.name} maxLength={120} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Pass the calculus exam" data-autofocus />}
      </Field>
      <Field label="Category">
        {(id) => (
          <Select id={id} value={draft.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)}>
            <option value="">None</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Target date (optional)">{(id) => <TextInput id={id} type="date" value={draft.targetDate ?? ''} onChange={(e) => set('targetDate', e.target.value || null)} />}</Field>
      <Field label="Priority">
        {(id) => (
          <Select id={id} value={draft.priority} onChange={(e) => set('priority', e.target.value as GoalDraft['priority'])}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </Select>
        )}
      </Field>
      <Field label="Measure progress by">
        {(id) => (
          <Select
            id={id}
            value={draft.progressMode}
            onChange={(e) => {
              const mode = e.target.value as GoalDraft['progressMode']
              setDraft((d) => ({ ...d, progressMode: mode, measurable: mode === 'measurable' ? (d.measurable ?? { current: 0, target: 100, unit: '' }) : d.measurable }))
            }}
          >
            <option value="milestones">Completed milestones</option>
            <option value="quests">Completed linked quests</option>
            <option value="measurable">A number I track (e.g. pages, km)</option>
          </Select>
        )}
      </Field>
      {draft.progressMode === 'measurable' && draft.measurable && (
        <div className="grid grid-cols-3 gap-2 sm:col-span-2">
          <Field label="Current">{(id) => <TextInput id={id} type="number" min={0} value={draft.measurable!.current} onChange={(e) => set('measurable', { ...draft.measurable!, current: Math.max(0, Number(e.target.value) || 0) })} />}</Field>
          <Field label="Target">{(id) => <TextInput id={id} type="number" min={1} value={draft.measurable!.target} onChange={(e) => set('measurable', { ...draft.measurable!, target: Math.max(0, Number(e.target.value) || 0) })} />}</Field>
          <Field label="Unit">{(id) => <TextInput id={id} maxLength={20} value={draft.measurable!.unit} onChange={(e) => set('measurable', { ...draft.measurable!, unit: e.target.value })} />}</Field>
        </div>
      )}
      <Field label="Description" className="sm:col-span-2">
        {(id) => <TextArea id={id} maxLength={4000} value={draft.description} onChange={(e) => set('description', e.target.value)} />}
      </Field>
      {!goal && (
        <Field label="Milestones (one per line, optional)" className="sm:col-span-2">
          {(id) => <TextArea id={id} value={milestones} onChange={(e) => setMilestones(e.target.value)} placeholder={'Finish module 1\nPractice exam\nFinal exam'} />}
        </Field>
      )}
      <Field label="Notes" className="sm:col-span-2">
        {(id) => <TextArea id={id} maxLength={4000} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />}
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={busy}>
          {goal ? 'Save goal' : 'Create goal'}
        </Button>
      </div>
    </form>
  )
}
