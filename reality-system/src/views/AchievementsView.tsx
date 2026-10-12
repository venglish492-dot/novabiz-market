import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Gift, Lock, Pencil, Plus, Trash2, Check } from 'lucide-react'
import { getDb } from '@/db/database'
import { CONFIG_KEYS, loadAchievementOverrides, writeConfig } from '@/db/config'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { useAchievementOverrides, useProgress } from '@/hooks/useData'
import { gatherStats } from '@/game/engine'
import { ACHIEVEMENTS, RARITY_INFO, type AchievementDef } from '@/game/achievements'
import { rewardSchema, type Reward, type RewardTrigger } from '@/domain/schemas'
import { Panel } from '@/components/ui/Panel'
import { Button, IconButton } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Select, TextArea, TextInput } from '@/components/ui/Field'
import { Tabs } from '@/components/ui/Tabs'
import { Badge, EmptyState, LoadingBlock, SectionTitle } from '@/components/ui/Misc'
import { ProgressBar } from '@/components/ui/Progress'
import { Icon } from '@/components/ui/Icon'
import { formatDateTime, logicalDateKey } from '@/lib/dates'
import { newId } from '@/lib/id'
import { cn } from '@/lib/cn'

export default function AchievementsView() {
  const [tab, setTab] = useState<'achievements' | 'rewards'>('achievements')
  const rewardsAvailable = useAvailableRewardCount()
  return (
    <div>
      <SectionTitle eyebrow="Recognition" title="Achievements" description="Unlocked from your real stored records. Rarity is a visual style only, not a ranking against anyone else." />
      <Tabs
        label="Achievements sections"
        value={tab}
        onChange={setTab}
        className="mb-gap w-fit"
        items={[
          { id: 'achievements', label: 'Achievements' },
          { id: 'rewards', label: 'Reward vault', badge: rewardsAvailable ? <span className="num rounded-full bg-accent px-1.5 text-[10px] text-on-accent">{rewardsAvailable}</span> : undefined },
        ]}
      />
      {tab === 'achievements' ? <AchievementGrid /> : <RewardVault />}
    </div>
  )
}

