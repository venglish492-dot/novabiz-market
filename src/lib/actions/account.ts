'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { nameSchema, passwordSchema } from '@/lib/validation/schemas';
import { LOCALE_COOKIE } from '@/i18n/config';

export interface AccountFormState {
  ok?: boolean;
  error?: 'invalid' | 'generic' | 'rateLimited' | 'passwordMismatch' | 'weakPassword' | 'unauthorized';
}

export async function updateProfileAction(_: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const user = await getSessionUser();
  const supabase = await createSupabaseServerClient();
  if (!user || !supabase) return { error: 'unauthorized' };
  const parsed = nameSchema.safeParse(formData.get('name'));
  if (!parsed.success) return { error: 'invalid' };
  const { error } = await supabase.from('profiles').update({ full_name: parsed.data }).eq('id', user.id);
  if (error) return { error: 'generic' };
  revalidatePath('/account', 'layout');
  return { ok: true };
}

export async function changePasswordAction(_: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const user = await getSessionUser();
  const supabase = await createSupabaseServerClient();
  if (!user || !supabase) return { error: 'unauthorized' };
  if (!rateLimit(`password:${user.id}:${await clientKey()}`, 5, 10 * 60_000).ok) return { error: 'rateLimited' };
  const password = passwordSchema.safeParse(formData.get('password'));
  if (!password.success) return { error: 'weakPassword' };
  if (formData.get('confirm') !== password.data) return { error: 'passwordMismatch' };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: error.code === 'weak_password' ? 'weakPassword' : 'generic' };
  return { ok: true };
}

const settingsSchema = z.object({
  locale: z.enum(['ru', 'en']),
  marketing: z.boolean(),
});

export async function updateSettingsAction(_: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const user = await getSessionUser();
  const supabase = await createSupabaseServerClient();
  if (!user || !supabase) return { error: 'unauthorized' };
  const parsed = settingsSchema.safeParse({ locale: formData.get('locale'), marketing: formData.get('marketing') === 'on' });
  if (!parsed.success) return { error: 'invalid' };
  const { error } = await supabase
    .from('profiles')
    .update({ locale: parsed.data.locale, marketing_opt_in: parsed.data.marketing })
    .eq('id', user.id);
  if (error) return { error: 'generic' };
  (await cookies()).set(LOCALE_COOKIE, parsed.data.locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return { ok: true };
}
