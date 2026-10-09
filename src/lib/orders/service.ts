import 'server-only';
import { randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { publicSupabase, siteConfig } from '@/lib/config/site';
import { serverConfig } from '@/lib/config/server';
import { PRODUCT_SELECT, mapProductRow } from '@/lib/catalog/mappers';
import { getPaymentProvider } from '@/lib/payments';
import { PaymentProviderError, type PaymentEvent, type PaymentProviderId } from '@/lib/payments/types';
import { escapeHtml, sendEmail } from '@/lib/email/send';
import { formatMoney } from '@/lib/format';
import { logger } from '@/lib/logger';
import { pick, type Locale } from '@/i18n/config';
import type { Collection, CouponRejection, Product, Quote, SessionUser } from '@/types';
import { computeQuote, hasBlockingIssues, normalizeCouponCode } from './pricing';
import { findCoupon } from './coupons';

export type CheckoutError =
  | 'unavailable'
  | 'unavailableItems'
  | 'mixedCurrency'
  | 'alreadyOwned'
  | 'coupon'
  | 'provider'
  | 'generic';

export type CreateOrderResult =
  | { ok: true; orderId: string; redirectUrl: string }
  | { ok: false; error: CheckoutError; couponReason?: CouponRejection };

/** The public origin used for provider redirect URLs. */
export async function getAppOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return siteConfig.url;
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}

function generateOrderNumber(now = new Date()): string {
  const date = now.toISOString().slice(2, 10).replace(/-/g, '');
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const bytes = randomBytes(6);
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `VL-${date}-${suffix}`;
}

/** Load published products fresh from the database — never from cache or the client. */
async function loadProductsForPricing(admin: SupabaseClient, productIds: string[]): Promise<Product[]> {
  if (!productIds.length) return [];
  const { data, error } = await admin.from('products').select(PRODUCT_SELECT).in('id', productIds).eq('status', 'published');
  if (error) throw new Error(`products query failed: ${error.message}`);
  const ctx = { supabaseUrl: publicSupabase.url, mediaBucket: serverConfig.storage.mediaBucket };
  return (data ?? []).map((row) => mapProductRow(row, ctx));
}

async function loadCollectionsFor(admin: SupabaseClient, collectionIds: string[]): Promise<Collection[]> {
  if (!collectionIds.length) return [];
  const { data } = await admin.from('collection_products').select('collection_id, product_id').in('collection_id', collectionIds);
  const grouped = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = grouped.get(row.collection_id as string) ?? [];
    list.push(row.product_id as string);
    grouped.set(row.collection_id as string, list);
  }
  return [...grouped].map(([id, productIds]) => ({
    id,
    slug: id,
    title: { ru: '', en: '' },
    description: { ru: '', en: '' },
    productIds,
    featuredProductId: null,
    sortOrder: 0,
  }));
}

export async function getOwnedProductIds(admin: SupabaseClient, userId: string, productIds?: string[]): Promise<Set<string>> {
  let query = admin.from('entitlements').select('product_id').eq('user_id', userId).is('revoked_at', null);
  if (productIds) query = query.in('product_id', productIds);
  const { data } = await query;
  return new Set((data ?? []).map((row) => row.product_id as string));
}

/** Server-side quote used by both the checkout page and order creation. */
export async function quoteForUser(params: {
  userId: string;
  productIds: string[];
  couponCode?: string;
}): Promise<{ quote: Quote; products: Product[] } | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const products = await loadProductsForPricing(admin, params.productIds);
  const code = params.couponCode ? normalizeCouponCode(params.couponCode) : '';
  let coupon = null;
  let userRedemptions = 0;
  let collections: Collection[] = [];
  if (code) {
    const found = await findCoupon(admin, code, params.userId);
    coupon = found.coupon;
    userRedemptions = found.userRedemptions;
    if (coupon) collections = await loadCollectionsFor(admin, coupon.collectionIds);
  }
  const quote = computeQuote({ requestedIds: params.productIds, products, coupon, userRedemptions, collections });
  if (code && !coupon) quote.issues.push({ kind: 'coupon', reason: 'not-found' });
  return { quote, products };
}

