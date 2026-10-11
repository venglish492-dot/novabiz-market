import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { Box, Crown, History, Layers, Square } from 'lucide-react'
import { getDb } from '@/db/database'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { useAttributes, useProgress } from '@/hooks/useData'
import { useMotion, useReducedMotion } from '@/hooks/useMotion'
import { usePageVisible } from '@/hooks/useVisible'
import { Panel } from '@/components/ui/Panel'
import { Segmented } from '@/components/ui/Tabs'
import { Select } from '@/components/ui/Field'
import { Badge, LoadingBlock, SectionTitle, Stat } from '@/components/ui/Misc'
import { AnimatedNumber } from '@/components/ui/Progress'
import { AvatarEmblem } from '@/components/game/AvatarEmblem'
import { RankEmblem } from '@/components/game/RankEmblem'
import { XpBar } from '@/components/game/XpBar'
import { AttributeList } from '@/components/game/AttributeList'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ACHIEVEMENTS } from '@/game/achievements'
import { DEFAULT_SKILL_NODES } from '@/game/skilltree'
import { hasWebGL } from '@/three/webgl'
import { effects3D } from '@/three/effects'
import { resolveTokens } from '@/theme/themes'
import { formatDateTime } from '@/lib/dates'
import { formatXp } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { ProgressState } from '@/game/progress'

const StatusChamberScene = lazy(() => import('@/three/StatusChamberScene'))

/** Titles the user has genuinely unlocked (achievements, skill capstones, reached ranks). */
function useUnlockedTitles(progress: ProgressState | undefined) {
  const rules = useApp((s) => s.rules)
  const data = useLiveQuery(async () => {
    const db = getDb()
    const [ach, skills, custom] = await Promise.all([db.achievements.toArray(), db.skillUnlocks.toArray(), db.skillNodes.toArray()])
    return { ach, skills, custom }
  }, [])
  return useMemo(() => {
    if (!data || !progress) return []
    const titles: Array<{ title: string; source: string }> = []
    for (const a of data.ach) {
      const def = ACHIEVEMENTS.find((d) => d.id === a.id)
      if (def?.title) titles.push({ title: def.title, source: `Achievement: ${def.name}` })
    }
    const nodes = [...DEFAULT_SKILL_NODES, ...data.custom]
    for (const s of data.skills) {
      const n = nodes.find((x) => x.id === s.id)
      if (n?.title) titles.push({ title: n.title, source: `Skill: ${n.name}` })
    }
    rules.ranks.slice(0, progress.rank.index + 1).forEach((r) => titles.push({ title: r.title, source: `Rank ${r.label}` }))
    return titles
  }, [data, progress, rules.ranks])
}

export default function StatusView() {
  const progress = useProgress()
  const attributes = useAttributes()
  const appearance = useApp((s) => s.settings.appearance)
  const updateSettings = useApp((s) => s.updateSettings)
  const mode = appearance.enable3D && hasWebGL() ? appearance.statusMode : '2d'

  if (!progress || !attributes) return <LoadingBlock rows={5} label="Loading status" />

  return (
    <div>
      <SectionTitle
        eyebrow="Status profile"
        title="Status Chamber"
        description="Your level, rank, attributes and titles — all derived from your XP ledger."
        actions={
          appearance.enable3D && hasWebGL() ? (
            <Segmented
              label="Display mode"
              value={appearance.statusMode}
              onChange={(v) => void updateSettings((s) => ({ ...s, appearance: { ...s.appearance, statusMode: v } }))}
              options={[
                { value: '3d', label: <span className="inline-flex items-center gap-1.5"><Box className="size-4" />3D chamber</span> },
                { value: '2d', label: <span className="inline-flex items-center gap-1.5"><Square className="size-4" />2D</span> },
              ]}
            />
          ) : (
            <Badge>3D disabled — showing 2D mode</Badge>
          )
        }
      />
      {mode === '3d' ? <Chamber3D progress={progress} /> : <StatusPanels progress={progress} />}
      <div className="mt-gap grid gap-gap lg:grid-cols-2">
        <RankLadder progress={progress} />
        <XpHistory />
      </div>
    </div>
  )
}

