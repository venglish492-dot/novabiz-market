import { useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, Table2 } from 'lucide-react'
import { getDb } from '@/db/database'
import { useApp } from '@/store/app'
import { useAttributes, useCategoryMap } from '@/hooks/useData'
import { useToday } from '@/hooks/useToday'
import { useMotion } from '@/hooks/useMotion'
import { Panel } from '@/components/ui/Panel'
import { Segmented } from '@/components/ui/Tabs'
import { EmptyState, LoadingBlock, SectionTitle, Stat } from '@/components/ui/Misc'
import { addDays, dateRange, daysBetween, formatDateKey, parseDateKey, weekStartKey } from '@/lib/dates'
import { formatMinutes, formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'

type Period = '7' | '30' | '90' | '365' | 'all'

const axisProps = { stroke: 'var(--rs-muted)', fontSize: 11, tickLine: false, axisLine: false } as const

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string; unit: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-surface2 px-3 py-2 text-xs shadow-xl">
      <p className="text-muted">{label}</p>
      <p className="num text-sm text-fg">
        {formatNumber(payload[0].value)} {unit}
      </p>
    </div>
  )
}

function ChartPanel({ title, summary, table, children, empty }: { title: string; summary: string; table: Array<[string, string]>; children: ReactNode; empty?: boolean }) {
  const [showTable, setShowTable] = useState(false)
  return (
    <Panel
      title={title}
      actions={
        !empty && (
          <button type="button" onClick={() => setShowTable((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted hover:bg-accent/10 hover:text-fg" aria-pressed={showTable}>
            {showTable ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
            {showTable ? 'Chart' : 'Table'}
          </button>
        )
      }
    >
      {empty ? (
        <EmptyState title="Not enough history yet" body="This chart fills in from your real records. Nothing is estimated or invented." />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">{summary}</p>
          {showTable ? (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {table.map(([k, v]) => (
                    <tr key={k} className="border-b border-line/40">
                      <td className="py-1 text-muted">{k}</td>
                      <td className="num py-1 text-right">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-56" role="img" aria-label={summary}>
              {children}
            </div>
          )}
        </>
      )}
    </Panel>
  )
}

export default function ReportsView() {
  const today = useToday()
  const weekStart = useApp((s) => s.settings.general.weekStart)
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const categories = useCategoryMap()
  const attributes = useAttributes(true)
  const [period, setPeriod] = useState<Period>('30')
  const animate = useMotion().level !== 'minimal'

  const data = useLiveQuery(async () => {
    const db = getDb()
    const [completions, focus, ledger, goals, achievements, quests] = await Promise.all([db.completions.toArray(), db.focusSessions.toArray(), db.ledger.toArray(), db.goals.toArray(), db.achievements.toArray(), db.quests.count()])
    return { completions, focus, ledger, goals, achievements, quests }
  }, [])

  const report = useMemo(() => {
    if (!data) return null
    const allDates = [...data.completions.map((c) => c.dateKey), ...data.ledger.map((e) => e.dateKey), ...data.focus.map((f) => f.dateKey)].sort()
    const first = allDates[0] ?? today
    const start = period === 'all' ? first : addDays(today, -(Number(period) - 1))
    const days = dateRange(start < today ? start : today, today)
    const inRange = (d: string) => d >= days[0] && d <= today
    const completions = data.completions.filter((c) => inRange(c.dateKey))
    const focus = data.focus.filter((f) => inRange(f.dateKey) && f.status === 'completed' && f.phase === 'focus')
    const ledger = data.ledger.filter((e) => inRange(e.dateKey))
    const label = (d: string) => (days.length > 120 ? parseDateKey(d).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : parseDateKey(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))

    const perDay = days.map((d) => ({ date: d, label: label(d), quests: completions.filter((c) => c.dateKey === d).length }))
    let running = data.ledger.filter((e) => e.dateKey < days[0]).reduce((n, e) => n + e.amount, 0)
    const xpSeries = days.map((d) => {
      running += ledger.filter((e) => e.dateKey === d).reduce((n, e) => n + e.amount, 0)
      return { date: d, label: label(d), xp: running }
    })
    const weekMap = new Map<string, number>()
    for (const d of days) weekMap.set(weekStartKey(d, weekStart), 0)
    for (const f of focus) {
      const w = weekStartKey(f.dateKey, weekStart)
      weekMap.set(w, (weekMap.get(w) ?? 0) + Math.floor(f.actualSeconds / 60))
    }
    const focusWeeks = [...weekMap.entries()].map(([w, minutes]) => ({ week: w, label: `Wk ${formatDateKey(w, 'locale').replace(/,? \d{4}$/, '')}`, minutes }))
    const catCounts = new Map<string, number>()
    for (const c of completions) catCounts.set(c.categoryId, (catCounts.get(c.categoryId) ?? 0) + 1)
    const byCategory = [...catCounts.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, name: categories.get(id)?.name ?? id, color: categories.get(id)?.color ?? '#94a3b8', n }))
    const attrTotals = new Map<string, number>()
    for (const e of ledger) for (const [k, v] of Object.entries(e.attributes)) attrTotals.set(k, (attrTotals.get(k) ?? 0) + v)
    const xpInPeriod = ledger.reduce((n, e) => n + e.amount, 0)
    const focusMinutes = focus.reduce((n, f) => n + Math.floor(f.actualSeconds / 60), 0)
    const activeDays = new Set([...completions.map((c) => c.dateKey), ...focus.map((f) => f.dateKey)]).size
    const achievementsInPeriod = data.achievements.filter((a) => inRange(a.unlockedAt.slice(0, 10))).length
    // long-term activity: last 26 weeks
    const heatStart = weekStartKey(addDays(today, -7 * 25), weekStart)
    const heat = dateRange(heatStart, today).map((d) => ({ d, n: data.completions.filter((c) => c.dateKey === d).length }))
    return { days, perDay, xpSeries, focusWeeks, byCategory, attrTotals, xpInPeriod, focusMinutes, activeDays, completions, achievementsInPeriod, heat, heatStart }
  }, [data, period, today, weekStart, categories])

  if (!data || !report) return <LoadingBlock rows={6} label="Loading reports" />

  const noData = data.completions.length === 0 && data.focus.length === 0 && data.ledger.length === 0
  const bestDay = report.perDay.reduce((best, d) => (d.quests > best.quests ? d : best), report.perDay[0])
  const goalsDone = data.goals.filter((g) => g.status === 'completed').length
  const goalsOpen = data.goals.filter((g) => g.status === 'active' || g.status === 'paused').length
  const maxHeat = Math.max(1, ...report.heat.map((h) => h.n))

  return (
    <div>
      <SectionTitle
        eyebrow="Insights"
        title="Progress Reports"
        description="Built only from your stored records. Charts describe what happened — they don't claim why."
        actions={<Segmented label="Period" value={period} onChange={setPeriod} options={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: '90', label: '90 days' }, { value: '365', label: 'Year' }, { value: 'all', label: 'All' }]} />}
      />
      {noData ? (
        <EmptyState icon={<BarChart3 className="size-6" />} title="Your reports will appear here" body="Complete quests and focus sessions; charts are drawn from those real records only." />
      ) : (
        <>
          <div className="mb-gap grid grid-cols-2 gap-2 md:grid-cols-5">
            <Stat label="Quests completed" value={formatNumber(report.completions.length)} />
            <Stat label="XP earned" value={formatNumber(report.xpInPeriod)} />
            <Stat label="Focus" value={formatMinutes(report.focusMinutes)} />
            <Stat label="Active days" value={`${report.activeDays} / ${report.days.length}`} />
            <Stat label="Achievements" value={report.achievementsInPeriod} hint={`${data.achievements.length} total`} />
          </div>
          <div className="grid gap-gap lg:grid-cols-2">
            <ChartPanel
              title="Quests completed by day"
              empty={report.completions.length === 0}
              summary={`${report.completions.length} quests completed over ${report.days.length} days${bestDay?.quests ? `; the busiest day was ${formatDateKey(bestDay.date, dateFormat)} with ${bestDay.quests}` : ''}.`}
              table={report.perDay.filter((d) => d.quests).map((d) => [formatDateKey(d.date, dateFormat), String(d.quests)])}
            >
              <ResponsiveContainer>
                <BarChart data={report.perDay} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--rs-border)" strokeOpacity={0.5} />
                  <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                  <YAxis allowDecimals={false} {...axisProps} />
                  <Tooltip cursor={{ fill: 'var(--rs-accent)', fillOpacity: 0.08 }} content={<ChartTooltip unit="quests" />} />
                  <Bar isAnimationActive={animate} dataKey="quests" fill="var(--rs-accent)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel
              title="Lifetime XP over time"
              empty={data.ledger.length === 0}
              summary={`Lifetime XP went from ${formatNumber(report.xpSeries[0]?.xp ?? 0)} to ${formatNumber(report.xpSeries[report.xpSeries.length - 1]?.xp ?? 0)} in this period.`}
              table={report.xpSeries.filter((_, i, a) => i === a.length - 1 || i % Math.max(1, Math.floor(a.length / 20)) === 0).map((d) => [formatDateKey(d.date, dateFormat), formatNumber(d.xp)])}
            >
              <ResponsiveContainer>
                <AreaChart data={report.xpSeries} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="var(--rs-accent)" stopOpacity={0.35} />
                      <stop offset="1" stopColor="var(--rs-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--rs-border)" strokeOpacity={0.5} />
                  <XAxis dataKey="label" {...axisProps} minTickGap={28} />
                  <YAxis {...axisProps} />
                  <Tooltip content={<ChartTooltip unit="XP" />} cursor={{ stroke: 'var(--rs-accent)', strokeOpacity: 0.4 }} />
                  <Area isAnimationActive={animate} type="monotone" dataKey="xp" stroke="var(--rs-accent)" strokeWidth={2} fill="url(#xpFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel
              title="Focus minutes by week"
              empty={report.focusMinutes === 0}
              summary={`${formatMinutes(report.focusMinutes)} of completed focus across ${report.focusWeeks.length} weeks.`}
              table={report.focusWeeks.map((w) => [formatDateKey(w.week, dateFormat), formatMinutes(w.minutes)])}
            >
              <ResponsiveContainer>
                <BarChart data={report.focusWeeks} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--rs-border)" strokeOpacity={0.5} />
                  <XAxis dataKey="label" {...axisProps} minTickGap={16} />
                  <YAxis allowDecimals={false} {...axisProps} />
                  <Tooltip cursor={{ fill: 'var(--rs-accent)', fillOpacity: 0.08 }} content={<ChartTooltip unit="min" />} />
                  <Bar isAnimationActive={animate} dataKey="minutes" fill="var(--rs-accent2)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <Panel title="Category distribution">
              {report.byCategory.length === 0 ? (
                <EmptyState title="No completed quests in this period" />
              ) : (
                <>
                  <p className="mb-3 text-sm text-muted">
                    Most completions were in {report.byCategory[0].name} ({report.byCategory[0].n} of {report.completions.length}).
                  </p>
                  <ul className="space-y-2">
                    {report.byCategory.map((c) => (
                      <li key={c.id} className="text-sm">
                        <div className="mb-1 flex justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span className="size-2.5 rounded-sm" style={{ background: c.color }} />
                            {c.name}
                          </span>
                          <span className="num text-muted">
                            {c.n} · {Math.round((c.n / report.completions.length) * 100)}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface2">
                          <div className="h-full rounded-full" style={{ width: `${(c.n / report.byCategory[0].n) * 100}%`, background: c.color }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>

            <Panel title="Attribute growth in this period">
              {report.attrTotals.size === 0 ? (
                <EmptyState title="No attribute points in this period" />
              ) : (
                <ul className="space-y-2">
                  {(attributes ?? [])
                    .filter((a) => (report.attrTotals.get(a.id) ?? 0) !== 0)
                    .map((a) => {
                      const v = report.attrTotals.get(a.id) ?? 0
                      const max = Math.max(...report.attrTotals.values())
                      return (
                        <li key={a.id} className="text-sm">
                          <div className="mb-1 flex justify-between">
                            <span>
                              <span className="num font-semibold" style={{ color: a.color }}>
                                {a.abbr}
                              </span>{' '}
                              <span className="text-muted">{a.name}</span>
                            </span>
                            <span className="num">+{formatNumber(v)}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-surface2">
                            <div className="h-full rounded-full" style={{ width: `${Math.max(2, (v / max) * 100)}%`, background: a.color }} />
                          </div>
                        </li>
                      )
                    })}
                </ul>
              )}
              <p className="mt-3 text-xs text-muted">Gamified tracking scores — not measurements of ability.</p>
            </Panel>

            <Panel title="Goals">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Completed" value={goalsDone} />
                <Stat label="In progress" value={goalsOpen} />
              </div>
              <p className="mt-3 text-sm text-muted">{data.goals.length ? `${Math.round((goalsDone / Math.max(1, goalsDone + goalsOpen)) * 100)}% of your non-archived goals are complete.` : 'No goals yet.'}</p>
            </Panel>
          </div>

          <Panel title="Long-term activity (26 weeks)" className="mt-gap">
            <p className="mb-3 text-sm text-muted">Each square is one day; brighter means more completed quests. Empty days are simply empty — rest is fine.</p>
            <div className="overflow-x-auto">
              <div className="grid w-max grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`Activity over 26 weeks: ${report.heat.filter((h) => h.n).length} active days`}>
                {report.heat.map((h) => (
                  <span
                    key={h.d}
                    title={`${formatDateKey(h.d, dateFormat)}: ${h.n} quests`}
                    className={cn('size-3 rounded-[3px]', daysBetween(h.d, today) < 0 && 'opacity-0')}
                    style={{ background: h.n ? `color-mix(in srgb, var(--rs-accent) ${25 + (h.n / maxHeat) * 75}%, var(--rs-surface2))` : 'var(--rs-surface2)' }}
                  />
                ))}
              </div>
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