export async function createOrder(params: {
  user: SessionUser;
  productIds: string[];
  couponCode: string;
  providerId: PaymentProviderId;
  locale: Locale;
}): Promise<CreateOrderResult> {
  const admin = getSupabaseAdmin();
  const provider = getPaymentProvider(params.providerId);
  if (!admin || !provider) return { ok: false, error: 'unavailable' };

  try {
    const owned = await getOwnedProductIds(admin, params.user.id, params.productIds);
    if (owned.size) return { ok: false, error: 'alreadyOwned' };

    const priced = await quoteForUser({ userId: params.user.id, productIds: params.productIds, couponCode: params.couponCode });
    if (!priced) return { ok: false, error: 'unavailable' };
    const { quote } = priced;

    if (quote.issues.some((i) => i.kind === 'mixed-currency')) return { ok: false, error: 'mixedCurrency' };
    if (hasBlockingIssues(quote) || !quote.currency) return { ok: false, error: 'unavailableItems' };
    const couponIssue = quote.issues.find((i) => i.kind === 'coupon');
    if (couponIssue && couponIssue.kind === 'coupon') return { ok: false, error: 'coupon', couponReason: couponIssue.reason };

    let couponId: string | null = null;
    if (quote.coupon) {
      const { data } = await admin.from('coupons').select('id').eq('code', quote.coupon.code).maybeSingle();
      couponId = (data?.id as string | undefined) ?? null;
    }

    const isFree = quote.total === 0;
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        order_number: generateOrderNumber(),
        user_id: params.user.id,
        email: params.user.email,
        status: 'pending',
        currency: quote.currency,
        subtotal_amount: quote.subtotal,
        discount_amount: quote.discount,
        total_amount: quote.total,
        coupon_id: couponId,
        coupon_code: quote.coupon?.code ?? null,
        provider: isFree ? 'free' : provider.id,
        is_test: isFree ? false : provider.isTest,
      })
      .select('id, order_number')
      .single();
    if (orderError || !order) throw new Error(`order insert failed: ${orderError?.message}`);

    const { error: itemsError } = await admin.from('order_items').insert(
      quote.lines.map((line) => ({
        order_id: order.id,
        product_id: line.productId,
        title_snapshot: line.title,
        unit_amount: line.unitAmount,
        discount_amount: line.discountAmount,
        currency: line.currency,
        license_tier: line.license,
        version_at_purchase: line.version,
      })),
    );
    if (itemsError) {
      await admin.from('orders').delete().eq('id', order.id);
      throw new Error(`order items insert failed: ${itemsError.message}`);
    }

    // A zero total (e.g. a 100% coupon configured by an admin) needs no payment.
    if (isFree) {
      await admin.rpc('fulfil_order', { p_order_id: order.id, p_provider: 'free', p_provider_payment_id: null });
      logger.info('order.fulfilled_free', { orderId: order.id });
      return { ok: true, orderId: order.id, redirectUrl: `/checkout/success?order=${order.id}` };
    }

    const { data: payment } = await admin
      .from('payments')
      .insert({ order_id: order.id, provider: provider.id, status: 'created', amount: quote.total, currency: quote.currency })
      .select('id')
      .single();

    const origin = await getAppOrigin();
    try {
      const session = await provider.createCheckoutSession({
        orderId: order.id,
        orderNumber: order.order_number,
        currency: quote.currency,
        totalAmount: quote.total,
        lines: quote.lines.map((line) => ({
          name: pick(line.title, params.locale),
          amount: Math.round((line.unitAmount - line.discountAmount) * 100) / 100,
        })),
        customerEmail: params.user.email,
        locale: params.locale,
        successUrl: `${origin}/checkout/success?order=${order.id}`,
        cancelUrl: `${origin}/checkout/cancelled?order=${order.id}`,
      });
      await admin.from('payments').update({ provider_session_id: session.sessionId, status: 'pending' }).eq('id', payment?.id);
      await admin.from('orders').update({ status: 'payment_pending' }).eq('id', order.id);
      logger.info('order.created', { orderId: order.id, provider: provider.id, isTest: provider.isTest });
      return { ok: true, orderId: order.id, redirectUrl: session.url };
    } catch (error) {
      await admin.from('payments').update({ status: 'failed', failure_reason: 'session_creation_failed' }).eq('id', payment?.id);
      await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
      logger.error('order.provider_failed', { orderId: order.id, error });
      return { ok: false, error: error instanceof PaymentProviderError ? 'provider' : 'generic' };
    }
  } catch (error) {
    logger.error('order.create_failed', { error });
    return { ok: false, error: 'generic' };
  }
}

