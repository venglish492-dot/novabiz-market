/*
 * Service-role helpers for full-stack E2E runs (local `supabase start` or a
 * disposable staging project). Never point these at production data.
 */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? '';
const SECRET = process.env.E2E_SUPABASE_SECRET_KEY ?? '';

export const fullStackConfigured = Boolean(process.env.E2E_FULL && SUPABASE_URL && SECRET && process.env.E2E_SUPABASE_PUBLISHABLE_KEY);

const headers = () => ({ apikey: SECRET, Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' });

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}${path}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
  const text = await response.text();
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path} → ${response.status}: ${text}`);
  return (text ? JSON.parse(text) : null) as T;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
}

export async function createUser(prefix: string): Promise<TestUser> {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  const password = `Pw-${Math.random().toString(36).slice(2)}-9x`;
  const name = `E2E ${prefix}`;
  const user = await call<{ id: string }>('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: name } }),
  });
  return { id: user.id, email, password, name };
}

export async function setRole(userId: string, role: string) {
  await call(`/rest/v1/profiles?id=eq.${userId}`, { method: 'PATCH', body: JSON.stringify({ role }), headers: { Prefer: 'return=minimal' } });
}

export async function select<T = Record<string, unknown>>(table: string, query: string): Promise<T[]> {
  return call<T[]>(`/rest/v1/${table}?${query}`);
}

export async function insert<T = Record<string, unknown>>(table: string, row: Record<string, unknown>): Promise<T> {
  const rows = await call<T[]>(`/rest/v1/${table}`, { method: 'POST', body: JSON.stringify(row), headers: { Prefer: 'return=representation' } });
  return rows[0];
}

/** Sign in through the Auth API like a client would (publishable key + password). */
export async function passwordSession(email: string, password: string): Promise<{ access_token: string; user: { id: string } }> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: process.env.E2E_SUPABASE_PUBLISHABLE_KEY ?? '', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`password sign-in failed: ${response.status}`);
  return response.json();
}
