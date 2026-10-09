const BASE = 'https://redirect-check.invalid';

/**
 * Accepts only same-origin relative paths for post-login redirects. Rejects
 * protocol-relative URLs, backslash/control-character tricks that browsers
 * normalise into another origin, and API routes. Pure function — unit tested.
 */
export function safeNextPath(value: unknown, fallback = '/account'): string {
  if (typeof value !== 'string' || value.length > 512) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, BASE);
    if (url.origin !== BASE || url.pathname.startsWith('/api/')) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
