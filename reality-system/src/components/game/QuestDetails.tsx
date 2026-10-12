import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Archive, ArchiveRestore, Check, Copy, Pencil, Timer, Trash2, Undo2 } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge, EmptyState } from '@/components/ui/Misc'
import { ProgressBar } from '@/components/ui/Progress'
import { TextInput } from '@/components/ui/Field'
import { useUi } from '@/store/ui'
import { useApp } from '@/store/app'
import { getDb } from '@/db/database'
import { useAttributeMap, useCategoryMap } from '@/hooks/useData'
import { completeQuestAction, undoCompletionAction } from '@/app/actions'
import { archiveQuests, deleteQuests, duplicateQuest, restoreQuests, saveOccurrenceProgress } from '@/quests/service'
import { completionId, describeRecurrence, occurrenceDate, QUEST_TYPE_INFO } from '@/quests/recurrence'
import { difficultyRule, questBaseXp } from '@/game/rules'
import { formatDateKey, formatDateTime } from '@/lib/dates'
import { formatMinutes } from '@/lib/format'
import { navigate } from '@/app/router'
import { DIFFICULTY_COLORS } from './difficultyColors'

export function QuestDetails() {
  const details = useUi((s) => s.details)
  const close = useUi((s) => s.closeDetails)
  const quest = useLiveQuery(async () => (details ? getDb().quests.get(details.questId) : undefined), [details?.questId])
  return (
    <Dialog open={!!details} onClose={close} title={quest?.title ?? 'Quest'} size="lg">
      {details && quest ? <DetailsBody questId={details.questId} occurrenceKey={details.occurrenceKey} onClose={close} /> : <p className="text-sm text-muted">{details ? 'This quest no longer exists.' : ''}</p>}
    </Dialog>
  )
}

