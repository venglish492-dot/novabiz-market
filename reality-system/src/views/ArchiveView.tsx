import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Archive, ArchiveRestore, Plus, Search, Trash2, History, ListTodo } from 'lucide-react'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { useCategories, useCategoryMap, useQuests } from '@/hooks/useData'
import { useToday } from '@/hooks/useToday'
import { getDb } from '@/db/database'
import { archiveQuests, deleteQuests, restoreQuests } from '@/quests/service'
import { occurrenceKeyFor, ONCE, QUEST_TYPE_INFO, describeRecurrence } from '@/quests/recurrence'
import { questBaseXp, difficultyRule } from '@/game/rules'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Select, TextInput } from '@/components/ui/Field'
import { Tabs } from '@/components/ui/Tabs'
import { Badge, EmptyState, LoadingBlock, SectionTitle } from '@/components/ui/Misc'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DIFFICULTY_COLORS } from '@/components/game/difficultyColors'
import { formatDateKey, formatDateTime } from '@/lib/dates'
import { QUEST_TYPES, DIFFICULTY_IDS, type Quest } from '@/domain/schemas'
import { cn } from '@/lib/cn'

type SortKey = 'created' | 'title' | 'due' | 'difficulty' | 'xp'
const PAGE = 50

export default function ArchiveView() {
  const [tab, setTab] = useState<'quests' | 'log'>('quests')
  return (
    <div>
      <SectionTitle eyebrow="Every quest" title="Quest Archive" description="Search, filter, sort and manage all quests. Archived quests can be restored at any time." />
      <Tabs
        label="Archive sections"
        value={tab}
        onChange={setTab}
        className="mb-gap w-fit"
        items={[
          { id: 'quests', label: 'All quests' },
          { id: 'log', label: 'Completion log' },
        ]}
      />
      {tab === 'quests' ? <QuestTable /> : <CompletionLog />}
    </div>
  )
}