function Chamber3D({ progress }: { progress: ProgressState }) {
  const appearance = useApp((s) => s.settings.appearance)
  const avatar = useApp((s) => s.settings.avatar)
  const attributes = useAttributes()
  const pulse = useUi((s) => s.pulseAttribute)
  const reduced = useReducedMotion()
  const visible = usePageVisible()
  const m = useMotion()
  const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 80, damping: 20 })
  const sy = useSpring(py, { stiffness: 80, damping: 20 })
  const leftX = useTransform(sx, (v) => v * -12)
  const rightX = useTransform(sx, (v) => v * 12)
  const panelY = useTransform(sy, (v) => v * 8)
  const tokens = resolveTokens(appearance)
  const color = avatar.coreColor ?? tokens.accent

  if (failed) return <StatusPanels progress={progress} />

  return (
    <div
      ref={ref}
      className="panel relative overflow-hidden"
      onPointerMove={(e) => {
        if (!m.distance || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        px.set(((e.clientX - r.left) / r.width - 0.5) * 2)
        py.set(((e.clientY - r.top) / r.height - 0.5) * 2)
      }}
    >
      <div className="absolute inset-0">
        <ErrorBoundary fallback={() => null} onError={() => setFailed(true)}>
          <Suspense fallback={null}>
            <StatusChamberScene
              fx={effects3D(appearance, avatar, reduced, visible)}
              avatar={avatar}
              color={color}
              color2={tokens.accent2}
              attributes={(attributes ?? []).map((a) => ({ id: a.id, color: a.color, level: progress.attributeLevels[a.id]?.level ?? 1 }))}
              highlight={pulse?.id ?? null}
              onContextLost={() => setFailed(true)}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
      <div className="relative grid min-h-[560px] gap-gap p-pad lg:grid-cols-[320px_1fr_320px]">
        <motion.div style={{ x: leftX, y: panelY }} className="self-start">
          <ProfileCard progress={progress} translucent />
        </motion.div>
        <div className="hidden lg:block" aria-hidden />
        <motion.div style={{ x: rightX, y: panelY }} className="self-end">
          <div className="panel bg-surface/60 p-pad backdrop-blur-[2px]">
            <p className="label-caps mb-3 flex items-center gap-2 text-accent">
              <Layers className="size-4" /> Attributes
            </p>
            {attributes && <AttributeList attributes={attributes} progress={progress} compact />}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function StatusPanels({ progress }: { progress: ProgressState }) {
  const attributes = useAttributes()
  return (
    <div className="grid gap-gap lg:grid-cols-[minmax(0,380px)_1fr]">
      <ProfileCard progress={progress} />
      <Panel title="Attributes" icon={<Layers className="size-4" />}>
        {attributes && <AttributeList attributes={attributes} progress={progress} />}
        <dl className="mt-5 grid gap-2 text-xs text-muted sm:grid-cols-2">
          {attributes?.map((a) => (
            <div key={a.id}>
              <dt className="font-semibold" style={{ color: a.color }}>
                {a.abbr} · {a.name}
              </dt>
              <dd>{a.description}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted">Attributes are gamified tracking scores, not scientific measurements of ability. They never decrease for taking breaks. Rename, reorder, hide or add attributes in Settings → Game rules.</p>
      </Panel>
    </div>
  )
}

function ProfileCard({ progress, translucent }: { progress: ProgressState; translucent?: boolean }) {
  const profile = useApp((s) => s.profile)
  const avatar = useApp((s) => s.settings.avatar)
  const style = useApp((s) => s.settings.appearance.profileCardStyle)
  const xpFormat = useApp((s) => s.settings.appearance.xpFormat)
  const updateProfile = useApp((s) => s.updateProfile)
  const titles = useUnlockedTitles(progress)
  return (
    <section
      aria-label="Profile"
      className={cn(
        'panel p-pad',
        style === 'holo' && 'panel-glow holo-corners',
        style === 'framed' && 'border-2 border-highlight/50',
        translucent && 'bg-surface/60 backdrop-blur-[2px]',
      )}
    >
      <div className="flex items-center gap-4">
        <AvatarEmblem avatar={avatar} name={profile.displayName} size={84} />
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-bold tracking-wide">{profile.displayName || 'Player'}</p>
          {profile.equippedTitle && <p className="text-sm text-highlight">«{profile.equippedTitle}»</p>}
          <p className="text-sm text-muted">
            {progress.rank.rank.label}-Rank · {progress.rank.rank.title}
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <RankEmblem rank={progress.rank.rank} index={progress.rank.index} size={70} />
        <div>
          <p className="label-caps text-muted">Level</p>
          <AnimatedNumber value={progress.level.level} className="text-glow text-5xl font-bold" />
        </div>
      </div>
      <div className="mt-4">
        <XpBar level={progress.level} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Lifetime XP" value={formatXp(progress.totalXp, xpFormat)} />
        <Stat label="Next rank" value={progress.rank.next ? `Lv ${progress.rank.next.minLevel}` : 'Max'} hint={progress.rank.next ? `${progress.rank.next.label} · ${progress.rank.next.title}` : undefined} />
      </div>
      <label className="mt-4 block text-sm">
        <span className="label-caps mb-1 flex items-center gap-1.5 text-muted">
          <Crown className="size-3.5" /> Equipped title
        </span>
        <Select value={profile.equippedTitle ?? ''} onChange={(e) => void updateProfile((p) => ({ ...p, equippedTitle: e.target.value || null }))}>
          <option value="">No title</option>
          {titles.map((t) => (
            <option key={`${t.title}-${t.source}`} value={t.title}>
              {t.title} — {t.source}
            </option>
          ))}
        </Select>
      </label>
    </section>
  )
}

function RankLadder({ progress }: { progress: ProgressState }) {
  const rules = useApp((s) => s.rules)
  return (
    <Panel title="Rank ladder" icon={<Crown className="size-4" />}>
      <p className="mb-3 text-sm text-muted">Levels grow with every XP award. Ranks are bigger milestones reached at specific levels.</p>
      <ol className="space-y-2">
        {rules.ranks.map((r, i) => {
          const reached = i <= progress.rank.index
          const current = i === progress.rank.index
          return (
            <li key={r.id} className={cn('flex items-center gap-3 rounded-xl border p-2', current ? 'border-accent/60 bg-accent/10' : 'border-line/60', !reached && 'opacity-60')}>
              <RankEmblem rank={r} index={i} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {r.label} · {r.title} {current && <span className="ml-1 text-xs text-accent">(current)</span>}
                </p>
                <p className="truncate text-xs text-muted">{r.description}</p>
              </div>
              <span className="num text-xs text-muted">Lv {r.minLevel}+</span>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}

function XpHistory() {
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const entries = useLiveQuery(() => getDb().ledger.orderBy('createdAt').reverse().limit(40).toArray(), [])
  return (
    <Panel title="XP ledger" icon={<History className="size-4" />} eyebrow="Read-only record">
      <p className="mb-3 text-xs text-muted">Every XP change is an entry here. Undoing a completion adds a reversal instead of erasing history, so totals can always be reconstructed.</p>
      {!entries?.length ? (
        <p className="text-sm text-muted">No XP recorded yet.</p>
      ) : (
        <ul className="max-h-[420px] divide-y divide-line/40 overflow-y-auto text-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-1.5">
              <Badge>{e.source}</Badge>
              <span className="flex-1 truncate">{e.title}</span>
              <span className="num hidden text-xs text-muted sm:inline">{formatDateTime(e.createdAt, dateFormat)}</span>
              <span className={cn('num w-16 text-right', e.amount >= 0 ? 'text-highlight' : 'text-warning')}>
                {e.amount >= 0 ? '+' : ''}
                {e.amount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
