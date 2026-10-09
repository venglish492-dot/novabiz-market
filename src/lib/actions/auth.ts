'use server';

import { redirect } from 'next/navigation';
import type { AuthError } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAppOrigin } from '@/lib/orders/service';
import { safeNextPath } from '@/lib/auth/session';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { forgotSchema, loginSchema, registerSchema, resetSchema } from '@/lib/validation/schemas';
import { getLocale } from '@/i18n/server';
import { logger } from '@/lib/logger';

export type AuthErrorKey =
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'userExists'
  | 'weakPassword'
  | 'passwordMismatch'
  | 'invalidEmail'
  | 'nameRequired'
  | 'rateLimited'
  | 'sessionExpired'
  | 'generic'
  | 'notConfigured';

export interface AuthFormState {
  error?: AuthErrorKey;
  /** Shown after sign-up or reset requests that require checking email. */
  sentTo?: string;
  done?: boolean;
}

/** Map Supabase Auth errors to friendly keys; raw backend messages never reach the UI. */
function mapAuthError(error: AuthError): AuthErrorKey {
  switch (error.code) {
    case 'invalid_credentials':
      return 'invalidCredentials';
    case 'email_not_confirmed':
      return 'emailNotConfirmed';
    case 'user_already_exists':
    case 'email_exists':
      return 'userExists';
    case 'weak_password':
      return 'weakPassword';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'rateLimited';
    case 'session_expired':
    case 'session_not_found':
      return 'sessionExpired';
    default:
      logger.warn('auth.error', { code: error.code, status: error.status });
      return 'generic';
  }
}

async function limited(scope: string): Promise<boolean> {
  return !rateLimit(`auth:${scope}:${await clientKey()}`, 10, 60_000).ok;
}

export async function loginAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'notConfigured' };
  if (await limited('login')) return { error: 'rateLimited' };

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') || undefined,
  });
  if (!parsed.success) return { error: 'invalidCredentials' };

  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { error: mapAuthError(error) };
  redirect(safeNextPath(parsed.data.next));
}

export async function registerAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'notConfigured' };
  if (await limited('register')) return { error: 'rateLimited' };

  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') || undefined,
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { error: field === 'name' ? 'nameRequired' : field === 'email' ? 'invalidEmail' : 'weakPassword' };
  }

  const next = safeNextPath(parsed.data.next);
  const origin = await getAppOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name, locale: await getLocale() },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: mapAuthError(error) };
  // With email confirmation enabled there is no session until the link is used.
  if (!data.session) return { sentTo: parsed.data.email };
  redirect(next);
}

export async function forgotPasswordAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'notConfigured' };
  if (await limited('forgot')) return { error: 'rateLimited' };

  const parsed = forgotSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: 'invalidEmail' };

  const origin = await getAppOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
  });
  // Same response whether or not the account exists.
  if (error && error.code !== 'user_not_found') {
    const key = mapAuthError(error);
    if (key === 'rateLimited') return { error: key };
  }
  return { sentTo: parsed.data.email };
}

export async function resetPasswordAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'notConfigured' };
  if (await limited('reset')) return { error: 'rateLimited' };

  const parsed = resetSchema.safeParse({ password: formData.get('password'), confirm: formData.get('confirm') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.path[0] === 'confirm' ? 'passwordMismatch' : 'weakPassword' };
  }
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'sessionExpired' };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: mapAuthError(error) };
  return { done: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect('/');
}

export async function googleSignInAction(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED !== 'true') redirect('/login');
  const next = safeNextPath(formData.get('next'));
  const origin = await getAppOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect('/login?error=oauth');
  redirect(data.url);
}
