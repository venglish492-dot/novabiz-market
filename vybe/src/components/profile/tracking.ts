'use client';

/** Fire-and-forget analytics beacon. Never blocks navigation or throws. */
export function track(profileId: string, type: 'view' | 'click' | 'widget', targetId?: string) {
  try {
    let referrer: string | undefined;
    if (type === 'view' && document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (host !== location.hostname) referrer = host;
    }
    const body = JSON.stringify({ p: profileId, t: type, id: targetId, r: referrer });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'text/plain;charset=UTF-8' }));
    else void fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' } });
  } catch {
    /* analytics must never break the page */
  }
}
