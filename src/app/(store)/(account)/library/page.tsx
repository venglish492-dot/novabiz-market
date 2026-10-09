import type { Metadata } from 'next';
import Link from 'next/link';
import { FlaskConical, Library } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { interpolate, pick } from '@/i18n/config';
import { requireUser } from '@/lib/auth/session';
import { getLibrary } from '@/lib/account/queries';
import { getCatalog } from '@/lib/catalog/repository';
import { rootCategoryOf } from '@/lib/catalog/queries';
import { formatBytes, formatDate } from '@/lib/format';
import { pageMetadata } from '@/lib/seo/metadata';
import { features } from '@/lib/config/site';
import { LICENSES } from '@/data/licenses';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Notice } from '@/components/ui/Notice';
import { FormatList } from '@/components/ui/FormatChip';
import { ProductPreview } from '@/components/products/ProductPreview';
import { DownloadButton } from '@/components/account/DownloadButton';
import { AccountSection } from '../AccountSection';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.library.title, description: t.library.subtitle, path: '/library', noIndex: true });
}

export default async function LibraryPage() {
  const { t, locale } = await getI18n();
  const user = await requireUser('/library');
  const [items, { categories }] = await Promise.all([getLibrary(user.id), getCatalog()]);

  return (
    <AccountSection title={t.library.title} subtitle={t.library.subtitle}>
      {items.length === 0 ? (
        <EmptyState
          icon={<Library className="h-5 w-5" />}
          title={t.library.empty}
          body={t.library.emptyBody}
          action={<ButtonLink href="/products">{t.library.browse}</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-5">
          {items.map((item) => {
            const product = item.product;
            const tone = rootCategoryOf(categories, product.categoryId)?.tone ?? 'business';
            const currentFiles = item.files.filter((file) => file.isCurrent);
            const previousFiles = item.files.filter((file) => !file.isCurrent);
            const license = LICENSES[item.license] ?? LICENSES.commercial;
            return (
              <li key={product.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="grid sm:grid-cols-[220px_1fr]">
                  <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden className="relative block aspect-[4/3] border-b border-line sm:aspect-auto sm:border-b-0 sm:border-r">
                    <ProductPreview productType={product.productType} tone={tone} label="" />
                  </Link>
                  <div className="flex flex-col p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link href={`/products/${product.slug}`} className="text-lg font-semibold tracking-tight text-fg hover:underline">
                          {pick(product.title, locale)}
                        </Link>
                        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-subtle">
                          <span>{interpolate(t.library.version, { version: product.version })}</span>
                          <span>{interpolate(t.library.updated, { date: formatDate(product.lastUpdated, locale, 'month-year') })}</span>
                          <span>{interpolate(t.library.purchased, { date: formatDate(item.purchasedAt, locale, 'short') })}</span>
                          <span className="t-mono">{interpolate(t.library.order, { order: item.orderNumber })}</span>
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {item.isTest && (
                          <Badge tone="warning">
                            <FlaskConical className="h-3 w-3" aria-hidden />
                            {t.library.testOrder}
                          </Badge>
                        )}
                        <Badge tone="accent">{interpolate(t.library.license, { license: pick(license.name, locale) })}</Badge>
                      </div>
                    </div>
                    <div className="mt-4">
                      <FormatList formats={product.formats} max={6} />
                    </div>

                    <div className="mt-5 border-t border-line pt-5">
                      <p className="t-eyebrow mb-3">{t.library.files}</p>
                      {currentFiles.length ? (
                        <ul className="flex flex-col gap-2">
                          {currentFiles.map((file) => (
                            <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm text-fg">{pick(file.label, locale) || file.fileName}</p>
                                <p className="t-mono mt-0.5 text-[11px] text-fg-subtle">
                                  {file.fileName ?? ''} {file.sizeBytes ? `· ${formatBytes(file.sizeBytes, locale)}` : ''} · v{file.version}
                                </p>
                              </div>
                              <DownloadButton
                                fileId={file.id}
                                productId={product.id}
                                external={file.kind === 'external_link'}
                                label={file.kind === 'external_link' ? t.library.openWorkspace : t.library.download}
                              />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Notice tone="info">{t.library.filesPending}</Notice>
                      )}
                      {previousFiles.length > 0 && (
                        <details className="mt-3 text-sm">
                          <summary className="text-fg-subtle hover:text-fg">{t.product.changelog}</summary>
                          <ul className="mt-2 flex flex-col gap-2">
                            {previousFiles.map((file) => (
                              <li key={file.id} className="flex items-center justify-between gap-3 text-xs text-fg-muted">
                                <span>
                                  v{file.version} · {file.fileName}
                                </span>
                                <DownloadButton fileId={file.id} productId={product.id} label={t.library.downloadAgain} external={file.kind === 'external_link'} />
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>

                    {product.changelog.length > 0 && (
                      <div className="mt-5 border-t border-line pt-5">
                        <p className="t-eyebrow mb-2">{t.library.changelog}</p>
                        <p className="text-sm text-fg-muted">
                          <span className="text-fg">{product.changelog[0].version}</span> — {pick(product.changelog[0].notes, locale)}
                        </p>
                      </div>
                    )}
                    {features.reviews && (
                      <Link href={`/products/${product.slug}#reviews`} className="mt-5 self-start text-sm text-accent hover:underline">
                        {t.library.writeReview}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AccountSection>
  );
}
