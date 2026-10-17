'use server';

import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { emailConfigured, sendEmail } from '@/lib/email';
import { DUMMY_HASH, hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, destroyAllSessions, destroySession, getCurrentUser, hashToken } from '@/lib/auth/session';
import { safeNext } from '@/lib/auth/redirect';
import { clientIp } from '@/lib/security/request';
import { rateLimit } from '@/lib/security/rate-limit';
import { claimUsername } from '@/features/profiles/service';
import { getStorage } from '@/lib/storage';

/** `values` echoes non-secret fields so forms keep them after React resets the form. Never passwords. */
export type FormState = { error?: string; fieldErrors?: Record<string, string>; message?: string; devLink?: string; values?: Record<string, string> } | undefined;

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.')).pipe(z.string().max(254));
const password = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .max(200, 'That password is too long.')
  .refine((value) => !/^(.)\1+$/.test(value), 'Choose a less predictable password.');

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? 'form')] ??= issue.message;
  return out;
}

export async function signupAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({ email, password, username: z.string().max(64).optional() })
    .safeParse({ email: form.get('email'), password: form.get('password'), username: form.get('username') || undefined });
  const values = { email: String(form.get('email') ?? '').slice(0, 254) };
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  if (form.get('terms') !== 'on') return { fieldErrors: { terms: 'Please accept the terms and community guidelines.' }, values };

  const limit = await rateLimit(`signup:${await clientIp()}`, 8, 3600);
  if (!limit.ok) return { error: 'Too many sign-ups from this network. Try again later.', values };

  const db = await getDb();
  const passwordHash = await hashPassword(parsed.data.password);
  let userId: string;
  try {
    const [row] = await db.query<{ id: string }>('insert into users (email, password_hash) values ($1, $2) returning id', [parsed.data.email, passwordHash]);
    userId = row.id;
  } catch {
    // Unique violation. Same wording as other failures to limit account enumeration.
    return { fieldErrors: { email: 'An account with this email already exists. Sign in instead.' }, values };
  }
  await createSession(userId);

  let next = '/dashboard';
  if (parsed.data.username) {
    const claim = await claimUsername(userId, parsed.data.username);
    if (!claim.ok) next = `/dashboard?claim=${encodeURIComponent(parsed.data.username)}&claimError=${encodeURIComponent(claim.error)}`;
    else next = '/dashboard?welcome=1';
  }
  redirect(next);
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = z.object({ email, password: z.string().min(1, 'Enter your password.').max(200) }).safeParse({
    email: form.get('email'),
    password: form.get('password'),
  });
  const values = { email: String(form.get('email') ?? '').slice(0, 254) };
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const ip = await clientIp();
  const [byIp, byEmail] = await Promise.all([rateLimit(`login-ip:${ip}`, 30, 900), rateLimit(`login-email:${parsed.data.email}`, 10, 900)]);
  if (!byIp.ok || !byEmail.ok) return { error: 'Too many sign-in attempts. Wait a few minutes and try again.', values };

  const db = await getDb();
  const user = await db.one<{ id: string; password_hash: string }>('select id, password_hash from users where lower(email) = $1', [parsed.data.email]);
  const valid = await verifyPassword(parsed.data.password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) return { error: 'That email and password don’t match.', values };

  await createSession(user.id);
  redirect(safeNext(form.get('next')));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/');
}

export async function forgotPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = email.safeParse(form.get('email'));
  const values = { email: String(form.get('email') ?? '').slice(0, 254) };
  if (!parsed.success) return { fieldErrors: { email: 'Enter a valid email address.' }, values };
  const limit = await rateLimit(`forgot:${await clientIp()}`, 5, 3600);
  if (!limit.ok) return { error: 'Too many reset requests. Try again later.', values };

  const generic = 'If an account exists for that email, a reset link is on its way. It expires in 30 minutes.';
  const db = await getDb();
  const user = await db.one<{ id: string }>('select id from users where lower(email) = $1', [parsed.data]);
  if (!user) return { message: generic };

  const token = randomBytes(32).toString('base64url');
  await db.query(`insert into password_resets (token_hash, user_id, expires_at) values ($1, $2, now() + interval '30 minutes')`, [hashToken(token), user.id]);
  const link = `${env.siteUrl}/reset-password?token=${token}`;

  if (emailConfigured()) {
    await sendEmail(parsed.data, 'Reset your VYBE password', `Someone asked to reset your password.\n\n${link}\n\nIf this wasn't you, ignore this email.`);
    return { message: generic };
  }
  if (!env.isProduction) {
    // Development only: no email provider configured, so surface the link locally.
    logger.info('auth.dev_reset_link', { link });
    return { message: 'Email isn’t configured in this development environment, so here is your reset link:', devLink: link };
  }
  logger.error('auth.reset_email_unconfigured');
  return { error: 'Password reset emails aren’t configured on this server yet. Contact support.' };
}

export async function resetPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get('token') || '');
  const parsed = password.safeParse(form.get('password'));
  if (!parsed.success) return { fieldErrors: { password: parsed.error.issues[0].message } };
  if (!/^[\w-]{20,100}$/.test(token)) return { error: 'This reset link is invalid. Request a new one.' };

  const db = await getDb();
  const reset = await db.one<{ user_id: string }>(
    'update password_resets set used_at = now() where token_hash = $1 and used_at is null and expires_at > now() returning user_id',
    [hashToken(token)],
  );
  if (!reset) return { error: 'This reset link has expired or was already used. Request a new one.' };
  const passwordHash = await hashPassword(parsed.data);
  await db.tx(async (q) => {
    await q.query('update users set password_hash = $2, updated_at = now() where id = $1', [reset.user_id, passwordHash]);
    await destroyAllSessions(reset.user_id, q);
  });
  await createSession(reset.user_id);
  redirect('/dashboard?passwordReset=1');
}

export async function changePasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Your session expired. Sign in again.' };
  const next = password.safeParse(form.get('newPassword'));
  if (!next.success) return { fieldErrors: { newPassword: next.error.issues[0].message } };
  const db = await getDb();
  const row = await db.one<{ password_hash: string }>('select password_hash from users where id = $1', [user.id]);
  if (!row || !(await verifyPassword(String(form.get('currentPassword') || ''), row.password_hash))) {
    return { fieldErrors: { currentPassword: 'Your current password is incorrect.' } };
  }
  const passwordHash = await hashPassword(next.data);
  await db.tx(async (q) => {
    await q.query('update users set password_hash = $2, updated_at = now() where id = $1', [user.id, passwordHash]);
    await destroyAllSessions(user.id, q);
  });
  await createSession(user.id);
  return { message: 'Password updated. Other devices were signed out.' };
}

export async function deleteAccountAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Your session expired. Sign in again.' };
  if (String(form.get('confirm') || '') !== 'DELETE') return { fieldErrors: { confirm: 'Type DELETE to confirm.' } };
  const db = await getDb();
  const row = await db.one<{ password_hash: string }>('select password_hash from users where id = $1', [user.id]);
  if (!row || !(await verifyPassword(String(form.get('password') || ''), row.password_hash))) {
    return { fieldErrors: { password: 'Password is incorrect.' } };
  }
  const files = await db.query<{ storage_key: string; poster_key: string | null }>('select storage_key, poster_key from assets where user_id = $1', [user.id]);
  await db.query('delete from users where id = $1', [user.id]); // cascades to profile, assets rows, sessions, analytics
  const storage = getStorage();
  for (const file of files) {
    for (const key of [file.storage_key, file.poster_key]) if (key) await storage.delete(key).catch(() => null);
  }
  await destroySession().catch(() => null);
  redirect('/?deleted=1');
}
