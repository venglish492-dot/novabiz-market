import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { Check, CircleDashed, List, Lock, Network, Plus, Sparkles, Star, Trash2, Unlock } from 'lucide-react'
import { getDb } from '@/db/database'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { useAttributeMap, useAttributes, useCategoryMap, useProgress } from '@/hooks/useData'
import { useMotion } from '@/hooks/useMotion'
import { unlockSkillAction } from '@/app/actions'
import { DEFAULT_SKILL_NODES, SKILL_BRANCHES, evaluateNode, type NodeEvaluation, type NodeState } from '@/game/skilltree'
import { skillNodeSchema, type SkillNodeDef } from '@/domain/schemas'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Select, TextArea, TextInput } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/Tabs'
import { Badge, LoadingBlock, SectionTitle } from '@/components/ui/Misc'
import { ProgressBar } from '@/components/ui/Progress'
import { newId } from '@/lib/id'
import { cn } from '@/lib/cn'

const STATE_INFO: Record<NodeState, { label: string; icon: typeof Lock }> = {
  locked: { label: 'Locked', icon: Lock },
  available: { label: 'Available to unlock', icon: Unlock },
  unlocked: { label: 'Unlocked', icon: Check },
  mastered: { label: 'Mastered', icon: Star },
}

function depthOf(node: SkillNodeDef, all: Map<string, SkillNodeDef>): number {
  let d = 0
  let cur = node
  const seen = new Set<string>()
  while (cur.prerequisiteId && all.has(cur.prerequisiteId) && !seen.has(cur.id)) {
    seen.add(cur.id)
    cur = all.get(cur.prerequisiteId)!
    d++
  }
  return d
}

