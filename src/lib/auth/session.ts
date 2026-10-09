import 'server-only';
import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminRole, isStaffRole, isUserRole } from './roles';
import type { SessionUser } from '@/types';

/**
 * The signed-in user, verified against Supabase Auth (`getUser()` contacts
 * the Auth server, so a forged cookie cannot pass). The role comes from the
 * `profiles` table, which users cannot modify themselves (see migration).
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  const metadataName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;

  return {
    id: user.id,
    email: user.email ?? '',
    name: (profile?.full_name as string | null | undefined) ?? metadataName,
    role: isUserRole(profile?.role) ? profile.role : 'buyer',
  };
});

/** Require a signed-in user for a page; otherwise send them to sign in. */
export async function requireUser(nextPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/**
 * Require an admin. Unauthenticated visitors are sent to sign in; signed-in
 * users without the role get a 404 so the admin area is not advertised.
 */
export async function requireAdmin(nextPath = '/admin'): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (!isAdminRole(user.role)) notFound();
  return user;
}

/** Require content staff (editor, admin, super_admin). */
export async function requireStaff(nextPath = '/admin'): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (!isStaffRole(user.role)) notFound();
  return user;
}

export { safeNextPath } from './redirect';
