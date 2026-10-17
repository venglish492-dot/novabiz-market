import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb, type Queryable } from '@/lib/db';
import { env } from '@/lib/env';

export const SESSION_COOKIE = 'vybe_session';
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  profile: { id: string; username: string } | null;
};

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.siteUrl.startsWith('https://'),
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/** Creates a session and sets the cookie. Call only from Server Actions / Route Handlers. */
export async function createSession(userId: string, q?: Queryable): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const db = q ?? (await getDb());
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.query('insert into sessions (id, user_id, expires_at) values ($1, $2, $3)', [sha256(token), userId, expires]);
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(SESSION_DAYS * 86400));
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.query('delete from sessions where id = $1', [sha256(token)]);
  }
  jar.set(SESSION_COOKIE, '', cookieOptions(0));
}

export async function destroyAllSessions(userId: string, q?: Queryable): Promise<void> {
  const db = q ?? (await getDb());
  await db.query('delete from sessions where user_id = $1', [userId]);
}

/** The signed-in user for this request (memoized per render). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const row = await db.one<{ id: string; email: string; role: 'user' | 'admin'; profile_id: string | null; username: string | null }>(
    `select u.id, u.email, u.role, p.id as profile_id, p.username
       from sessions s
       join users u on u.id = s.user_id
       left join profiles p on p.user_id = u.id
      where s.id = $1 and s.expires_at > now()`,
    [sha256(token)],
  );
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    profile: row.profile_id && row.username ? { id: row.profile_id, username: row.username } : null,
  };
});

export async function requireUser(next = '/dashboard'): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser('/admin');
  if (user.role !== 'admin') redirect('/dashboard');
  return user;
}

export function hashToken(token: string): string {
  return sha256(token);
}
