/**
 * URL safety for anything a creator links to. Only http(s) and mailto are
 * accepted; executable or local schemes (javascript:, data:, vbscript:, file:,
 * blob:…) and URLs carrying credentials are rejected.
 */
export type UrlCheck = { ok: true; url: string } | { ok: false; error: string };

const MAX_URL_LENGTH = 2048;

export function checkUrl(input: string, options: { allowMailto?: boolean } = {}): UrlCheck {
  const raw = input.trim();
  if (!raw) return { ok: false, error: 'Enter a URL.' };
  if (raw.length > MAX_URL_LENGTH) return { ok: false, error: 'URL is too long.' };
  // Control characters and whitespace can smuggle schemes past naive parsers.
  if (/[\u0000-\u001f\u007f\s]/.test(raw)) return { ok: false, error: 'URL contains invalid characters.' };

  let candidate = raw;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    // Bare "example.com/me" → https. Anything else that looks like a scheme is judged as-is.
    if (/^[\w.-]+\.[a-z]{2,}(?:[/?#:].*)?$/i.test(candidate)) candidate = `https://${candidate}`;
    else return { ok: false, error: 'Enter a full URL starting with https://' };
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: 'That doesn’t look like a valid URL.' };
  }

  if (parsed.protocol === 'mailto:') {
    if (!options.allowMailto) return { ok: false, error: 'Email links aren’t allowed here.' };
    const address = decodeURIComponent(parsed.pathname);
    if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(address)) return { ok: false, error: 'Enter a valid email address.' };
    return { ok: true, url: `mailto:${address}` };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: 'Only https://, http:// and mailto: links are allowed.' };
  }
  if (parsed.username || parsed.password) return { ok: false, error: 'URLs with embedded credentials aren’t allowed.' };
  if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
    return { ok: false, error: 'Enter a complete domain name.' };
  }
  return { ok: true, url: parsed.toString() };
}

export function isSafeUrl(input: string, options?: { allowMailto?: boolean }): boolean {
  return checkUrl(input, options).ok;
}

/** Hostname for display and coarse referrer analytics (never the full URL). */
export function hostOf(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const host = new URL(input).hostname.replace(/^www\./, '').toLowerCase();
    return host.slice(0, 100) || null;
  } catch {
    return null;
  }
}