/* ------------------------------------------------------------------ */
/* Verified payment events                                             */
/* ------------------------------------------------------------------ */

export type EventOutcome = 'processed' | 'duplicate' | 'ignored' | 'rejected';

export async function handlePaymentEvent(providerId: PaymentProviderId, event: PaymentEvent): Promise<EventOutcome> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin client is not configured');

  const orderId = 'orderId' in event ? event.orderId : null;
  const { error: insertError } = await admin
    .from('payment_events')
    .insert({ provider: providerId, event_id: event.eventId, event_type: event.type, order_id: orderId, payload: { kind: event.kind } });

  if (insertError) {
    // Unique violation: the event was received before. Skip if it was fully processed.
    const { data: existing } = await admin
      .from('payment_events')
      .select('processed_at')
      .eq('provider', providerId)
      .eq('event_id', event.eventId)
      .maybeSingle();
    if (existing?.processed_at) return 'duplicate';
    if (!existing) throw new Error(`payment_events insert failed: ${insertError.message}`);
  }

  let outcome: EventOutcome = 'processed';
  switch (event.kind) {
    case 'payment_succeeded': {
      const { data: order } = await admin
        .from('orders')
        .select('id, total_amount, currency, status')
        .eq('id', event.orderId)
        .maybeSingle();
      if (!order) {
        logger.error('payment.order_not_found', { orderId: event.orderId });
        outcome = 'rejected';
        break;
      }
      const expectedMinor = Math.round(Number(order.total_amount) * 100);
      const currencyMatches = !event.currency || event.currency === String(order.currency).trim();
      if ((event.amountMinor !== null && event.amountMinor !== expectedMinor) || !currencyMatches) {
        logger.error('payment.amount_mismatch', {
          orderId: order.id,
          expectedMinor,
          receivedMinor: event.amountMinor,
          currency: event.currency,
        });
        outcome = 'rejected';
        break;
      }
      const { data: fulfilled, error } = await admin.rpc('fulfil_order', {
        p_order_id: order.id,
        p_provider: providerId,
        p_provider_payment_id: event.paymentId,
      });
      if (error) throw new Error(`fulfil_order failed: ${error.message}`);
      if (fulfilled) {
        logger.info('payment.fulfilled', { orderId: order.id, provider: providerId });
        await sendOrderConfirmation(admin, order.id).catch((err) => logger.error('email.order_confirmation_failed', { err }));
      }
      break;
    }
    case 'payment_failed':
      await admin.from('orders').update({ status: 'failed' }).eq('id', event.orderId).in('status', ['pending', 'payment_pending']);
      await admin
        .from('payments')
        .update({ status: 'failed', failure_reason: event.reason ?? null })
        .eq('order_id', event.orderId)
        .in('status', ['created', 'pending']);
      break;
    case 'checkout_expired':
      await admin
        .from('orders')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', event.orderId)
        .in('status', ['pending', 'payment_pending']);
      await admin.from('payments').update({ status: 'cancelled' }).eq('order_id', event.orderId).in('status', ['created', 'pending']);
      break;
    case 'refunded': {
      let targetOrder = event.orderId;
      if (!targetOrder && event.paymentId) {
        const { data } = await admin.from('payments').select('order_id').eq('provider_payment_id', event.paymentId).maybeSingle();
        targetOrder = (data?.order_id as string | undefined) ?? null;
      }
      if (targetOrder) await admin.rpc('mark_order_refunded', { p_order_id: targetOrder });
      else outcome = 'ignored';
      break;
    }
    default:
      outcome = 'ignored';
  }

  await admin
    .from('payment_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('provider', providerId)
    .eq('event_id', event.eventId);
  return outcome;
}

