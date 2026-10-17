'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import type { AnalyticsReport } from '@/features/analytics/service';

/* Palette validated with the dataviz validator against the dark surface (#10131d): all checks pass. */
const SERIES = [
  { key: 'views', label: 'Views', color: '#b65cff' },
  { key: 'clicks', label: 'Clicks', color: '#259c8b' },
] as const;
const BAR = '#b65cff';

const fmt = (n: number) => new Intl.NumberFormat('en').format(Math.round(n));
const RANGES = [7, 30, 90, 365];

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function TimeSeries({ series }: { series: AnalyticsReport['series'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 720;
  const H = 240;
  const pad = { l: 40, r: 64, t: 12, b: 28 };
  const max = niceMax(Math.max(1, ...series.map((d) => Math.max(d.views, d.clicks))));
  const x = (i: number) => pad.l + (series.length <= 1 ? 0 : (i / (series.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, max / 2, max];
  const labelEvery = Math.ceil(series.length / 6);
  const path = (key: 'views' | 'clicks') => series.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(' ');
  const last = series[series.length - 1];

  const onMove = (event: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  };
  const h = hover !== null ? series[hover] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Views and clicks per day over ${series.length} days`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setHover((v) => Math.min(series.length - 1, (v ?? -1) + 1));
          if (e.key === 'ArrowLeft') setHover((v) => Math.max(0, (v ?? series.length) - 1));
        }}
        onBlur={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.07)" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6b7287">
              {fmt(t)}
            </text>
          </g>
        ))}
        {series.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.day} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#6b7287">
              {new Date(`${d.day}T00:00:00Z`).toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
            </text>
          ) : null,
        )}
        {SERIES.map((s) => (
          <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {/* Direct labels at the line ends (text in text colour; the dot carries identity). */}
        {last &&
          SERIES.map((s, i) => (
            <g key={s.key}>
              <circle cx={x(series.length - 1)} cy={y(last[s.key])} r="4" fill={s.color} stroke="#10131d" strokeWidth="2" />
              <text x={x(series.length - 1) + 8} y={y(last[s.key]) + 4 + (i === 1 && Math.abs(y(last.views) - y(last.clicks)) < 12 ? 12 : 0)} fontSize="11" fill="#a2a8ba">
                {s.label}
              </text>
            </g>
          ))}
        {h && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="rgb(255 255 255 / 0.35)" strokeWidth="1" />
            {SERIES.map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(h[s.key])} r="4.5" fill={s.color} stroke="#10131d" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-xl border border-line-strong bg-[#0b0d16]/95 px-3 py-2 text-xs shadow-xl"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > series.length / 2 ? 'calc(-100% - 12px)' : '12px'})` }}
          role="status"
        >
          <p className="mb-1 text-muted">{new Date(`${h.day}T00:00:00Z`).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</p>
          {SERIES.map((s) => (
            <p key={s.key} className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded" style={{ background: s.color }} aria-hidden />
              <span className="font-semibold tabular-nums text-text">{fmt(h[s.key])}</span>
              <span className="text-muted">{s.label.toLowerCase()}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function BarList({ title, rows, empty, note }: { title: string; rows: { label: string; value: number }[]; empty: string; note?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="card p-5" aria-label={title}>
      <h3 className="font-semibold">{title}</h3>
      {note && <p className="hint mt-0.5">{note}</p>}
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {rows.map((row) => (
            <li key={row.label} title={`${row.label}: ${fmt(row.value)}`}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{row.label}</span>
                <span className="font-mono text-xs tabular-nums text-muted">{fmt(row.value)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full" style={{ width: `${Math.max(2, (row.value / max) * 100)}%`, background: BAR }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AnalyticsView({ report, linkLabels, widgetLabels, definitions }: { report: AnalyticsReport; linkLabels: Record<string, string>; widgetLabels: Record<string, string>; definitions: Record<'views' | 'clicks' | 'ctr', string> }) {
  const [showTable, setShowTable] = useState(false);
  const t = report.totals;
  const empty = t.views === 0 && t.clicks === 0;
  const tiles = useMemo(
    () => [
      { label: 'Views', value: fmt(t.views), note: definitions.views },
      { label: 'Link clicks', value: fmt(t.clicks), note: definitions.clicks },
      { label: 'Click-through rate', value: t.ctr === null ? '—' : `${(t.ctr * 100).toFixed(1)}%`, note: definitions.ctr },
      { label: 'Daily average views', value: t.dailyAverage < 10 ? t.dailyAverage.toFixed(1) : fmt(t.dailyAverage), note: `Views ÷ ${report.rangeDays} days.` },
    ],
    [t, report.rangeDays, definitions],
  );

  return (
    <div className="space-y-6">
      <nav aria-label="Date range" className="flex flex-wrap items-center gap-2">
        {RANGES.map((days) => (
          <Link
            key={days}
            href={`/dashboard/analytics?range=${days}`}
            scroll={false}
            aria-current={report.rangeDays === days ? 'page' : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${report.rangeDays === days ? 'border-primary/60 bg-primary/15 text-text' : 'border-line text-muted hover:text-text'}`}
          >
            {days === 365 ? 'Last 12 months' : `Last ${days} days`}
          </Link>
        ))}
        <span className="ml-auto text-xs text-faint">All-time views: {fmt(t.allTimeViews)}</span>
      </nav>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Totals">
        {tiles.map((tile) => (
          <div key={tile.label} className="card p-5">
            <p className="text-sm text-muted">{tile.label}</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{tile.value}</p>
            <p className="mt-2 text-xs leading-snug text-faint">{tile.note}</p>
          </div>
        ))}
      </section>

      <section className="card p-5" aria-labelledby="trend">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="trend" className="font-semibold">
            Views & clicks per day
          </h2>
          <div className="flex items-center gap-4 text-xs text-muted">
            {SERIES.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded" style={{ background: s.color }} aria-hidden /> {s.label}
              </span>
            ))}
            <button type="button" className="btn btn-ghost btn-sm !min-h-8" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
              {showTable ? 'Hide table' : 'Show table'}
            </button>
          </div>
        </div>
        {empty && <p className="mb-3 text-sm text-muted">No visits in this period yet. Publish your page and share your link — data appears here as people visit.</p>}
        <TimeSeries series={report.series} />
        {showTable && (
          <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <caption className="sr-only">Daily views and clicks</caption>
              <thead className="sticky top-0 bg-[#10131d] text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Day</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Views</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono text-xs tabular-nums">
                {[...report.series].reverse().map((d) => (
                  <tr key={d.day}>
                    <td className="px-3 py-1.5">{d.day}</td>
                    <td className="px-3 py-1.5 text-right">{d.views}</td>
                    <td className="px-3 py-1.5 text-right">{d.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Most clicked links" rows={report.topLinks.map((r) => ({ label: linkLabels[r.id] ?? 'Removed link', value: r.clicks }))} empty="No link clicks yet." />
        <BarList title="Top referrers" rows={report.referrers.map((r) => ({ label: r.host, value: r.views }))} empty="No referrer data yet." note="Where visitors came from (domain only)." />
        <BarList title="Devices" rows={report.devices.map((r) => ({ label: r.device.charAt(0).toUpperCase() + r.device.slice(1), value: r.views }))} empty="No device data yet." />
        <BarList
          title="Countries"
          rows={report.countries.map((r) => ({ label: new Intl.DisplayNames(['en'], { type: 'region' }).of(r.country) ?? r.country, value: r.views }))}
          empty="Country data appears only when your hosting provider supplies a coarse country header. Exact locations are never collected."
        />
        <BarList title="Popular widgets" rows={report.topWidgets.map((r) => ({ label: widgetLabels[r.id] ?? 'Removed widget', value: r.interactions }))} empty="No widget interactions yet." note="Plays, opens and clicks inside widgets." />
      </div>
    </div>
  );
}
