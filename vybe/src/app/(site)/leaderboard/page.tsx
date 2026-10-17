import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/marketing/PageHeader';
import { leaderboard } from '@/features/profiles/service';

export const metadata: Metadata = { title: 'Leaderboard', description: 'The most visited public VYBE profiles.', alternates: { canonical: '/leaderboard' } };
export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const period = (await searchParams).period === '30d' ? '30d' : 'all';
  const rows = await leaderboard(period, 50);
  return (
    <>
      <PageHeader eyebrow="Leaderboard" title="Most visited profiles." description="Ranked by unique views — each visitor counts at most once per profile per day. Bots and owners’ own visits are excluded.">
        <nav aria-label="Period" className="mt-8 inline-flex rounded-full border border-line bg-white/[0.03] p-1">
          {[
            ['all', 'All time'],
            ['30d', 'Last 30 days'],
          ].map(([value, label]) => (
            <Link key={value} href={value === 'all' ? '/leaderboard' : '/leaderboard?period=30d'} aria-current={period === value ? 'page' : undefined} className={`rounded-full px-4 py-2 text-sm font-semibold ${period === value ? 'bg-primary/25 text-text' : 'text-muted hover:text-text'}`}>
              {label}
            </Link>
          ))}
        </nav>
      </PageHeader>
      <div className="container-page py-12">
        {rows.length === 0 ? (
          <p className="card p-10 text-center text-muted">No ranked profiles for this period yet. Rankings fill in as people visit published pages.</p>
        ) : (
          <ol className="divide-y divide-line overflow-hidden rounded-3xl border border-line">
            {rows.map((row, i) => (
              <li key={row.username}>
                <Link href={`/@${row.username}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]">
                  <span className={`w-8 text-center font-mono text-sm font-bold ${i < 3 ? 'text-lavender' : 'text-faint'}`}>{i + 1}</span>
                  {row.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user media
                    <img src={row.avatarUrl} alt="" className="size-11 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex size-11 items-center justify-center rounded-full font-bold" style={{ background: row.accent }}>{row.displayName.slice(0, 1)}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="truncate">{row.displayName}</span>
                      {row.isDemo && <span className="chip !py-0 text-[10px]">Demo</span>}
                    </span>
                    <span className="block truncate font-mono text-xs text-muted">@{row.username}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-display font-semibold">{new Intl.NumberFormat('en').format(row.score)}</span>
                    <span className="text-xs text-faint">views</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
