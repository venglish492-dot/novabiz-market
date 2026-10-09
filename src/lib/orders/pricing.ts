import type { Collection, Coupon, CouponRejection, Product, Quote, QuoteIssue, QuoteLine } from '../../types/index.ts';

/*
 * Server-authoritative pricing. Prices always come from the catalog/database —
 * never from the client. All arithmetic happens in integer minor units.
 */

const toMinor = (amount: number) => Math.round(amount * 100);
const fromMinor = (minor: number) => minor / 100;

export interface QuoteInput {
  /** Product IDs requested by the client (untrusted; may contain junk or duplicates). */
  requestedIds: string[];
  /** Published products resolved on the server. */
  products: Product[];
  coupon?: Coupon | null;
  /** Number of times this user has already redeemed the coupon. */
  userRedemptions?: number;
  collections?: Collection[];
  now?: Date;
}

export interface CouponEvaluation {
  ok: boolean;
  reason?: CouponRejection;
  /** Discount per product ID, in minor units. */
  lineDiscounts: Map<string, number>;
}

export function evaluateCoupon(
  coupon: Coupon,
  lines: Array<{ productId: string; unitMinor: number }>,
  currency: string,
  options: { userRedemptions?: number; collections?: Collection[]; now?: Date } = {},
): CouponEvaluation {
  const reject = (reason: CouponRejection): CouponEvaluation => ({ ok: false, reason, lineDiscounts: new Map() });
  const now = options.now ?? new Date();

  if (!coupon.isActive) return reject('inactive');
  if (coupon.startsAt && Date.parse(coupon.startsAt) > now.getTime()) return reject('not-started');
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= now.getTime()) return reject('expired');
  if (coupon.maxUses !== null && coupon.timesUsed >= coupon.maxUses) return reject('usage-limit');
  if (coupon.perUserLimit !== null && (options.userRedemptions ?? 0) >= coupon.perUserLimit) return reject('user-limit');
  if (coupon.type === 'fixed' && coupon.currency !== currency) return reject('currency');
  if (coupon.type === 'percent' && (coupon.amount <= 0 || coupon.amount > 100)) return reject('inactive');

  const subtotalMinor = lines.reduce((sum, line) => sum + line.unitMinor, 0);
  if (coupon.minOrderAmount !== null && subtotalMinor < toMinor(coupon.minOrderAmount)) return reject('min-order');

  const restricted = coupon.productIds.length > 0 || coupon.collectionIds.length > 0;
  const allowedIds = new Set<string>(coupon.productIds);
  for (const collection of options.collections ?? []) {
    if (coupon.collectionIds.includes(collection.id)) collection.productIds.forEach((id) => allowedIds.add(id));
  }
  const eligible = restricted ? lines.filter((line) => allowedIds.has(line.productId)) : lines;
  if (!eligible.length) return reject('not-applicable');

  const lineDiscounts = new Map<string, number>();
  if (coupon.type === 'percent') {
    for (const line of eligible) {
      lineDiscounts.set(line.productId, Math.min(line.unitMinor, Math.round((line.unitMinor * coupon.amount) / 100)));
    }
  } else {
    const eligibleMinor = eligible.reduce((sum, line) => sum + line.unitMinor, 0);
    const discountMinor = Math.min(toMinor(coupon.amount), eligibleMinor);
    // Distribute proportionally; assign rounding remainder so lines sum exactly.
    let assigned = 0;
    eligible.forEach((line, index) => {
      const share =
        index === eligible.length - 1
          ? discountMinor - assigned
          : Math.floor((discountMinor * line.unitMinor) / Math.max(eligibleMinor, 1));
      const capped = Math.min(share, line.unitMinor);
      lineDiscounts.set(line.productId, capped);
      assigned += capped;
    });
  }
  return { ok: true, lineDiscounts };
}

export function computeQuote(input: QuoteInput): Quote {
  const issues: QuoteIssue[] = [];
  const byId = new Map(input.products.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const resolved: Product[] = [];

  for (const id of input.requestedIds) {
    if (typeof id !== 'string' || seen.has(id)) continue;
    seen.add(id);
    const product = byId.get(id);
    if (!product || product.status !== 'published') {
      issues.push({ kind: 'unavailable', productId: id });
      continue;
    }
    resolved.push(product);
  }

  const currencies = new Set(resolved.map((p) => p.price.currency));
  if (currencies.size > 1) issues.push({ kind: 'mixed-currency' });
  const currency = resolved[0]?.price.currency ?? null;

  const baseLines = resolved.map((p) => ({ productId: p.id, unitMinor: toMinor(p.price.amount) }));
  let lineDiscounts = new Map<string, number>();
  let appliedCoupon: Quote['coupon'] = null;

  if (input.coupon && currency && currencies.size === 1) {
    const evaluation = evaluateCoupon(input.coupon, baseLines, currency, {
      userRedemptions: input.userRedemptions,
      collections: input.collections,
      now: input.now,
    });
    if (evaluation.ok) {
      lineDiscounts = evaluation.lineDiscounts;
      appliedCoupon = { code: input.coupon.code, type: input.coupon.type, amount: input.coupon.amount };
    } else if (evaluation.reason) {
      issues.push({ kind: 'coupon', reason: evaluation.reason });
    }
  }

  const lines: QuoteLine[] = resolved.map((p) => ({
    productId: p.id,
    slug: p.slug,
    title: p.title,
    unitAmount: p.price.amount,
    discountAmount: fromMinor(lineDiscounts.get(p.id) ?? 0),
    currency: p.price.currency,
    license: p.license,
    version: p.version,
  }));

  const subtotalMinor = baseLines.reduce((sum, line) => sum + line.unitMinor, 0);
  const discountMinor = [...lineDiscounts.values()].reduce((sum, value) => sum + value, 0);

  return {
    lines,
    currency,
    subtotal: fromMinor(subtotalMinor),
    discount: fromMinor(discountMinor),
    total: fromMinor(Math.max(0, subtotalMinor - discountMinor)),
    coupon: appliedCoupon,
    issues,
  };
}

/** Blocking issues prevent an order from being created. Coupon issues do not. */
export function hasBlockingIssues(quote: Quote): boolean {
  return quote.issues.some((issue) => issue.kind !== 'coupon') || quote.lines.length === 0;
}

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}
