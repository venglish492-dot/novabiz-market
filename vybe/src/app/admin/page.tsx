import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { resolveReportAction, setMediaPrivateAction, setProfileFlagAction } from '@/app/actions/community';
import { Logo } from '@/components/ui/Logo';

export const metadata: Metadata = { title: 'Moderation', robots: { index: false } };
export const dynamic = 'force-dynamic';

type ReportRow = { id: string; target_type: 'profile' | 'media'; target_id: string; reason: string; details: string; created_at: Date; username: string | null; profile_id: string | null };
type ProfileRow = { id: string; username: string; is_published: boolean; is_verified: boolean; is_featured: boolean; suspended_at: Date | null; is_demo: boolean; view_count: number };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = String((await searchParams).q ?? '').trim().toLowerCase().slice(0, 40);
  const db = await getDb();
  const [reports, profiles, counts] = await Promise.all([
    db.query<ReportRow>(
      `select r.id, r.target_type, r.target_id, r.reason, r.details, r.created_at,
              coalesce(p.username, mp.username) as username, coalesce(p.id, mp.id) as profile_id
         from reports r
         left join profiles p on r.target_type = 'profile' and p.id = r.target_id
         left join assets a on r.target_type = 'media' and a.id = r.target_id
         left join profiles mp on mp.user_id = a.user_id
        where r.status = 'open' order by r.created_at desc limit 100`,
    ),
    db.query<ProfileRow>(
      `select id, username, is_published, is_verified, is_featured, suspended_at, is_demo, view_count from profiles
        where ($1 = '' or lower(username) like '%' || $1 || '%') order by created_at desc limit 50`,
      [q],
    ),
    db.one<{ users: number; published: number; open: number }>(
      `select (select count(*) from users)::int as users, (select count(*) from profiles where is_published)::int as published, (select count(*) from reports where status = 'open')::int as open`,
    ),
  ]);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            Back to dashboard
          </Link>
        </div>
      </header>
      <main id="main" className="container-page space-y-10 py-10">
        <h1 className="text-3xl font-bold">Moderation</h1>
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            ['Accounts', counts?.users ?? 0],
            ['Published profiles', counts?.published ?? 0],
            ['Open reports', counts?.open ?? 0],
          ].map(([label, value]) => (
            <div key={label as string} className="card p-5">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-1 font-display text-3xl font-bold">{value}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="reports">
          <h2 id="reports" className="text-xl font-semibold">Open reports</h2>
          {reports.length === 0 ? (
            <p className="mt-4 text-muted">No open reports.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {reports.map((report) => (
                <li key={report.id} className="card p-5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="chip">{report.target_type}</span>
                    <span className="chip !text-rose-200">{report.reason}</span>
                    {report.username && (
                      <Link href={report.target_type === 'media' ? `/media/${report.target_id}` : `/@${report.username}`} className="font-semibold text-lavender hover:underline" target="_blank">
                        {report.target_type === 'media' ? `file by @${report.username}` : `@${report.username}`}
                      </Link>
                    )}
                    <span className="ml-auto text-xs text-faint">{report.created_at.toLocaleString()}</span>
                  </div>
                  {report.details && <p className="mt-3 whitespace-pre-line text-sm text-muted">{report.details}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {report.profile_id && report.target_type === 'profile' && (
                      <form action={setProfileFlagAction.bind(null, report.profile_id, 'suspended', true)}>
                        <button className="btn btn-danger btn-sm">Suspend profile</button>
                      </form>
                    )}
                    {report.target_type === 'media' && (
                      <form action={setMediaPrivateAction.bind(null, report.target_id)}>
                        <button className="btn btn-danger btn-sm">Make file private</button>
                      </form>
                    )}
                    <form action={resolveReportAction.bind(null, report.id, 'resolved')}>
                      <button className="btn btn-secondary btn-sm">Mark resolved</button>
                    </form>
                    <form action={resolveReportAction.bind(null, report.id, 'dismissed')}>
                      <button className="btn btn-ghost btn-sm">Dismiss</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="profiles">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="profiles" className="text-xl font-semibold">Profiles</h2>
            <form className="flex gap-2">
              <label htmlFor="q" className="sr-only">Search usernames</label>
              <input id="q" name="q" defaultValue={q} placeholder="Search usernames" className="input !min-h-10" />
              <button className="btn btn-secondary btn-sm">Search</button>
            </form>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-white/[0.03] text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="p-3 font-medium">Profile</th>
                  <th scope="col" className="p-3 font-medium">Status</th>
                  <th scope="col" className="p-3 font-medium">Views</th>
                  <th scope="col" className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3">
                      <Link href={`/@${p.username}`} className="font-semibold hover:underline" target="_blank">@{p.username}</Link>
                      {p.is_demo && <span className="chip ml-2 !py-0 text-[10px]">Demo</span>}
                    </td>
                    <td className="p-3 text-xs text-muted">
                      {[p.is_published ? 'published' : 'draft', p.is_verified && 'verified', p.is_featured && 'featured', p.suspended_at && 'SUSPENDED'].filter(Boolean).join(' · ')}
                    </td>
                    <td className="p-3 font-mono text-xs">{p.view_count}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        <form action={setProfileFlagAction.bind(null, p.id, 'verified', !p.is_verified)}>
                          <button className="btn btn-ghost btn-sm !min-h-8">{p.is_verified ? 'Unverify' : 'Verify'}</button>
                        </form>
                        <form action={setProfileFlagAction.bind(null, p.id, 'featured', !p.is_featured)}>
                          <button className="btn btn-ghost btn-sm !min-h-8">{p.is_featured ? 'Unfeature' : 'Feature'}</button>
                        </form>
                        <form action={setProfileFlagAction.bind(null, p.id, 'suspended', !p.suspended_at)}>
                          <button className="btn btn-ghost btn-sm !min-h-8">{p.suspended_at ? 'Unsuspend' : 'Suspend'}</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
