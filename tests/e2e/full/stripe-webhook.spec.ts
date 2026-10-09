import { expect, test, type APIRequestContext } from '@playwright/test';
import { signStripePayload } from '../../../src/lib/payments/stripe-signature.ts';
import { SAAS } from '../helpers';
import { createUser, fullStackConfigured, insert, select } from './backend';

/*
 * Drives /api/webhooks/stripe with locally signed events. Requires the app to
 * run with STRIPE_WEBHOOK_SECRET equal to E2E_STRIPE_WEBHOOK_SECRET (and any
 * STRIPE_SECRET_KEY so the provider counts as configured). No call reaches Stripe.
 */
const SECRET = process.env.E2E_STRIPE_WEBHOOK_SECRET ?? '';
test.skip(!fullStackConfigured || !SECRET, 'Set E2E_STRIPE_WEBHOOK_SECRET and the full-stack variables');
test.describe.configure({ mode: 'serial' });

let orderId = '';
let userId = '';
let productId = '';
let amountMinor = 0;
const paymentIntent = `pi_e2e_${Date.now()}`;

function event(id: string, type: string, object: Record<string, unknown>) {
  return JSON.stringify({ id, type, object: 'event', data: { object } });
}

async function deliver(request: APIRequestContext, body: string, header = signStripePayload(body, SECRET)) {
  const response = await request.post('/api/webhooks/stripe', { data: body, headers: { 'stripe-signature': header, 'content-type': 'application/json' } });
  return { status: response.status(), body: await response.json().catch(() => null) };
}

const completed = (id: string, amount = amountMinor, currency = 'rub') =>
  event(id, 'checkout.session.completed', {
    id: `cs_e2e_${id}`,
    object: 'checkout.session',
    payment_status: 'paid',
    amount_total: amount,
    currency,
    payment_intent: paymentIntent,
    client_reference_id: orderId,
    metadata: { order_id: orderId },
  });

const entitlementCount = async () =>
  (await select('entitlements', `user_id=eq.${userId}&product_id=eq.${productId}&revoked_at=is.null&select=id`)).length;

test.beforeAll(async () => {
  const user = await createUser('stripe');
  userId = user.id;
  const [product] = await select<{ id: string; price_amount: number; currency: string; title: unknown; license_tier: string; version: string }>(
    'products',
    `slug=eq.${SAAS.slug}&select=id,price_amount,currency,title,license_tier,version`,
  );
  productId = product.id;
  const price = Number(product.price_amount);
  amountMinor = Math.round(price * 100);
  const order = await insert<{ id: string }>('orders', {
    order_number: `VL-E2E-${Date.now().toString(36).toUpperCase()}`,
    user_id: user.id,
    email: user.email,
    status: 'payment_pending',
    currency: product.currency,
    subtotal_amount: price,
    total_amount: price,
    provider: 'stripe',
  });
  orderId = order.id;
  await insert('order_items', {
    order_id: orderId,
    product_id: productId,
    title_snapshot: product.title,
    unit_amount: price,
    currency: product.currency,
    license_tier: product.license_tier,
    version_at_purchase: product.version,
  });
  await insert('payments', { order_id: orderId, provider: 'stripe', provider_session_id: `cs_e2e_${Date.now()}`, status: 'pending', amount: price, currency: product.currency });
});

test('unsigned, mis-signed and stale events are rejected', async ({ request }) => {
  const body = completed('evt_forged');
  expect((await deliver(request, body, '')).status).toBe(400);
  expect((await deliver(request, body, signStripePayload(body, 'whsec_wrong'))).status).toBe(400);
  const stale = signStripePayload(body, SECRET, Math.floor(Date.now() / 1000) - 3600);
  expect((await deliver(request, body, stale)).status).toBe(400);
  // Signed for a different body.
  expect((await deliver(request, body, signStripePayload(completed('evt_other'), SECRET))).status).toBe(400);

  const [order] = await select<{ status: string }>('orders', `id=eq.${orderId}&select=status`);
  expect(order.status).toBe('payment_pending');
  expect(await entitlementCount()).toBe(0);
});

test('an amount or currency mismatch never fulfils the order', async ({ request }) => {
  const short = await deliver(request, completed(`evt_short_${Date.now()}`, amountMinor - 100));
  expect(short.status).toBe(200);
  expect(short.body.outcome).toBe('rejected');
  const wrongCurrency = await deliver(request, completed(`evt_cur_${Date.now()}`, amountMinor, 'usd'));
  expect(wrongCurrency.body.outcome).toBe('rejected');
  const [order] = await select<{ status: string }>('orders', `id=eq.${orderId}&select=status`);
  expect(order.status).toBe('payment_pending');
  expect(await entitlementCount()).toBe(0);
});

test('a valid event fulfils exactly once, even when replayed', async ({ request }) => {
  const id = `evt_ok_${Date.now()}`;
  const body = completed(id);
  const first = await deliver(request, body);
  expect(first).toEqual({ status: 200, body: { received: true, outcome: 'processed' } });

  const [order] = await select<{ status: string; paid_at: string | null }>('orders', `id=eq.${orderId}&select=status,paid_at`);
  expect(order.status).toBe('paid');
  expect(order.paid_at).not.toBeNull();
  expect(await entitlementCount()).toBe(1);

  // Stripe retries deliver the same event id; a later async event carries a new id.
  const replay = await deliver(request, body);
  expect(replay.body.outcome).toBe('duplicate');
  const asyncSuccess = await deliver(request, event(`evt_async_${Date.now()}`, 'checkout.session.async_payment_succeeded', JSON.parse(body).data.object));
  expect(asyncSuccess.status).toBe(200);
  expect(await entitlementCount()).toBe(1);

  const events = await select('payment_events', `order_id=eq.${orderId}&select=event_id`);
  // Two rejected mismatches, the success and the async success; the replay is deduplicated.
  expect(events.length).toBe(4);
});

test('a full refund from Stripe revokes access', async ({ request }) => {
  const refund = await deliver(
    request,
    event(`evt_refund_${Date.now()}`, 'charge.refunded', { id: `ch_e2e`, object: 'charge', refunded: true, payment_intent: paymentIntent }),
  );
  expect(refund.status).toBe(200);
  const [order] = await select<{ status: string }>('orders', `id=eq.${orderId}&select=status`);
  expect(order.status).toBe('refunded');
  expect(await entitlementCount()).toBe(0);
});
