import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeQuote, evaluateCoupon, hasBlockingIssues, normalizeCouponCode } from '../../src/lib/orders/pricing.ts';
import { PRODUCTS } from '../../src/data/products.ts';
import { COLLECTIONS } from '../../src/data/collections.ts';
import type { Coupon, Product } from '../../src/types/index.ts';

const [a, b, c] = PRODUCTS;
const now = new Date('2026-10-09T12:00:00Z');

function coupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 'c1',
    code: 'LAUNCH10',
    type: 'percent',
    amount: 10,
    currency: null,
    minOrderAmount: null,
    productIds: [],
    collectionIds: [],
    startsAt: null,
    expiresAt: null,
    maxUses: null,
    perUserLimit: null,
    timesUsed: 0,
    isActive: true,
    ...overrides,
  };
}

test('prices come from server products, never from the request', () => {
  const quote = computeQuote({ requestedIds: [a.id, b.id], products: PRODUCTS, now });
  assert.equal(quote.subtotal, a.price.amount + b.price.amount);
  assert.equal(quote.total, quote.subtotal);
  assert.equal(quote.discount, 0);
  assert.equal(quote.currency, 'RUB');
  assert.deepEqual(quote.issues, []);
});

test('duplicates are collapsed and unknown IDs are reported as blocking', () => {
  const quote = computeQuote({ requestedIds: [a.id, a.id, 'not-a-product'], products: PRODUCTS, now });
  assert.equal(quote.lines.length, 1);
  assert.deepEqual(quote.issues, [{ kind: 'unavailable', productId: 'not-a-product' }]);
  assert.equal(hasBlockingIssues(quote), true);
});

test('draft or archived products cannot be bought', () => {
  const draft: Product = { ...a, status: 'draft' };
  const quote = computeQuote({ requestedIds: [a.id], products: [draft], now });
  assert.equal(quote.lines.length, 0);
  assert.equal(hasBlockingIssues(quote), true);
});

test('an empty cart is blocking', () => {
  assert.equal(hasBlockingIssues(computeQuote({ requestedIds: [], products: PRODUCTS, now })), true);
});

test('mixed currencies are blocking and coupons are not applied', () => {
  const usd: Product = { ...b, price: { amount: 30, currency: 'USD' } };
  const quote = computeQuote({ requestedIds: [a.id, b.id], products: [a, usd], coupon: coupon(), now });
  assert.ok(quote.issues.some((i) => i.kind === 'mixed-currency'));
  assert.equal(quote.coupon, null);
  assert.equal(hasBlockingIssues(quote), true);
});

test('percent coupon discounts every line in minor units', () => {
  const quote = computeQuote({ requestedIds: [a.id, b.id], products: PRODUCTS, coupon: coupon({ amount: 15 }), now });
  const expected = Math.round(a.price.amount * 100 * 0.15) / 100 + Math.round(b.price.amount * 100 * 0.15) / 100;
  assert.equal(quote.discount, Math.round(expected * 100) / 100);
  assert.equal(quote.total, Math.round((quote.subtotal - quote.discount) * 100) / 100);
  assert.equal(quote.coupon?.code, 'LAUNCH10');
});

test('fixed coupon is split across lines and sums exactly', () => {
  const lines = [
    { productId: 'x', unitMinor: 100_00 },
    { productId: 'y', unitMinor: 200_00 },
    { productId: 'z', unitMinor: 300_00 },
  ];
  const result = evaluateCoupon(coupon({ type: 'fixed', amount: 100.01, currency: 'RUB' }), lines, 'RUB', { now });
  assert.equal(result.ok, true);
  const total = [...result.lineDiscounts.values()].reduce((s, v) => s + v, 0);
  assert.equal(total, 100_01);
});

test('fixed coupon never exceeds the order value', () => {
  const quote = computeQuote({
    requestedIds: [a.id],
    products: PRODUCTS,
    coupon: coupon({ type: 'fixed', amount: 1_000_000, currency: 'RUB' }),
    now,
  });
  assert.equal(quote.total, 0);
  assert.equal(quote.discount, a.price.amount);
});

test('fixed coupon in another currency is rejected', () => {
  const quote = computeQuote({
    requestedIds: [a.id],
    products: PRODUCTS,
    coupon: coupon({ type: 'fixed', amount: 5, currency: 'USD' }),
    now,
  });
  assert.deepEqual(quote.issues, [{ kind: 'coupon', reason: 'currency' }]);
  assert.equal(quote.total, a.price.amount);
  assert.equal(hasBlockingIssues(quote), false, 'a rejected coupon must not block the order');
});

test('coupon validity rules are enforced', () => {
  const lines = [{ productId: a.id, unitMinor: 1000_00 }];
  const cases: Array<[Partial<Coupon>, string, number?]> = [
    [{ isActive: false }, 'inactive'],
    [{ startsAt: '2026-11-01T00:00:00Z' }, 'not-started'],
    [{ expiresAt: '2026-10-01T00:00:00Z' }, 'expired'],
    [{ expiresAt: now.toISOString() }, 'expired'],
    [{ maxUses: 5, timesUsed: 5 }, 'usage-limit'],
    [{ perUserLimit: 1 }, 'user-limit', 1],
    [{ minOrderAmount: 5000 }, 'min-order'],
    [{ productIds: ['someone-else'] }, 'not-applicable'],
    [{ amount: 0 }, 'inactive'],
    [{ amount: 150 }, 'inactive'],
  ];
  for (const [overrides, reason, redemptions] of cases) {
    const result = evaluateCoupon(coupon(overrides), lines, 'RUB', { now, userRedemptions: redemptions });
    assert.equal(result.ok, false, JSON.stringify(overrides));
    assert.equal(result.reason, reason, JSON.stringify(overrides));
  }
});

test('product- and collection-restricted coupons only touch eligible lines', () => {
  const restricted = computeQuote({
    requestedIds: [a.id, b.id],
    products: PRODUCTS,
    coupon: coupon({ amount: 50, productIds: [b.id] }),
    now,
  });
  assert.equal(restricted.lines.find((l) => l.productId === a.id)?.discountAmount, 0);
  assert.equal(restricted.lines.find((l) => l.productId === b.id)?.discountAmount, b.price.amount / 2);

  const collection = COLLECTIONS[0];
  const member = collection.productIds[0];
  const outsider = PRODUCTS.find((p) => !collection.productIds.includes(p.id))!;
  const viaCollection = computeQuote({
    requestedIds: [member, outsider.id],
    products: PRODUCTS,
    collections: COLLECTIONS,
    coupon: coupon({ amount: 20, collectionIds: [collection.id] }),
    now,
  });
  assert.ok((viaCollection.lines.find((l) => l.productId === member)?.discountAmount ?? 0) > 0);
  assert.equal(viaCollection.lines.find((l) => l.productId === outsider.id)?.discountAmount, 0);
});

test('a 100% coupon yields a zero total but still requires a real coupon row', () => {
  const quote = computeQuote({ requestedIds: [a.id, c.id], products: PRODUCTS, coupon: coupon({ amount: 100 }), now });
  assert.equal(quote.total, 0);
  // Without a coupon object nothing is free — codes are never trusted from the client.
  const noCoupon = computeQuote({ requestedIds: [a.id, c.id], products: PRODUCTS, coupon: null, now });
  assert.equal(noCoupon.total, a.price.amount + c.price.amount);
});

test('coupon codes are normalised', () => {
  assert.equal(normalizeCouponCode('  launch 10 '), 'LAUNCH10');
});
