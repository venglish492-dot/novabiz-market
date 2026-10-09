'use client';

import Link from 'next/link';
import { ArrowRight, Check, X } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { pick, pickList } from '@/i18n/config';
import { formatDate } from '@/lib/format';
import { LICENSES } from '@/data/licenses';
import { Dialog } from '@/components/ui/Dialog';
import { FormatList } from '@/components/ui/FormatChip';
import { Price } from '@/components/ui/Price';
import { buttonClasses } from '@/components/ui/Button';
import { useUI } from '@/components/providers/UIProvider';
import { ProductPreview } from './ProductPreview';
import { AddToCartButton, WishlistButton } from './ProductActions';

/** Lightweight inspection. The product page remains the canonical, shareable view. */
export function QuickView() {
  const { quickView: product, closeQuickView } = useUI();
  const { t, locale } = useI18n();

  return (
    <Dialog open={Boolean(product)} onClose={closeQuickView} labelledBy="quick-view-title" variant="center">
      {product && (
        <div className="grid md:grid-cols-[1.05fr_1fr]">
          <div className="relative aspect-[4/3] border-b border-line md:aspect-auto md:border-b-0 md:border-r">
            <ProductPreview productType={product.productType} tone={product.tone} label={t.product.previewSchematic} size="hero" />
          </div>
          <div className="flex flex-col p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <p className="t-eyebrow pt-1">
                {pick(product.categoryName, locale)} · {t.product.types[product.productType]}
              </p>
              <button
                type="button"
                onClick={closeQuickView}
                className={buttonClasses({ variant: 'ghost', size: 'icon-sm', className: '-mr-2 -mt-1' })}
                aria-label={t.common.close}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <h2 id="quick-view-title" className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-fg">
              {pick(product.title, locale)}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">{pick(product.shortDescription, locale)}</p>

            <div className="mt-5">
              <FormatList formats={product.formats} max={6} showLabel />
            </div>

            <ul className="mt-5 flex flex-col gap-2">
              {pickList(product.highlights, locale).map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-fg-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <dl className="mt-6 grid grid-cols-3 gap-3 rounded-xl border border-line p-3 text-xs">
              <div>
                <dt className="text-fg-subtle">{t.product.version}</dt>
                <dd className="mt-1 font-medium text-fg">{product.version}</dd>
              </div>
              <div>
                <dt className="text-fg-subtle">{t.product.lastUpdated}</dt>
                <dd className="mt-1 font-medium text-fg">{formatDate(product.lastUpdated, locale, 'month-year')}</dd>
              </div>
              <div>
                <dt className="text-fg-subtle">{t.product.license}</dt>
                <dd className="mt-1 font-medium text-fg">{pick(LICENSES[product.license].name, locale)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-5">
              <Price price={product.price} compareAtAmount={product.compareAtAmount} locale={locale} size="lg" compareLabel={t.product.compareAt} />
              <WishlistButton product={product} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <AddToCartButton product={product} size="lg" openDrawer={false} />
              <Link href={`/products/${product.slug}`} onClick={closeQuickView} className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
                {t.product.viewFull}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
