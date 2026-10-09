import { formatMoney } from '@/lib/format';
import type { Locale } from '@/i18n/config';
import type { Money } from '@/types';

/** Price with an optional compare-at amount, shown only when genuinely configured. */
export function Price({
  price,
  compareAtAmount,
  locale,
  size = 'md',
  compareLabel,
}: {
  price: Money;
  compareAtAmount?: number | null;
  locale: Locale;
  size?: 'sm' | 'md' | 'lg';
  compareLabel?: string;
}) {
  const sizes = { sm: 'text-[15px]', md: 'text-lg', lg: 'text-3xl' } as const;
  const showCompare = typeof compareAtAmount === 'number' && compareAtAmount > price.amount;
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`${sizes[size]} font-semibold tracking-tight tabular-nums text-fg`}>
        {formatMoney(price.amount, price.currency, locale)}
      </span>
      {showCompare && (
        <span className="text-sm text-fg-subtle line-through tabular-nums" title={compareLabel}>
          {compareLabel && <span className="sr-only">{compareLabel}: </span>}
          {formatMoney(compareAtAmount, price.currency, locale)}
        </span>
      )}
    </span>
  );
}
