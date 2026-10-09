import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { pick } from '@/i18n/config';
import { requireUser } from '@/lib/auth/session';
import { getDownloadHistory } from '@/lib/account/queries';
import { formatDate } from '@/lib/format';
import { pageMetadata } from '@/lib/seo/metadata';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { AccountSection } from '../../AccountSection';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.account.downloadsTitle, description: t.account.downloadsSubtitle, path: '/account/downloads', noIndex: true });
}

export default async function DownloadsPage() {
  const { t, locale } = await getI18n();
  await requireUser('/account/downloads');
  const history = await getDownloadHistory();
  return (
    <AccountSection title={t.account.downloadsTitle} subtitle={t.account.downloadsSubtitle}>
      {history.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-surface text-xs text-fg-subtle">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">{t.account.downloadFile}</th>
                <th scope="col" className="px-5 py-3 font-medium">{t.account.downloadDate}</th>
                <th scope="col" className="px-5 py-3 font-medium">{t.account.downloadStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {history.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-4">
                    <p className="text-fg">{row.productTitle ? pick(row.productTitle, locale) : '—'}</p>
                    {row.fileName && <p className="t-mono mt-0.5 text-xs text-fg-subtle">{row.fileName}</p>}
                  </td>
                  <td className="px-5 py-4 text-fg-muted">{formatDate(row.createdAt, locale, 'datetime')}</td>
                  <td className="px-5 py-4">
                    <Badge tone={row.status === 'success' ? 'success' : row.status === 'denied' ? 'warning' : 'danger'}>
                      {t.account.downloadStatuses[row.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title={t.account.downloadsEmpty} />
      )}
    </AccountSection>
  );
}
