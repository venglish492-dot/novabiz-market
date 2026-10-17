import { limits } from '../../config/limits.ts';

/** System routes and words that can never be claimed as usernames or aliases. */
export const RESERVED_USERNAMES = new Set([
  'about', 'account', 'admin', 'administrator', 'api', 'app', 'assets', 'auth', 'blog', 'changelog', 'compare',
  'contact', 'dashboard', 'discover', 'docs', 'download', 'edit', 'explore', 'faq', 'forgot-password', 'guidelines',
  'help', 'home', 'index', 'leaderboard', 'legal', 'login', 'logout', 'm', 'me', 'media', 'mod', 'moderator',
  'new', 'null', 'official', 'og', 'preview', 'pricing', 'privacy', 'profile', 'profiles', 'register', 'report',
  'reset-password', 'robots', 'root', 'security', 'settings', 'signin', 'signout', 'signup', 'sitemap', 'static',
  'staff', 'status', 'support', 'system', 'team', 'terms', 'u', 'undefined', 'user', 'users', 'verify', 'vybe',
  'www', '_next', 'favicon', 'manifest', 'icon', 'apple-icon', 'opengraph-image', 'twitter-image',
]);

const PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;

export type UsernameCheck = { ok: true; username: string } | { ok: false; error: string };

export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@/, '').toLowerCase();
}

export function validateUsername(input: string): UsernameCheck {
  const username = normalizeUsername(input);
  if (username.length < limits.username.min) return { ok: false, error: `Use at least ${limits.username.min} characters.` };
  if (username.length > limits.username.max) return { ok: false, error: `Use at most ${limits.username.max} characters.` };
  if (!PATTERN.test(username)) {
    return { ok: false, error: 'Use letters, numbers, dots, dashes or underscores, starting and ending with a letter or number.' };
  }
  if (/[._-]{2,}/.test(username)) return { ok: false, error: 'Avoid repeated punctuation.' };
  if (RESERVED_USERNAMES.has(username)) return { ok: false, error: 'That name is reserved.' };
  return { ok: true, username };
}
