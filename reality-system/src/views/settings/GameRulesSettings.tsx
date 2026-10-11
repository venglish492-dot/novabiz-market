import { useMemo, useState } from 'react'
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { useLedger } from '@/hooks/useData'
import { defaultRules, gameRulesSchema, type GameRules, type RankDef } from '@/game/rules'
import { levelInfo, totalXpForLevel, xpToNextLevel } from '@/game/levels'
import { sumLedger } from '@/game/progress'
import { reevaluateAchievements } from '@/game/engine'
import { presentResult } from '@/app/actions'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Field, TextInput } from '@/components/ui/Field'
import { Toggle } from '@/components/ui/Toggle'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RankEmblem } from '@/components/game/RankEmblem'
import { formatNumber } from '@/lib/format'

const int = (v: string, fallback = 0) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? n : fallback
}

export function GameRulesSettings() {
  const rules = useApp((s) => s.rules)
  const updateRules = useApp((s) => s.updateRules)
  const pushToast = useUi((s) => s.pushToast)
  const ledger = useLedger()
  const [draft, setDraft] = useState<GameRules>(rules)
  const [errors, setErrors] = useState<string[]>([])
  const [confirmReset, setConfirmReset] = useState(false)
  const set = <K extends keyof GameRules>(k: K, v: GameRules[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const dirty = JSON.stringify(draft) !== JSON.stringify(rules)
  const total = ledger ? sumLedger(ledger) : 0

  const preview = useMemo(() => {
    const parsed = gameRulesSchema.safeParse(draft)
    if (!parsed.success) return null
    return { now: levelInfo(total, rules).level, after: levelInfo(total, parsed.data).level }
  }, [draft, rules, total])

  const save = async (next: GameRules) => {
    const parsed = gameRulesSchema.safeParse(next)
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => `${i.path.join(' → ') || 'Rules'}: ${i.message}`))
      return
    }
    setErrors([])
    await updateRules(parsed.data)
    setDraft(useApp.getState().rules)
    pushToast({ kind: 'success', title: 'Game rules saved', body: 'They apply to future rewards. Past XP records are unchanged.' })
    presentResult(await reevaluateAchievements())
  }

  const updateRank = (i: number, patch: Partial<RankDef>) => set('ranks', draft.ranks.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  return (
    <div className="space-y-gap">
      <div className="panel flex flex-wrap items-center gap-3 p-4 text-sm">
        <p className="flex-1 text-muted">
          Rules control <strong className="text-fg">future</strong> rewards. Every past award is stored in the XP ledger with its exact amount, so changing rules never corrupts history. Level and rank are recalculated from your lifetime XP ({formatNumber(total)}).
          {preview && preview.now !== preview.after && <span className="text-warning"> With these changes your level would be {preview.after} instead of {preview.now}.</span>}
        </p>
        <Button variant="ghost" icon={<RotateCcw className="size-4" />} onClick={() => setConfirmReset(true)}>
          Reset game rules
        </Button>
        <Button variant="primary" icon={<Save className="size-4" />} disabled={!dirty} onClick={() => void save(draft)}>
          Save rules
        </Button>
      </div>
      {errors.length > 0 && (
        <div role="alert" className="rounded-xl border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
          <p className="font-semibold">These rules are not valid yet:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-gap lg:grid-cols-2">
        <Panel title="Quest rewards">
          <div className="grid grid-cols-[1fr_100px] gap-2">
            {draft.difficulties.map((d, i) => (
              <div key={d.id} className="contents">
                <TextInput aria-label={`${d.id} label`} value={d.label} maxLength={20} onChange={(e) => set('difficulties', draft.difficulties.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <TextInput aria-label={`${d.label} XP`} type="number" min={1} value={d.xp} onChange={(e) => set('difficulties', draft.difficulties.map((x, j) => (j === i ? { ...x, xp: int(e.target.value, 1) } : x)))} />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Field label="Min XP / quest">{(id) => <TextInput id={id} type="number" min={0} value={draft.questXpMin} onChange={(e) => set('questXpMin', int(e.target.value))} />}</Field>
            <Field label="Max XP / quest">{(id) => <TextInput id={id} type="number" min={1} value={draft.questXpMax} onChange={(e) => set('questXpMax', int(e.target.value, 1))} />}</Field>
            <Field label="Daily quest XP cap">{(id) => <TextInput id={id} type="number" min={10} value={draft.dailyQuestXpCap} onChange={(e) => set('dailyQuestXpCap', int(e.target.value, 10))} />}</Field>
          </div>
          <p className="mt-2 text-xs text-muted">The daily cap prevents accidental XP inflation. Quests completed past the cap are still recorded — with the reduced reward clearly shown.</p>
          <Field label="Discipline share for recurring quests (%)" className="mt-4" hint="Recurring quests and routines also add this share of their XP to the Discipline attribute.">
            {(id, d) => <TextInput id={id} aria-describedby={d} type="number" min={0} max={100} value={Math.round(draft.disciplineShare * 100)} onChange={(e) => set('disciplineShare', Math.max(0, Math.min(100, int(e.target.value))) / 100)} />}
          </Field>
        </Panel>

        <Panel title="Level curve">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Base XP">{(id) => <TextInput id={id} type="number" min={10} value={draft.levelCurve.base} onChange={(e) => set('levelCurve', { ...draft.levelCurve, base: int(e.target.value, 10) })} />}</Field>
            <Field label="Growth exponent">{(id) => <TextInput id={id} type="number" step={0.05} min={1} max={2.5} value={draft.levelCurve.exponent} onChange={(e) => set('levelCurve', { ...draft.levelCurve, exponent: Number(e.target.value) || 1 })} />}</Field>
            <Field label="Max level">{(id) => <TextInput id={id} type="number" min={10} max={999} value={draft.maxLevel} onChange={(e) => set('maxLevel', int(e.target.value, 10))} />}</Field>
          </div>
          <p className="mt-2 text-xs text-muted">XP to go from level L to L+1 = base × L^exponent (rounded).</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="label-caps text-muted">
                <th className="py-1 text-left">Level</th>
                <th className="py-1 text-right">XP to next</th>
                <th className="py-1 text-right">Total to reach</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 5, 10, 20, 30, 45].map((l) => (
                <tr key={l} className="border-t border-line/40">
                  <td className="num py-1">{l}</td>
                  <td className="num py-1 text-right">{formatNumber(xpToNextLevel(l, draft.levelCurve))}</td>
                  <td className="num py-1 text-right">{formatNumber(totalXpForLevel(l, draft.levelCurve))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Ranks" className="lg:col-span-2">
          <p className="mb-3 text-sm text-muted">Ranks are larger milestones than levels. The first rank must start at level 1, and each rank needs a different starting level.</p>
          <ul className="space-y-3">
            {draft.ranks.map((r, i) => (
              <li key={r.id} className="grid items-end gap-2 rounded-xl border border-line/60 p-3 md:grid-cols-[48px_70px_1fr_90px_70px_2fr_auto]">
                <RankEmblem rank={r} index={i} size={44} />
                <Field label="Label">{(id) => <TextInput id={id} value={r.label} maxLength={4} onChange={(e) => updateRank(i, { label: e.target.value })} />}</Field>
                <Field label="Title">{(id) => <TextInput id={id} value={r.title} maxLength={40} onChange={(e) => updateRank(i, { title: e.target.value })} />}</Field>
                <Field label="From level">{(id) => <TextInput id={id} type="number" min={1} value={r.minLevel} onChange={(e) => updateRank(i, { minLevel: int(e.target.value, 1) })} />}</Field>
                <Field label="Colour">{(id) => <input id={id} type="color" value={r.color} onChange={(e) => updateRank(i, { color: e.target.value })} className="h-10 w-full cursor-pointer rounded-lg border border-line bg-transparent" />}</Field>
                <Field label="Description">{(id) => <TextInput id={id} value={r.description} maxLength={300} onChange={(e) => updateRank(i, { description: e.target.value })} />}</Field>
                <Button variant="ghost" aria-label={`Remove rank ${r.label}`} disabled={draft.ranks.length <= 1} onClick={() => set('ranks', draft.ranks.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            className="mt-3"
            size="sm"
            icon={<Plus className="size-4" />}
            disabled={draft.ranks.length >= 12}
            onClick={() => {
              const last = draft.ranks[draft.ranks.length - 1]
              set('ranks', [...draft.ranks, { id: `rank-${Date.now().toString(36)}`, label: 'SS', title: 'Legend', minLevel: (last?.minLevel ?? 1) + 15, color: '#f0abfc', description: 'A rank beyond the top.', unlocks: '' }])
            }}
          >
            Add rank
          </Button>
        </Panel>

        <Panel title="Focus rewards">
          <div className="grid grid-cols-3 gap-3">
            <Field label="XP per minute">{(id) => <TextInput id={id} type="number" step={0.1} min={0} max={10} value={draft.focus.xpPerMinute} onChange={(e) => set('focus', { ...draft.focus, xpPerMinute: Math.max(0, Number(e.target.value) || 0) })} />}</Field>
            <Field label="Min minutes">{(id) => <TextInput id={id} type="number" min={1} value={draft.focus.minQualifyingMinutes} onChange={(e) => set('focus', { ...draft.focus, minQualifyingMinutes: int(e.target.value, 1) })} />}</Field>
            <Field label="Max XP / session">{(id) => <TextInput id={id} type="number" min={0} value={draft.focus.maxXpPerSession} onChange={(e) => set('focus', { ...draft.focus, maxXpPerSession: int(e.target.value) })} />}</Field>
          </div>
        </Panel>

        <Panel title="Goal & achievement rewards">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Goal completion XP">{(id) => <TextInput id={id} type="number" min={0} value={draft.goalCompletionXp} onChange={(e) => set('goalCompletionXp', int(e.target.value))} />}</Field>
            <Field label="Milestone XP">{(id) => <TextInput id={id} type="number" min={0} value={draft.milestoneXp} onChange={(e) => set('milestoneXp', int(e.target.value))} />}</Field>
          </div>
          <Toggle className="mt-3" checked={draft.achievementXpEnabled} onChange={(v) => set('achievementXpEnabled', v)} label="Achievements award bonus XP" description="Applies to achievements unlocked from now on." />
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset game rules?"
        confirmLabel="Reset rules"
        body={<p>Difficulty rewards, level curve, ranks and reward rules return to their defaults. Your XP ledger, quests and appearance are not touched.</p>}
        onClose={() => setConfirmReset(false)}
        onConfirm={async () => {
          await save(defaultRules())
          setConfirmReset(false)
        }}
      />
    </div>
  )
}
