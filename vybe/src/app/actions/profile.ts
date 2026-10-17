'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { limits } from '@/config/limits';
import { rateLimit } from '@/lib/security/rate-limit';
import {
  addAlias,
  changeUsername,
  claimUsername,
  publishForUser,
  removeAlias,
  saveDraft,
  unpublishForUser,
  type SaveResult,
} from '@/features/profiles/service';
import { parseTheme, type ProfileTheme } from '@/features/themes/schema';
import { deleteAsset, renameAsset, setAssetVisibility, type LibraryAsset } from '@/features/uploads/service';

const SESSION_EXPIRED = 'Your session expired. Sign in again to keep editing — your unsaved changes are still on this page.';

export async function saveDraftAction(doc: unknown, revision: number): Promise<SaveResult | { ok: false; reason: 'auth' | 'rate'; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: 'auth', message: SESSION_EXPIRED };
  const limit = await rateLimit(`save:${user.id}`, 240, 60);
  if (!limit.ok) return { ok: false, reason: 'rate', message: 'Saving too often — waiting a moment.' };
  return saveDraft(user.id, doc, Number(revision));
}

export async function publishAction() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, message: SESSION_EXPIRED };
  const result = await publishForUser(user.id);
  if (result.ok) {
    revalidatePath(`/u/${result.username}`);
    revalidatePath('/discover');
  }
  return result;
}

export async function unpublishAction() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, message: SESSION_EXPIRED };
  await unpublishForUser(user.id);
  return { ok: true as const };
}

export async function claimUsernameAction(_prev: { error?: string } | undefined, form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard');
  const limit = await rateLimit(`claim:${user.id}`, 20, 3600);
  if (!limit.ok) return { error: 'Too many attempts. Try again later.' };
  const result = await claimUsername(user.id, String(form.get('username') || ''));
  if (!result.ok) return { error: result.error };
  redirect('/dashboard?welcome=1');
}

export async function changeUsernameAction(username: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: SESSION_EXPIRED };
  const limit = await rateLimit(`rename:${user.id}`, 10, 3600);
  if (!limit.ok) return { ok: false as const, error: 'You’ve changed your username a lot recently. Try again later.' };
  return changeUsername(user.id, username);
}

export async function addAliasAction(alias: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: SESSION_EXPIRED };
  const limit = await rateLimit(`alias:${user.id}`, 20, 3600);
  if (!limit.ok) return { ok: false as const, error: 'Too many attempts. Try again later.' };
  return addAlias(user.id, alias);
}

export async function removeAliasAction(alias: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: SESSION_EXPIRED };
  await removeAlias(user.id, alias);
  return { ok: true as const };
}

// ----- Theme presets -------------------------------------------------------------

export type SavedPreset = { id: string; name: string; theme: ProfileTheme; createdAt: string };

export async function listPresetsAction(): Promise<SavedPreset[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const db = await getDb();
  const rows = await db.query<{ id: string; name: string; theme: unknown; created_at: Date }>(
    'select id, name, theme, created_at from theme_presets where user_id = $1 order by created_at desc',
    [user.id],
  );
  return rows.map((row) => ({ id: row.id, name: row.name, theme: parseTheme(row.theme), createdAt: row.created_at.toISOString() }));
}

export async function savePresetAction(name: string, theme: unknown): Promise<{ ok: true; preset: SavedPreset } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SESSION_EXPIRED };
  const clean = String(name).replace(/[\u0000-\u001f]/g, '').trim().slice(0, 40);
  if (!clean) return { ok: false, error: 'Name your preset.' };
  const db = await getDb();
  const count = await db.one<{ n: number }>('select count(*)::int as n from theme_presets where user_id = $1', [user.id]);
  if ((count?.n ?? 0) >= limits.customPresets) return { ok: false, error: `You can keep up to ${limits.customPresets} presets. Delete one first.` };
  const parsed = parseTheme(theme);
  const [row] = await db.query<{ id: string; created_at: Date }>('insert into theme_presets (user_id, name, theme) values ($1, $2, $3::jsonb) returning id, created_at', [
    user.id,
    clean,
    JSON.stringify(parsed),
  ]);
  return { ok: true, preset: { id: row.id, name: clean, theme: parsed, createdAt: row.created_at.toISOString() } };
}

export async function deletePresetAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };
  const db = await getDb();
  await db.query('delete from theme_presets where id = $1 and user_id = $2', [id, user.id]);
  return { ok: true as const };
}

// ----- Media library ----------------------------------------------------------------

export async function renameAssetAction(id: string, name: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: SESSION_EXPIRED };
  return (await renameAsset(user.id, id, name)) ? { ok: true as const } : { ok: false as const, error: 'Couldn’t rename that file.' };
}

export async function setAssetVisibilityAction(id: string, visibility: LibraryAsset['visibility']) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: SESSION_EXPIRED };
  return (await setAssetVisibility(user.id, id, visibility)) ? { ok: true as const } : { ok: false as const, error: 'Couldn’t change visibility.' };
}

export async function deleteAssetAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: SESSION_EXPIRED };
  return (await deleteAsset(user.id, id)) ? { ok: true as const } : { ok: false as const, error: 'Couldn’t delete that file.' };
}