function AchievementGrid() {
  const rules = useApp((s) => s.rules)
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const overrides = useAchievementOverrides()
  const data = useLiveQuery(async () => {
    const db = getDb()
    const [unlocks, stats] = await Promise.all([db.achievements.toArray(), gatherStats(db, rules)])
    return { unlocks, stats }
  }, [rules])
  const [editing, setEditing] = useState<AchievementDef | null>(null)
  if (!data || !overrides) return <LoadingBlock rows={6} label="Loading achievements" />
  const unlocked = new Map(data.unlocks.map((u) => [u.id, u]))
  const sorted = [...ACHIEVEMENTS].sort((a, b) => Number(unlocked.has(b.id)) - Number(unlocked.has(a.id)))
  return (
    <>
      <p className="mb-3 text-sm text-muted">
        {unlocked.size} of {ACHIEVEMENTS.length} unlocked
      </p>
      <div className="grid gap-gap sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((a) => {
          const u = unlocked.get(a.id)
          const p = a.progress(data.stats)
          const rarity = RARITY_INFO[a.rarity]
          const name = overrides[a.id]?.name || a.name
          const description = overrides[a.id]?.description || a.description
          return (
            <article key={a.id} className={cn('panel flex gap-3 p-4', u && 'panel-glow')} style={u ? { borderColor: `color-mix(in srgb, ${rarity.color} 50%, transparent)` } : undefined}>
              <div className={cn('grid size-14 shrink-0 place-items-center rounded-2xl border', u ? '' : 'opacity-40 grayscale')} style={{ borderColor: rarity.color, background: `color-mix(in srgb, ${rarity.color} 14%, transparent)`, color: rarity.color }}>
                {u ? <Icon name={a.icon} className="size-7" /> : <Lock className="size-6" aria-hidden />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <h3 className="flex-1 font-semibold">{name}</h3>
                  <IconButton size="sm" label={`Edit ${name}`} onClick={() => setEditing(a)}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                </div>
                <p className="text-sm text-muted">{description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge color={rarity.color}>{rarity.label}</Badge>
                  {a.xp > 0 && rules.achievementXpEnabled && <Badge>+{a.xp} XP</Badge>}
                  {a.title && <Badge color="#fbbf24">Title: {a.title}</Badge>}
                </div>
                {u ? (
                  <p className="mt-2 text-xs text-success">Unlocked {formatDateTime(u.unlockedAt, dateFormat)}</p>
                ) : (
                  <div className="mt-2">
                    <ProgressBar value={p.current / p.target} label={`${name} progress`} height="h-1.5" color={rarity.color} />
                    <p className="num mt-1 text-xs text-muted">
                      {p.current} / {p.target}
                    </p>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
      <EditAchievementDialog def={editing} onClose={() => setEditing(null)} />
    </>
  )
}

function EditAchievementDialog({ def, onClose }: { def: AchievementDef | null; onClose: () => void }) {
  return (
    <Dialog open={!!def} onClose={onClose} title="Edit achievement" description="Rename it or rewrite its description. The unlock condition stays the same." size="sm">
      {def && <EditAchievementForm key={def.id} def={def} onClose={onClose} />}
    </Dialog>
  )
}

function EditAchievementForm({ def, onClose }: { def: AchievementDef; onClose: () => void }) {
  const overrides = useAchievementOverrides()
  const [name, setName] = useState(overrides?.[def.id]?.name ?? def.name)
  const [description, setDescription] = useState(overrides?.[def.id]?.description ?? def.description)
  const save = async (reset = false) => {
    const all = await loadAchievementOverrides()
    if (reset) delete all[def.id]
    else all[def.id] = { name: name.trim().slice(0, 60) || def.name, description: description.trim().slice(0, 300) || def.description }
    await writeConfig(CONFIG_KEYS.achievementOverrides, all)
    onClose()
  }
  return (
    <div className="space-y-3">
      <Field label="Name">{(id) => <TextInput id={id} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />}</Field>
      <Field label="Description">{(id) => <TextArea id={id} value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />}</Field>
      <div className="flex justify-between gap-2">
        <Button variant="ghost" onClick={() => void save(true)}>
          Restore default
        </Button>
        <Button variant="primary" onClick={() => void save()}>
          Save
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Reward vault                                                       */
/* ------------------------------------------------------------------ */

function useRewardContext() {
  const progress = useProgress()
  const data = useLiveQuery(async () => {
    const db = getDb()
    const [rewards, goals, milestones, achievements] = await Promise.all([db.rewards.orderBy('createdAt').toArray(), db.goals.toArray(), db.milestones.toArray(), db.achievements.toArray()])
    return { rewards, goals, milestones, achievements }
  }, [])
  return useMemo(() => {
    if (!data || !progress) return null
    const available = (t: RewardTrigger): boolean => {
      switch (t.type) {
        case 'manual':
          return true
        case 'level':
          return progress.level.level >= t.level
        case 'goal':
          return data.goals.some((g) => g.id === t.goalId && g.status === 'completed')
        case 'milestone':
          return data.milestones.some((m) => m.id === t.milestoneId && m.done)
        case 'achievement':
          return data.achievements.some((a) => a.id === t.achievementId)
      }
    }
    const describe = (t: RewardTrigger): string => {
      switch (t.type) {
        case 'manual':
          return 'Available any time you decide'
        case 'level':
          return `Reach level ${t.level}`
        case 'goal':
          return `Complete goal “${data.goals.find((g) => g.id === t.goalId)?.name ?? 'deleted goal'}”`
        case 'milestone':
          return `Reach milestone “${data.milestones.find((m) => m.id === t.milestoneId)?.title ?? 'deleted milestone'}”`
        case 'achievement':
          return `Unlock “${ACHIEVEMENTS.find((a) => a.id === t.achievementId)?.name ?? t.achievementId}”`
      }
    }
    return { ...data, available, describe }
  }, [data, progress])
}

function useAvailableRewardCount(): number {
  const ctx = useRewardContext()
  return ctx ? ctx.rewards.filter((r) => !r.claimedAt && ctx.available(r.trigger)).length : 0
}

function RewardVault() {
  const ctx = useRewardContext()
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const pushToast = useUi((s) => s.pushToast)
  const resetHour = useApp((s) => s.settings.general.resetHour)
  const [editing, setEditing] = useState<Reward | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Reward | null>(null)
  if (!ctx) return <LoadingBlock rows={4} label="Loading rewards" />
  return (
    <div>
      <div className="mb-gap flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-2xl text-sm text-muted">Define your own real-life rewards — an episode of a favourite show, time for a hobby — and link them to milestones. No money, loot boxes or purchases, ever.</p>
        <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
          New reward
        </Button>
      </div>
      {ctx.rewards.length === 0 ? (
        <EmptyState icon={<Gift className="size-6" />} title="Your vault is empty" body="Example: “Watch a movie” unlocked when you reach level 5." />
      ) : (
        <div className="grid gap-gap sm:grid-cols-2 xl:grid-cols-3">
          {ctx.rewards.map((r) => {
            const ready = ctx.available(r.trigger)
            return (
              <Panel key={r.id} title={r.title} icon={<Gift className={cn('size-4', ready && !r.claimedAt ? 'text-highlight' : '')} />} glow={ready && !r.claimedAt}>
                {r.description && <p className="mb-2 text-sm text-muted">{r.description}</p>}
                <p className="text-xs text-muted">{ctx.describe(r.trigger)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {r.claimedAt ? (
                    <Badge color="#34d399">
                      <Check className="size-3" /> Enjoyed {formatDateTime(r.claimedAt, dateFormat)}
                    </Badge>
                  ) : ready ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        const now = new Date().toISOString()
                        const db = getDb()
                        await db.rewards.update(r.id, { claimedAt: now })
                        await db.activity.add({ id: newId('act'), type: 'reward-claimed', title: r.title, createdAt: now, dateKey: logicalDateKey(new Date(now), resetHour), refId: r.id, categoryId: null, xp: 0 })
                        pushToast({ kind: 'success', title: 'Reward claimed', body: `Enjoy: ${r.title}` })
                      }}
                    >
                      Claim reward
                    </Button>
                  ) : (
                    <Badge>
                      <Lock className="size-3" /> Locked
                    </Badge>
                  )}
                  <span className="flex-1" />
                  <IconButton size="sm" label={`Edit ${r.title}`} onClick={() => setEditing(r)}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton size="sm" label={`Delete ${r.title}`} onClick={() => setDeleting(r)}>
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              </Panel>
            )
          })}
        </div>
      )}
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New reward' : 'Edit reward'} size="sm">
        {editing && <RewardForm key={editing === 'new' ? 'new' : editing.id} reward={editing === 'new' ? null : editing} onClose={() => setEditing(null)} goals={ctx.goals} milestones={ctx.milestones} />}
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        title="Delete reward?"
        body={<p>“{deleting?.title}” will be removed from your vault.</p>}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await getDb().rewards.delete(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

function RewardForm({ reward, onClose, goals, milestones }: { reward: Reward | null; onClose: () => void; goals: Array<{ id: string; name: string }>; milestones: Array<{ id: string; title: string }> }) {
  const [title, setTitle] = useState(reward?.title ?? '')
  const [description, setDescription] = useState(reward?.description ?? '')
  const [trigger, setTrigger] = useState<RewardTrigger>(reward?.trigger ?? { type: 'level', level: 5 })
  const [error, setError] = useState<string | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const candidate = { id: reward?.id ?? newId('rw'), title: title.trim(), description: description.trim(), trigger, claimedAt: reward?.claimedAt ?? null, createdAt: reward?.createdAt ?? new Date().toISOString() }
    const parsed = rewardSchema.safeParse(candidate)
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Invalid reward')
    await getDb().rewards.put(parsed.data)
    onClose()
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Reward" error={error}>
        {(id, d) => <TextInput id={id} aria-describedby={d} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Watch a favourite episode" data-autofocus />}
      </Field>
      <Field label="Description">{(id) => <TextArea id={id} value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} />}</Field>
      <Field label="Unlocks when">
        {(id) => (
          <Select
            id={id}
            value={trigger.type}
            onChange={(e) => {
              const t = e.target.value
              setTrigger(
                t === 'level' ? { type: 'level', level: 5 } : t === 'goal' ? { type: 'goal', goalId: goals[0]?.id ?? '' } : t === 'milestone' ? { type: 'milestone', milestoneId: milestones[0]?.id ?? '' } : t === 'achievement' ? { type: 'achievement', achievementId: ACHIEVEMENTS[0].id } : { type: 'manual' },
              )
            }}
          >
            <option value="level">I reach a level</option>
            <option value="goal" disabled={!goals.length}>
              I complete a goal
            </option>
            <option value="milestone" disabled={!milestones.length}>
              I reach a milestone
            </option>
            <option value="achievement">I unlock an achievement</option>
            <option value="manual">Any time (manual)</option>
          </Select>
        )}
      </Field>
      {trigger.type === 'level' && <Field label="Level">{(id) => <TextInput id={id} type="number" min={1} value={trigger.level} onChange={(e) => setTrigger({ type: 'level', level: Math.max(1, Number(e.target.value) || 1) })} />}</Field>}
      {trigger.type === 'goal' && (
        <Field label="Goal">
          {(id) => (
            <Select id={id} value={trigger.goalId} onChange={(e) => setTrigger({ type: 'goal', goalId: e.target.value })}>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      {trigger.type === 'milestone' && (
        <Field label="Milestone">
          {(id) => (
            <Select id={id} value={trigger.milestoneId} onChange={(e) => setTrigger({ type: 'milestone', milestoneId: e.target.value })}>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      {trigger.type === 'achievement' && (
        <Field label="Achievement">
          {(id) => (
            <Select id={id} value={trigger.achievementId} onChange={(e) => setTrigger({ type: 'achievement', achievementId: e.target.value })}>
              {ACHIEVEMENTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!title.trim()}>
          Save reward
        </Button>
      </div>
    </form>
  )
}