async function sendOrderConfirmation(admin: SupabaseClient, orderId: string) {
  const { data: order } = await admin
    .from('orders')
    .select('order_number, email, total_amount, currency, is_test, user_id, items:order_items(title_snapshot)')
    .eq('id', orderId)
    .single();
  if (!order) return;
  const { data: profile } = await admin.from('profiles').select('locale').eq('id', order.user_id).maybeSingle();
  const locale: Locale = profile?.locale === 'en' ? 'en' : 'ru';
  const titles = ((order.items ?? []) as Array<{ title_snapshot: Record<string, string> }>).map((item) =>
    pick(item.title_snapshot as never, locale),
  );
  const total = formatMoney(Number(order.total_amount), String(order.currency).trim(), locale);
  const libraryUrl = `${siteConfig.url}/library`;
  const subject =
    locale === 'ru' ? `Заказ ${order.order_number} оплачен — Vektor Lab` : `Order ${order.order_number} confirmed — Vektor Lab`;
  const intro =
    locale === 'ru'
      ? 'Оплата подтверждена. Продукты уже доступны в вашей библиотеке.'
      : 'Your payment is confirmed. Your products are now in your library.';
  const cta = locale === 'ru' ? 'Открыть библиотеку' : 'Open your library';
  const list = titles.map((t) => `<li>${escapeHtml(t)}</li>`).join('');
  await sendEmail({
    to: order.email as string,
    subject,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#0b0d12"><p>${intro}</p><p><strong>${escapeHtml(
      String(order.order_number),
    )}</strong> · ${escapeHtml(total)}</p><ul>${list}</ul><p><a href="${libraryUrl}">${cta}</a></p><p style="color:#7b8292">Vektor Lab · ${siteConfig.email}</p></div>`,
    text: `${intro}\n\n${order.order_number} · ${total}\n${titles.map((t) => `- ${t}`).join('\n')}\n\n${cta}: ${libraryUrl}`,
  });
}

/** Simulated provider outcome for the development sandbox only. */
export async function completeSandboxPayment(params: {
  orderId: string;
  sessionId: string;
  outcome: 'success' | 'failure';
  userId: string;
}): Promise<EventOutcome | 'forbidden'> {
  if (!serverConfig.sandbox.enabled) return 'forbidden';
  const admin = getSupabaseAdmin();
  if (!admin) return 'forbidden';
  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, total_amount, currency, is_test')
    .eq('id', params.orderId)
    .maybeSingle();
  if (!order || order.user_id !== params.userId || !order.is_test) return 'forbidden';
  const { data: payment } = await admin
    .from('payments')
    .select('id')
    .eq('order_id', order.id)
    .eq('provider', 'sandbox')
    .eq('provider_session_id', params.sessionId)
    .maybeSingle();
  if (!payment) return 'forbidden';

  const eventId = `sbx_evt_${params.sessionId}_${params.outcome}`;
  const event: PaymentEvent =
    params.outcome === 'success'
      ? {
          kind: 'payment_succeeded',
          eventId,
          type: 'sandbox.payment_succeeded',
          orderId: order.id,
          sessionId: params.sessionId,
          paymentId: `sbx_pay_${params.sessionId}`,
          amountMinor: Math.round(Number(order.total_amount) * 100),
          currency: String(order.currency).trim(),
        }
      : { kind: 'payment_failed', eventId, type: 'sandbox.payment_failed', orderId: order.id, sessionId: params.sessionId, reason: 'sandbox_declined' };
  return handlePaymentEvent('sandbox', event);
}
