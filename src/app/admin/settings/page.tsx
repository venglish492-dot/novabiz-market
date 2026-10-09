import { requireAdmin } from '@/lib/auth/session';
import { features, publicSupabase, siteConfig } from '@/lib/config/site';
import { serverConfig } from '@/lib/config/server';
import { isCheckoutAvailable } from '@/lib/payments';
import { Badge } from '@/components/ui/Badge';
import { AdminPage, Panel } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

/** Read-only configuration status. Secrets are never rendered. */
export default async function AdminSettingsPage() {
  await requireAdmin();
  const { a } = await getAdminI18n();
  const rows: Array<[string, boolean | string]> = [
    [a.settings.siteUrl, siteConfig.url],
    [a.settings.supabase, publicSupabase.configured],
    [a.settings.supabaseAdmin, serverConfig.supabase.adminConfigured],
    [a.settings.stripe, serverConfig.stripe.configured],
    [a.settings.sandbox, serverConfig.sandbox.enabled],
    [a.settings.email, serverConfig.email.configured],
    [a.settings.reviews, features.reviews],
    [a.settings.newsletter, features.newsletter],
    [a.settings.analytics, features.analytics],
    [a.settings.buckets, `${serverConfig.storage.filesBucket} (private) · ${serverConfig.storage.mediaBucket} (public)`],
  ];
  const checkout = isCheckoutAvailable();
  return (
    <AdminPage title={a.nav.settings} description={a.settings.intro}>
      <Panel title={a.settings.checkout}>
        <p className={`text-sm ${checkout ? 'text-success' : 'text-warning'}`}>{checkout ? a.settings.available : a.settings.unavailable}</p>
      </Panel>
      <dl className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 bg-surface px-5 py-3.5 text-sm">
            <dt className="text-fg-muted">{label}</dt>
            <dd>
              {typeof value === 'boolean' ? (
                <Badge tone={value ? 'success' : 'neutral'}>{value ? a.settings.configured : a.settings.missing}</Badge>
              ) : (
                <span className="t-mono text-xs text-fg">{value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </AdminPage>
  );
}
