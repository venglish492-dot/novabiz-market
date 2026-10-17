import { requireUser } from '@/lib/auth/session';
import { getAnalytics } from '@/features/analytics/service';
import { OverviewSection } from '@/components/editor/sections/OverviewSection';

export default async function DashboardPage() {
  const user = await requireUser('/dashboard');
  const report = user.profile ? await getAnalytics(user.profile.id, 7) : null;
  return <OverviewSection stats={{ views: report?.totals.views ?? 0, clicks: report?.totals.clicks ?? 0, allTime: report?.totals.allTimeViews ?? 0 }} />;
}