function DetailsBody({ questId, occurrenceKey, onClose }: { questId: string; occurrenceKey: string; onClose: () => void }) {
  const rules = useApp((s) => s.rules)
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const openEditor = useUi((s) => s.openEditor)
  const pushToast = useUi((s) => s.pushToast)
  const setFocusTarget = useUi((s) => s.setFocusTarget)
  const categories = useCategoryMap()
  const attributes = useAttributeMap()
  const data = useLiveQuery(async () => {
    const db = getDb()
    const [quest, completion, progress, history, goal] = await Promise.all([
      db.quests.get(questId),
      db.completions.get(completionId(questId, occurrenceKey)),
      db.progress.get(completionId(questId, occurrenceKey)),
      db.completions.where('questId').equals(questId).reverse().sortBy('completedAt'),
      db.quests.get(questId).then((q) => (q?.goalId ? db.goals.get(q.goalId) : undefined)),
    ])
    return { quest, completion, progress, history, goal }
  }, [questId, occurrenceKey])
  const [busy, setBusy] = useState(false)
  const [optimistic, setOptimistic] = useState<{ base: string | undefined; checked: string[] } | null>(null)
  const [amount, setAmount] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!data?.quest) return null
  const { quest, completion, progress, history, goal } = data
  const cat = categories.get(quest.categoryId)
  const attr = attributes.get(quest.attributeId)
  const done = !!completion
  const archived = quest.status === 'archived'
  // optimistic state keeps the checkbox responsive while the database write completes
  const checked = optimistic && optimistic.base === progress?.updatedAt ? optimistic.checked : (progress?.checked ?? [])
  const measured = progress?.measured ?? 0
  const occDate = occurrenceDate(occurrenceKey)

  const complete = async () => {
    setBusy(true)
    await completeQuestAction(quest, occurrenceKey)
    setBusy(false)
  }

  const toggleItem = async (id: string) => {
    if (done || archived) return
    const next = checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id]
    setOptimistic({ base: progress?.updatedAt, checked: next })
    await saveOccurrenceProgress(quest.id, occurrenceKey, { checked: next })
    if (quest.checklist.length > 0 && quest.checklist.every((c) => next.includes(c.id))) await complete()
  }

  const logAmount = async () => {
    const n = Number(amount)
    if (!Number.isFinite(n) || n === 0) return
    const next = Math.max(0, measured + n)
    await saveOccurrenceProgress(quest.id, occurrenceKey, { measured: next })
    setAmount('')
    if (quest.target && next >= quest.target.value && !done) await complete()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {cat && <Badge color={cat.color}>{cat.name}</Badge>}
        <Badge color={DIFFICULTY_COLORS[quest.difficulty]}>{difficultyRule(rules, quest.difficulty).label}</Badge>
        <Badge>{QUEST_TYPE_INFO[quest.type].label}</Badge>
        <Badge>{describeRecurrence(quest.recurrence)}</Badge>
        {attr && <Badge color={attr.color}>+{attr.abbr}</Badge>}
        {quest.priority === 'high' && <Badge color="#f59e0b">High priority</Badge>}
        {archived && <Badge color="#94a3b8">Archived</Badge>}
        {quest.tags.map((t) => (
          <Badge key={t}>#{t}</Badge>
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="label-caps text-muted">Reward</dt>
          <dd className="num text-highlight">{done ? `${completion.xpAwarded} XP awarded` : `${questBaseXp(rules, quest)} XP`}</dd>
        </div>
        <div>
          <dt className="label-caps text-muted">Estimate</dt>
          <dd>{quest.estimatedMinutes ? formatMinutes(quest.estimatedMinutes) : '—'}</dd>
        </div>
        <div>
          <dt className="label-caps text-muted">Due</dt>
          <dd>{quest.dueDate ? formatDateKey(quest.dueDate, dateFormat) : '—'}</dd>
        </div>
        <div>
          <dt className="label-caps text-muted">Occurrence</dt>
          <dd>{occDate ? (occurrenceKey.startsWith('W') ? `Week of ${formatDateKey(occDate, dateFormat)}` : formatDateKey(occDate, dateFormat)) : 'One time'}</dd>
        </div>
      </dl>

      {quest.description && <p className="whitespace-pre-wrap text-sm text-fg/90">{quest.description}</p>}
      {quest.completionCondition && (
        <p className="rounded-lg border border-line/70 bg-surface/50 p-3 text-sm">
          <span className="label-caps mr-2 text-muted">Done when</span>
          {quest.completionCondition}
        </p>
      )}
      {goal && (
        <p className="text-sm text-muted">
          Part of goal <span className="text-fg">{goal.name}</span>
        </p>
      )}

      {quest.type === 'checklist' && quest.checklist.length > 0 && (
        <section aria-label="Checklist">
          <ProgressBar value={done ? 1 : checked.length / quest.checklist.length} label="Checklist progress" className="mb-3" />
          <ul className="space-y-1.5">
            {quest.checklist.map((item) => {
              const on = done || checked.includes(item.id)
              return (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/5">
                    <input type="checkbox" className="size-4 accent-[var(--rs-accent)]" checked={on} disabled={done || archived} onChange={() => void toggleItem(item.id)} />
                    <span className={on ? 'text-muted line-through' : ''}>{item.text}</span>
                  </label>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 text-xs text-muted">The quest completes automatically when every item is checked.</p>
        </section>
      )}

      {quest.type === 'measurable' && quest.target && (
        <section aria-label="Measured progress" className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="num">
              {done ? quest.target.value : measured} / {quest.target.value} {quest.target.unit}
            </span>
          </div>
          <ProgressBar value={done ? 1 : measured / quest.target.value} label="Measured progress" />
          {!done && !archived && (
            <div className="flex gap-2">
              <TextInput type="number" aria-label={`Amount to add (${quest.target.unit})`} placeholder={`+ ${quest.target.unit}`} value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void logAmount()} />
              <Button variant="subtle" onClick={() => void logAmount()}>
                Log
              </Button>
            </div>
          )}
        </section>
      )}

      {quest.notes && (
        <section>
          <h3 className="label-caps mb-1 text-muted">Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-fg/90">{quest.notes}</p>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {!archived &&
          (done ? (
            <Button variant="secondary" icon={<Undo2 className="size-4" />} onClick={() => void undoCompletionAction(quest, occurrenceKey)}>
              Undo completion
            </Button>
          ) : quest.type === 'timed' ? (
            <Button
              variant="primary"
              icon={<Timer className="size-4" />}
              onClick={() => {
                setFocusTarget({ questId: quest.id, occurrenceKey })
                onClose()
                navigate('focus')
              }}
            >
              Start {quest.focusMinutes} min focus
            </Button>
          ) : (
            <Button variant="primary" icon={<Check className="size-4" />} loading={busy} onClick={() => void complete()}>
              Complete
            </Button>
          ))}
        <Button icon={<Pencil className="size-4" />} onClick={() => openEditor(quest.id)}>
          Edit
        </Button>
        <Button
          icon={<Copy className="size-4" />}
          onClick={async () => {
            const copy = await duplicateQuest(quest.id)
            pushToast({ kind: 'success', title: 'Quest duplicated', body: copy.title })
          }}
        >
          Duplicate
        </Button>
        {archived ? (
          <Button icon={<ArchiveRestore className="size-4" />} onClick={() => void restoreQuests([quest.id]).then(() => pushToast({ kind: 'info', title: 'Quest restored' }))}>
            Restore
          </Button>
        ) : (
          <Button icon={<Archive className="size-4" />} onClick={() => void archiveQuests([quest.id]).then(() => pushToast({ kind: 'info', title: 'Quest archived', body: 'Find it in the Quest Archive.' }))}>
            Archive
          </Button>
        )}
        <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
          Delete
        </Button>
      </div>

      <section>
        <h3 className="label-caps mb-2 text-muted">Completion history</h3>
        {history.length === 0 ? (
          <EmptyState title="Not completed yet" body="Each completed occurrence will be listed here with the XP it awarded." />
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex justify-between rounded-lg px-2 py-1 odd:bg-surface/50">
                <span className="num text-muted">{formatDateTime(h.completedAt, dateFormat)}</span>
                <span className="num text-highlight">+{h.xpAwarded} XP</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-muted">Created {formatDateTime(quest.createdAt, dateFormat)}</p>

      <ConfirmDialog
        open={confirmDelete}
        danger
        title="Delete quest?"
        confirmLabel="Delete quest"
        body={
          <>
            <p>
              “{quest.title}” will be removed. Its completion history and the XP it already earned stay in your records, so your level does not change.
            </p>
            <p>Tip: archiving keeps the quest restorable instead.</p>
          </>
        }
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteQuests([quest.id])
          setConfirmDelete(false)
          onClose()
          pushToast({ kind: 'info', title: 'Quest deleted' })
        }}
      />
    </div>
  )
}
