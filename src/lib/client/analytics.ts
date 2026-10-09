'use client';

import { features } from '@/lib/config/site';

type EventName =
  | 'page_view'
  | 'product_view'
  | 'search'
  | 'filter'
  | 'wishlist_add'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'payment_start'
  | 'download'
  | 'review_submit';

function sessionId(): string {
  try {
    let id = window.sessionStorage.getItem('vl-sid');
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem('vl-sid', id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
}

/**
 * Fire-and-forget first-party event. No-op unless analytics is enabled.
 * Never send personal or payment data in `props`.
 */
export function track(name: EventName, data: { productId?: string; props?: Record<string, string | number | boolean> } = {}) {
  if (!features.analytics || typeof window === 'undefined') return;
  const body = JSON.stringify({ name, productId: data.productId, props: data.props, sessionId: sessionId(), path: window.location.pathname });
  try {
    if (!navigator.sendBeacon?.('/api/events', new Blob([body], { type: 'application/json' }))) {
      void fetch('/api/events', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    }
  } catch {
    // Analytics must never affect the user experience.
  }
}
