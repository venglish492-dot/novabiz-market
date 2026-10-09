'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, isLocale } from './config';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Persist the interface language. Setting a cookie in a Server Action makes
 * Next.js re-render the current route in the new language.
 */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  const user = await getSessionUser();
  if (user) {
    const supabase = await createSupabaseServerClient();
    await supabase?.from('profiles').update({ locale }).eq('id', user.id);
  }
}