function QuestTable() {
  const quests = useQuests()
  const categories = useCategories(true)
  const categoryMap = useCategoryMap()
  const rules = useApp((s) => s.rules)
  const weekStart = useApp((s) => s.settings.general.weekStart)
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const openDetails = useUi((s) => s.openDetails)
  const openEditor = useUi((s) => s.openEditor)
  const pushToast = useUi((s) => s.pushToast)
  const today = useToday()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | Quest['status']>('all')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [sort, setSort] = useState<SortKey>('created')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [limit, setLimit] = useState(PAGE)

  const list = useMemo(() => {
    if (!quests) return []
    const q = query.trim().toLowerCase()
    const order = DIFFICULTY_IDS as readonly string[]
    return quests
      .filter((x) => (status === 'all' ? true : x.status === status))
      .filter((x) => !category || x.categoryId === category)
      .filter((x) => !type || x.type === type)
      .filter((x) => !difficulty || x.difficulty === difficulty)
      .filter((x) => !q || x.title.toLowerCase().includes(q) || x.description.toLowerCase().includes(q) || x.tags.some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => {
        switch (sort) {
          case 'title':
            return a.title.localeCompare(b.title)
          case 'due':
            return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
          case 'difficulty':
            return order.indexOf(b.difficulty) - order.indexOf(a.difficulty)
          case 'xp':
            return questBaseXp(rules, b) - questBaseXp(rules, a)
          default:
            return b.createdAt.localeCompare(a.createdAt)
        }
      })
  }, [quests, query, status, category, type, difficulty, sort, rules])

  if (!quests) return <LoadingBlock rows={6} label="Loading quests" />

  const shown = list.slice(0, limit)
  const allSelected = shown.length > 0 && shown.every((q) => selected.has(q.id))
  const toggle = (id: string) => setSelected((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])))
  const ids = [...selected]

  return (
    <Panel>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <label className="relative sm:col-span-2">
          <span className="sr-only">Search quests</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <TextInput className="pl-9" placeholder="Search title, description, tags…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </Select>
        <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Quest type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {QUEST_TYPES.map((t) => (
            <option key={t} value={t}>
              {QUEST_TYPE_INFO[t].label}
            </option>
          ))}
        </Select>
        <Select aria-label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All difficulties</option>
          {rules.difficulties.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select aria-label="Sort by" className="w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="created">Newest first</option>
          <option value="title">Title A–Z</option>
          <option value="due">Due date</option>
          <option value="difficulty">Difficulty</option>
          <option value="xp">XP reward</option>
        </Select>
        <span className="text-sm text-muted">{list.length} quests</span>
        <span className="flex-1" />
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Bulk actions">
            <span className="text-sm text-muted">{selected.size} selected</span>
            <Button size="sm" icon={<Archive className="size-4" />} onClick={() => void archiveQuests(ids).then(() => (setSelected(new Set()), pushToast({ kind: 'info', title: `${ids.length} archived` })))}>
              Archive
            </Button>
            <Button size="sm" icon={<ArchiveRestore className="size-4" />} onClick={() => void restoreQuests(ids).then(() => (setSelected(new Set()), pushToast({ kind: 'info', title: `${ids.length} restored` })))}>
              Restore
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        )}
        <Button size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => openEditor(null)}>
          New quest
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState className="mt-4" icon={<ListTodo className="size-6" />} title={quests.length ? 'No quests match these filters' : 'No quests yet'} body={quests.length ? 'Try clearing a filter.' : 'Create your first quest to start building your archive.'} />
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="label-caps text-muted">
                <th className="w-10 py-2 pl-2">
                  <input type="checkbox" aria-label="Select all shown quests" className="size-4 accent-[var(--rs-accent)]" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(shown.map((q) => q.id)))} />
                </th>
                <th className="py-2">Quest</th>
                <th className="py-2">Type</th>
                <th className="py-2">Difficulty</th>
                <th className="py-2">Due</th>
                <th className="py-2">Status</th>
                <th className="py-2 pr-2 text-right">XP</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((q) => {
                const cat = categoryMap.get(q.categoryId)
                return (
                  <tr key={q.id} className={cn('border-t border-line/50 hover:bg-accent/5', selected.has(q.id) && 'bg-accent/5')}>
                    <td className="py-2 pl-2">
                      <input type="checkbox" aria-label={`Select ${q.title}`} className="size-4 accent-[var(--rs-accent)]" checked={selected.has(q.id)} onChange={() => toggle(q.id)} />
                    </td>
                    <td className="max-w-[320px] py-2">
                      <button type="button" className="block w-full truncate text-left font-medium hover:text-accent" onClick={() => openDetails(q.id, occurrenceKeyFor(q, today, weekStart) ?? ONCE)}>
                        {q.title}
                      </button>
                      <span className="text-xs text-muted">{cat?.name}</span>
                    </td>
                    <td className="py-2 text-muted">
                      {QUEST_TYPE_INFO[q.type].label}
                      <span className="block text-xs">{describeRecurrence(q.recurrence)}</span>
                    </td>
                    <td className="py-2">
                      <Badge color={DIFFICULTY_COLORS[q.difficulty]}>{difficultyRule(rules, q.difficulty).label}</Badge>
                    </td>
                    <td className="num py-2 text-muted">{q.dueDate ? formatDateKey(q.dueDate, dateFormat) : '—'}</td>
                    <td className="py-2">
                      <Badge color={q.status === 'completed' ? '#34d399' : q.status === 'archived' ? '#94a3b8' : '#38bdf8'}>{q.status}</Badge>
                    </td>
                    <td className="num py-2 pr-2 text-right text-highlight">{questBaseXp(rules, q)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {list.length > shown.length && (
            <div className="mt-3 text-center">
              <Button size="sm" onClick={() => setLimit((l) => l + PAGE)}>
                Show more ({list.length - shown.length} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        danger
        title={`Delete ${ids.length} quests?`}
        confirmLabel="Delete permanently"
        body={<p>The selected quests will be removed. Their completion history and earned XP stay in your records. Archiving is the reversible option.</p>}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteQuests(ids)
          setSelected(new Set())
          setConfirmDelete(false)
          pushToast({ kind: 'info', title: `${ids.length} quests deleted` })
        }}
      />
    </Panel>
  )
}

function CompletionLog() {
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const categoryMap = useCategoryMap()
  const [limit, setLimit] = useState(PAGE)
  const rows = useLiveQuery(() => getDb().completions.orderBy('completedAt').reverse().limit(limit).toArray(), [limit])
  const total = useLiveQuery(() => getDb().completions.count(), [])
  if (!rows) return <LoadingBlock rows={6} label="Loading history" />
  if (rows.length === 0) return <EmptyState icon={<History className="size-6" />} title="No completions yet" body="Every completed quest occurrence is recorded here with the XP it awarded." />
  return (
    <Panel>
      <ul className="divide-y divide-line/50">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
            <span className="size-2 shrink-0 rounded-full" style={{ background: categoryMap.get(c.categoryId)?.color }} />
            <span className="flex-1 truncate">{c.title}</span>
            <span className="num hidden text-xs text-muted sm:inline">{formatDateTime(c.completedAt, dateFormat)}</span>
            <span className="num w-20 text-right text-highlight">+{c.xpAwarded} XP</span>
          </li>
        ))}
      </ul>
      {total !== undefined && total > rows.length && (
        <div className="mt-3 text-center">
          <Button size="sm" onClick={() => setLimit((l) => l + PAGE)}>
            Load more
          </Button>
        </div>
      )}
    </Panel>
  )
}
