'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { interpolate, pick } from '@/i18n/config';
import { formatMoney } from '@/lib/format';
import { FormatList } from '@/components/ui/FormatChip';
import { ProductPreview } from '@/components/products/ProductPreview';
import type { ProductSummary } from '@/lib/catalog/summary';

export function CartLine({ product, onRemove, onNavigate }: { product: ProductSummary; onRemove: () => void; onNavigate?: () => void }) {
  const { t, locale } = useI18n();
  const title = pick(product.title, locale);
  return (
    <li className="flex gap-4 py-4">
      <Link
        href={`/products/${product.slug}`}
        onClick={onNavigate}
        tabIndex={-1}
        aria-hidden
        className="relative h-[72px] w-[88px] shrink-0 overflow-hidden rounded-xl border border-line"
      >
        <ProductPreview productType={product.productType} tone={product.tone} label="" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/products/${product.slug}`} onClick={onNavigate} className="text-sm font-medium leading-snug text-fg hover:underline">
            {title}
          </Link>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">
            {formatMoney(product.price.amount, product.price.currency, locale)}
          </span>
        </div>
        <p className="mt-1 text-xs text-fg-subtle">{t.cart.oneLicense}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <FormatList formats={product.formats} max={3} />
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-fg-subtle transition-colors hover:bg-danger-soft hover:text-danger"
            aria-label={interpolate(t.cart.removeItem, { title })}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            {t.cart.remove}
          </button>
        </div>
      </div>
    </li>
  );
}
