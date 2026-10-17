import { requireUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getAnalytics, METRIC_DEFINITIONS } from '@/features/analytics/service';
import { getPlatform } from '@/features/socials/platforms';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await requireUser('/dashboard/analytics');
  if (!user.profile) return null;
  const range = Number((await searchParams).range) || 30;
  const db = await getDb();
  const [report, links, widgets] = await Promise.all([
    getAnalytics(user.profile.id, range),
    db.query<{ id: string; label: string; platform: string }>('select id, label, platform from links where profile_id = $1', [user.profile.id]),
    db.query<{ id: string; type: string; config: Record<string, unknown> }>('select id, type, config from widgets where profile_id = $1', [user.profile.id]),
  ]);
  const linkLabels = Object.fromEntries(links.map((l) => [l.id, l.label || getPlatform(l.platform).label]));
  const widgetLabels = Object.fromEntries(widgets.map((w) => [w.id, `${w.type}${typeof w.config.title === 'string' && w.config.title ? ` — ${w.config.title}` : ''}`]));
  return <AnalyticsView report={report} linkLabels={linkLabels} widgetLabels={widgetLabels} definitions={METRIC_DEFINITIONS} />;
}