export default function SkillTreeView() {
  const progress = useProgress()
  const attributes = useAttributeMap()
  const categories = useCategoryMap()
  const rules = useApp((s) => s.rules)
  const m = useMotion()
  const [view, setView] = useState<'tree' | 'list'>('tree')
  const [selectedId, setSelectedId] = useState<string | null>('int-1')
  const [adding, setAdding] = useState(false)
  const data = useLiveQuery(async () => {
    const db = getDb()
    const [custom, unlocks, completions, goals] = await Promise.all([db.skillNodes.toArray(), db.skillUnlocks.toArray(), db.completions.toArray(), db.goals.toArray()])
    const byCategory: Record<string, number> = {}
    for (const c of completions) byCategory[c.categoryId] = (byCategory[c.categoryId] ?? 0) + 1
    return { custom, unlocks, byCategory, goals }
  }, [])

  const nodes = useMemo(() => [...DEFAULT_SKILL_NODES, ...(data?.custom ?? [])], [data?.custom])
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const evaluations = useMemo(() => {
    const out = new Map<string, NodeEvaluation>()
    if (!data || !progress) return out
    const completedGoals = data.goals.filter((g) => g.status === 'completed')
    const ctx = {
      attributePoints: progress.attributePoints,
      rankIndex: progress.rank.index,
      completionsByCategory: data.byCategory,
      goalsCompleted: completedGoals.length,
      completedGoalIds: completedGoals.map((g) => g.id),
      unlockedIds: new Set(data.unlocks.map((u) => u.id)),
      names: {
        attribute: (id: string) => attributes.get(id)?.name ?? id,
        category: (id: string) => categories.get(id)?.name ?? id,
        rank: (i: number) => rules.ranks[i]?.label ?? String(i),
        goal: (id: string) => data.goals.find((g) => g.id === id)?.name ?? 'a goal',
        node: (id: string) => nodeMap.get(id)?.name ?? id,
      },
    }
    for (const n of nodes) out.set(n.id, evaluateNode(n, ctx))
    return out
  }, [data, progress, attributes, categories, rules.ranks, nodes, nodeMap])

  if (!data || !progress) return <LoadingBlock rows={5} label="Loading skill tree" />

  const branches = [...SKILL_BRANCHES, ...new Set(data.custom.map((c) => c.branch).filter((b) => !(SKILL_BRANCHES as readonly string[]).includes(b)))]
  const selected = selectedId ? nodeMap.get(selectedId) : undefined
  const unlockedCount = data.unlocks.length

  // layout for the SVG tree
  const colW = 150
  const rowH = 110
  const positions = new Map<string, { x: number; y: number }>()
  let maxDepth = 0
  branches.forEach((b, col) => {
    const inBranch = nodes.filter((n) => n.branch === b)
    const perDepth = new Map<number, number>()
    for (const n of inBranch) {
      const d = depthOf(n, nodeMap)
      const slot = perDepth.get(d) ?? 0
      perDepth.set(d, slot + 1)
      maxDepth = Math.max(maxDepth, d)
      positions.set(n.id, { x: col * colW + colW / 2 + slot * 26, y: 60 + d * rowH + slot * 18 })
    }
  })
  const width = branches.length * colW
  const height = 60 + (maxDepth + 1) * rowH

  return (
    <div>
      <SectionTitle
        eyebrow={`${unlockedCount} of ${nodes.length} nodes unlocked`}
        title="Skill Tree"
        description="Each node shows exactly what it needs. Unlocking is only possible with real recorded progress, and unlocked nodes never decay."
        actions={
          <>
            <Segmented
              label="View"
              value={view}
              onChange={setView}
              options={[
                { value: 'tree', label: <span className="inline-flex items-center gap-1.5"><Network className="size-4" />Tree</span> },
                { value: 'list', label: <span className="inline-flex items-center gap-1.5"><List className="size-4" />List</span> },
              ]}
            />
            <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
              Custom node
            </Button>
          </>
        }
      />
      <div className="grid gap-gap xl:grid-cols-[1fr_360px]">
        {view === 'tree' ? (
          <Panel className="overflow-hidden" bodyClassName="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 640, height: 'auto' }} role="group" aria-label="Skill tree">
              {branches.map((b, col) => {
                const a = attributes.get(b)
                return (
                  <g key={b}>
                    <text x={col * colW + colW / 2} y={24} textAnchor="middle" className="fill-[var(--rs-muted)] font-display text-[11px] tracking-[0.2em]">
                      {a?.abbr ?? b.toUpperCase()}
                    </text>
                    <line x1={col * colW + colW / 2} y1={34} x2={col * colW + colW / 2} y2={height - 20} stroke="var(--rs-border)" strokeDasharray="2 6" />
                  </g>
                )
              })}
              {nodes.map((n) => {
                if (!n.prerequisiteId || !positions.has(n.prerequisiteId)) return null
                const a = positions.get(n.prerequisiteId)!
                const b = positions.get(n.id)!
                const ev = evaluations.get(n.id)
                const lit = ev && ev.state !== 'locked'
                const color = attributes.get(n.branch)?.color ?? 'var(--rs-accent)'
                return <line key={`l-${n.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit ? color : 'var(--rs-border)'} strokeWidth={lit ? 2 : 1.2} strokeOpacity={lit ? 0.8 : 1} />
              })}
              {nodes.map((n) => {
                const p = positions.get(n.id)!
                const ev = evaluations.get(n.id)
                const state = ev?.state ?? 'locked'
                const color = attributes.get(n.branch)?.color ?? '#38bdf8'
                const active = state === 'unlocked' || state === 'mastered'
                return (
                  <g
                    key={n.id}
                    transform={`translate(${p.x} ${p.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${n.name}: ${STATE_INFO[state].label}`}
                    aria-pressed={selectedId === n.id}
                    onClick={() => setSelectedId(n.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelectedId(n.id))}
                    className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-[var(--rs-accent)]"
                  >
                    {state === 'available' && m.flourish && (
                      <motion.circle r={26} fill="none" stroke={color} strokeWidth={1.5} initial={{ opacity: 0.8, scale: 0.9 }} animate={{ opacity: 0, scale: 1.4 }} transition={{ duration: 1.8, repeat: Infinity }} />
                    )}
                    <circle r={22} fill={active ? color : 'var(--rs-surface)'} fillOpacity={active ? 0.25 : 1} stroke={state === 'locked' ? 'var(--rs-border)' : color} strokeWidth={selectedId === n.id ? 3 : 2} style={active ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined} />
                    {state === 'mastered' && <circle r={27} fill="none" stroke="var(--rs-highlight)" strokeWidth={1.2} strokeDasharray="3 3" />}
                    <text textAnchor="middle" dominantBaseline="central" className="font-display text-[10px]" fill={state === 'locked' ? 'var(--rs-muted)' : 'var(--rs-text)'}>
                      {state === 'locked' ? '◇' : state === 'available' ? '◆' : state === 'mastered' ? '★' : '✓'}
                    </text>
                    <text y={36} textAnchor="middle" className="text-[10.5px]" fill={state === 'locked' ? 'var(--rs-muted)' : 'var(--rs-text)'}>
                      {n.name.length > 18 ? `${n.name.slice(0, 17)}…` : n.name}
                    </text>
                  </g>
                )
              })}
            </svg>
          </Panel>
        ) : (
          <Panel title="All nodes">
            <div className="space-y-5">
              {branches.map((b) => (
                <section key={b} aria-label={attributes.get(b)?.name ?? b}>
                  <h3 className="label-caps mb-2" style={{ color: attributes.get(b)?.color }}>
                    {attributes.get(b)?.name ?? b}
                  </h3>
                  <ul className="space-y-1.5">
                    {nodes
                      .filter((n) => n.branch === b)
                      .sort((x, y) => depthOf(x, nodeMap) - depthOf(y, nodeMap))
                      .map((n) => {
                        const state = evaluations.get(n.id)?.state ?? 'locked'
                        const I = STATE_INFO[state].icon
                        return (
                          <li key={n.id}>
                            <button type="button" onClick={() => setSelectedId(n.id)} className={cn('flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm', selectedId === n.id ? 'border-accent bg-accent/10' : 'border-line/60 hover:border-accent/40')}>
                              <I className="size-4 shrink-0" aria-hidden />
                              <span className="flex-1">{n.name}</span>
                              <span className="text-xs text-muted">{STATE_INFO[state].label}</span>
                            </button>
                          </li>
                        )
                      })}
                  </ul>
                </section>
              ))}
            </div>
          </Panel>
        )}
        <NodeInspector node={selected} evaluation={selected ? evaluations.get(selected.id) : undefined} />
      </div>
      <CustomNodeDialog open={adding} onClose={() => setAdding(false)} nodes={nodes} />
    </div>
  )
}

function NodeInspector({ node, evaluation }: { node?: SkillNodeDef; evaluation?: NodeEvaluation }) {
  const attributes = useAttributeMap()
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!node || !evaluation) {
    return (
      <Panel title="Inspect a node">
        <p className="text-sm text-muted">Select any node to see its requirements.</p>
      </Panel>
    )
  }
  const color = attributes.get(node.branch)?.color
  const S = STATE_INFO[evaluation.state]
  return (
    <Panel title={node.name} icon={<Sparkles className="size-4" style={{ color }} />} className="self-start xl:sticky xl:top-20">
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Badge color={color}>{attributes.get(node.branch)?.abbr ?? node.branch}</Badge>
        <Badge color={evaluation.state === 'locked' ? undefined : color}>
          <S.icon className="size-3" /> {S.label}
        </Badge>
        {node.custom && <Badge>Custom</Badge>}
      </div>
      <p className="text-sm text-fg/90">{node.description}</p>
      {node.title && <p className="mt-2 text-sm text-highlight">Unlocks the title «{node.title}»</p>}
      <h3 className="label-caps mt-4 mb-2 text-muted">Requirements</h3>
      {evaluation.checks.length === 0 ? (
        <p className="text-sm text-muted">No requirements.</p>
      ) : (
        <ul className="space-y-2.5">
          {evaluation.checks.map((c) => (
            <li key={c.label} className="text-sm">
              <div className="flex items-center gap-2">
                {c.met ? <Check className="size-4 text-success" aria-label="Met" /> : <CircleDashed className="size-4 text-muted" aria-label="Not met" />}
                <span className="flex-1">{c.label}</span>
                {c.target !== undefined && (
                  <span className="num text-xs text-muted">
                    {c.current} / {c.target}
                  </span>
                )}
              </div>
              {c.target !== undefined && !c.met && <ProgressBar className="mt-1" value={(c.current ?? 0) / c.target} label={c.label} height="h-1" color={color} />}
            </li>
          ))}
        </ul>
      )}
      {(evaluation.state === 'unlocked' || evaluation.state === 'mastered') && node.requirement.attributeXp > 0 && (
        <p className="mt-3 text-xs text-muted">Mastery is reached at {node.requirement.attributeXp * 2} attribute points.</p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="primary" disabled={evaluation.state !== 'available'} icon={<Unlock className="size-4" />} onClick={() => void unlockSkillAction(node.id, node.name)}>
          {evaluation.state === 'available' ? 'Unlock node' : evaluation.state === 'locked' ? 'Requirements not met' : 'Unlocked'}
        </Button>
        {node.custom && (
          <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        danger
        title="Delete custom node?"
        body={<p>“{node.name}” and its unlock record will be removed.</p>}
        confirmLabel="Delete node"
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          const db = getDb()
          await db.transaction('rw', db.skillNodes, db.skillUnlocks, async () => {
            await db.skillNodes.delete(node.id)
            await db.skillUnlocks.delete(node.id)
            await db.skillNodes.where('id').anyOf((await db.skillNodes.toArray()).filter((n) => n.prerequisiteId === node.id).map((n) => n.id)).modify({ prerequisiteId: null })
          })
          setConfirmDelete(false)
        }}
      />
    </Panel>
  )
}

function CustomNodeDialog({ open, onClose, nodes }: { open: boolean; onClose: () => void; nodes: SkillNodeDef[] }) {
  const attributes = useAttributes(true)
  const rules = useApp((s) => s.rules)
  const pushToast = useUi((s) => s.pushToast)
  const goals = useLiveQuery(() => getDb().goals.toArray(), [])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [branch, setBranch] = useState('int')
  const [prereq, setPrereq] = useState('')
  const [xp, setXp] = useState(200)
  const [rank, setRank] = useState('')
  const [goalId, setGoalId] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const node = {
      id: newId('skill'),
      branch,
      name: name.trim(),
      description: description.trim(),
      prerequisiteId: prereq || null,
      requirement: { attributeXp: Math.max(0, Math.round(xp)), minRankIndex: rank === '' ? null : Number(rank), categoryId: null, categoryCompletions: 0, goalsCompleted: 0, goalId: goalId || null },
      title: title.trim() || null,
      custom: true,
      createdAt: new Date().toISOString(),
    }
    const parsed = skillNodeSchema.safeParse(node)
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Invalid node')
    await getDb().skillNodes.add(parsed.data)
    pushToast({ kind: 'success', title: 'Custom node added', body: node.name })
    setName('')
    setDescription('')
    setTitle('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add a custom skill node" description="Represent your own learning path, e.g. “Finish Linear Algebra course”." size="md">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={error} className="sm:col-span-2">
          {(id, d) => <TextInput id={id} aria-describedby={d} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required data-autofocus />}
        </Field>
        <Field label="Branch (attribute)">
          {(id) => (
            <Select id={id} value={branch} onChange={(e) => (setBranch(e.target.value), setPrereq(''))}>
              {attributes?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Requires node">
          {(id) => (
            <Select id={id} value={prereq} onChange={(e) => setPrereq(e.target.value)}>
              <option value="">None</option>
              {nodes
                .filter((n) => n.branch === branch)
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
            </Select>
          )}
        </Field>
        <Field label="Attribute points required">{(id) => <TextInput id={id} type="number" min={0} value={xp} onChange={(e) => setXp(Number(e.target.value) || 0)} />}</Field>
        <Field label="Minimum rank">
          {(id) => (
            <Select id={id} value={rank} onChange={(e) => setRank(e.target.value)}>
              <option value="">Any</option>
              {rules.ranks.map((r, i) => (
                <option key={r.id} value={i}>
                  {r.label} · {r.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Requires completed goal">
          {(id) => (
            <Select id={id} value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              <option value="">None</option>
              {goals?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Title unlocked (optional)">{(id) => <TextInput id={id} maxLength={40} value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
        <Field label="Description" className="sm:col-span-2">
          {(id) => <TextArea id={id} maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)} />}
        </Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!name.trim()}>
            Add node
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
