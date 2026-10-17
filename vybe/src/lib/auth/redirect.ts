/** Only allow same-site relative redirects after sign-in ("/dashboard", not "//evil.com"). */
export function safeNext(value: unknown, fallback = '/dashboard'): string {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value.slice(0, 512);
}
