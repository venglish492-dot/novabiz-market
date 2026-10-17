import 'server-only';
import { cache } from 'react';
import { getDb } from '@/lib/db';
import { limits } from '@/config/limits';
import { referencedAssetIds, validateDocument, type DocumentIssue, type ProfileDocument } from './document';
import { buildSnapshot, publishProfile, readDocument, resolveAssets, writeDocument } from './repository';
import { normalizeUsername, validateUsername } from './username';
import { STARTER_THEME } from '@/features/themes/presets';
import { parseTheme } from '@/features/themes/schema';
import type { AssetMap, PublishedSnapshot, RenderableProfile } from './types';

export type EditorState = {
  profileId: string;
  username: string;
  doc: ProfileDocument;
  revision: number;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
  hasUnpublishedChanges: boolean;
  verified: boolean;
  aliases: string[];
};

type ProfileMeta = {
  id: string;
  username: string;
  is_published: boolean;
  published_at: Date | null;
  updated_at: Date;
  is_verified: boolean;
  revision: number;
};

export async function getEditorState(userId: string): Promise<EditorState | null> {
  const db = await getDb();
  const meta = await db.one<ProfileMeta>(
    'select id, username, is_published, published_at, updated_at, is_verified, revision from profiles where user_id = $1',
    [userId],
  );
  if (!meta) return null;
  const current = await readDocument(db, meta.id);
  if (!current) return null;
  const aliases = await db.query<{ alias: string }>('select alias from profile_aliases where profile_id = $1 order by created_at', [meta.id]);
  return {
    profileId: meta.id,
    username: meta.username,
    doc: current.doc,
    revision: meta.revision,
    isPublished: meta.is_published,
    publishedAt: meta.published_at?.toISOString() ?? null,
    updatedAt: meta.updated_at.toISOString(),
    hasUnpublishedChanges: !meta.published_at || meta.updated_at > meta.published_at,
    verified: meta.is_verified,
    aliases: aliases.map((a) => a.alias),
  };
}

export type SaveResult =
  | { ok: true; revision: number; updatedAt: string }
  | { ok: false; reason: 'invalid'; issues: DocumentIssue[] }
  | { ok: false; reason: 'conflict'; message: string }
  | { ok: false; reason: 'not_found' };

export async function saveDraft(userId: string, input: unknown, expectedRevision: number): Promise<SaveResult> {
  const validated = validateDocument(input);
  if (!validated.ok) return { ok: false, reason: 'invalid', issues: validated.issues };
  const doc = validated.doc;
  const db = await getDb();

  // Every referenced upload must belong to this account.
  const ids = referencedAssetIds(doc);
  if (ids.length) {
    const owned = await db.query<{ id: string }>('select id from assets where id = any($1::uuid[]) and user_id = $2', [ids, userId]);
    const ownedSet = new Set(owned.map((row) => row.id));
    const missing = ids.filter((id) => !ownedSet.has(id));
    if (missing.length) {
      return { ok: false, reason: 'invalid', issues: [{ path: 'assets', message: 'Some selected media no longer exists in your library. Pick it again.' }] };
    }
  }

  return db.tx(async (q) => {
    const rows = await q.query<{ id: string; revision: number; updated_at: Date }>(
      'update profiles set revision = revision + 1 where user_id = $1 and revision = $2 returning id, revision, updated_at',
      [userId, expectedRevision],
    );
    if (!rows.length) {
      const exists = await q.query('select 1 from profiles where user_id = $1', [userId]);
      if (!exists.length) return { ok: false as const, reason: 'not_found' as const };
      return { ok: false as const, reason: 'conflict' as const, message: 'This profile was changed in another tab or device. Reload to get the latest version.' };
    }
    await writeDocument(q, rows[0].id, doc);
    const [after] = await q.query<{ updated_at: Date }>('select updated_at from profiles where id = $1', [rows[0].id]);
    return { ok: true as const, revision: rows[0].revision, updatedAt: after.updated_at.toISOString() };
  });
}

export async function publishForUser(userId: string): Promise<{ ok: true; username: string; publishedAt: string; warnings: string[] } | { ok: false; message: string }> {
  const db = await getDb();
  const profile = await db.one<{ id: string; username: string; suspended_at: Date | null }>('select id, username, suspended_at from profiles where user_id = $1', [userId]);
  if (!profile) return { ok: false, message: 'Claim a username first.' };
  if (profile.suspended_at) return { ok: false, message: 'This profile is suspended by moderation and can’t be published. Contact support.' };
  return db.tx(async (q) => {
    const snapshot = await publishProfile(q, profile.id);
    if (!snapshot) return { ok: false as const, message: 'Profile not found.' };
    const current = await readDocument(q, profile.id);
    const referenced = current ? referencedAssetIds(current.doc) : [];
    const hidden = referenced.filter((id) => !snapshot.assets[id]);
    const warnings = hidden.length ? [`${hidden.length} private file(s) are hidden on your public page. Make them public or unlisted in Media to show them.`] : [];
    return { ok: true as const, username: profile.username, publishedAt: snapshot.publishedAt, warnings };
  });
}

export async function unpublishForUser(userId: string): Promise<void> {
  const db = await getDb();
  await db.query('update profiles set is_published = false where user_id = $1', [userId]);
}

export async function isUsernameAvailable(input: string): Promise<{ available: boolean; username: string; error?: string }> {
  const check = validateUsername(input);
  if (!check.ok) return { available: false, username: normalizeUsername(input), error: check.error };
  const db = await getDb();
  const taken = await db.one(
    `select 1 from profiles where lower(username) = $1 union all select 1 from profile_aliases where alias = $1 limit 1`,
    [check.username],
  );
  return taken ? { available: false, username: check.username, error: 'That username is taken.' } : { available: true, username: check.username };
}

export async function claimUsername(userId: string, input: string): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const availability = await isUsernameAvailable(input);
  if (!availability.available) return { ok: false, error: availability.error ?? 'Unavailable.' };
  const db = await getDb();
  try {
    await db.tx(async (q) => {
      const existing = await q.query('select 1 from profiles where user_id = $1', [userId]);
      if (existing.length) throw new Error('already_has_profile');
      await q.query(
        `insert into profiles (user_id, username, display_name, theme, seo) values ($1, $2, $3, $4::jsonb, '{}'::jsonb)`,
        [userId, availability.username, availability.username, JSON.stringify(STARTER_THEME)],
      );
    });
    return { ok: true, username: availability.username };
  } catch (error) {
    if (error instanceof Error && error.message === 'already_has_profile') return { ok: false, error: 'You already have a profile.' };
    // Unique violation: someone claimed it a moment ago.
    return { ok: false, error: 'That username was just taken. Try another.' };
  }
}

export async function changeUsername(userId: string, input: string): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const availability = await isUsernameAvailable(input);
  if (!availability.available) return { ok: false, error: availability.error ?? 'Unavailable.' };
  const db = await getDb();
  try {
    const rows = await db.query<{ id: string }>('update profiles set username = $2, updated_at = now() where user_id = $1 returning id', [userId, availability.username]);
    if (!rows.length) return { ok: false, error: 'Claim a username first.' };
    // Keep the published page in sync with the new name.
    const published = await db.one<{ is_published: boolean }>('select is_published from profiles where id = $1', [rows[0].id]);
    if (published?.is_published) await publishProfile(db, rows[0].id);
    return { ok: true, username: availability.username };
  } catch {
    return { ok: false, error: 'That username was just taken. Try another.' };
  }
}

export async function addAlias(userId: string, input: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await getDb();
  const profile = await db.one<{ id: string }>('select id from profiles where user_id = $1', [userId]);
  if (!profile) return { ok: false, error: 'Claim a username first.' };
  const count = await db.one<{ n: number }>('select count(*)::int as n from profile_aliases where profile_id = $1', [profile.id]);
  if ((count?.n ?? 0) >= limits.aliases) return { ok: false, error: `You can have up to ${limits.aliases} aliases.` };
  const availability = await isUsernameAvailable(input);
  if (!availability.available) return { ok: false, error: availability.error ?? 'Unavailable.' };
  try {
    await db.query('insert into profile_aliases (alias, profile_id) values ($1, $2)', [availability.username, profile.id]);
    return { ok: true };
  } catch {
    return { ok: false, error: 'That alias was just taken.' };
  }
}

export async function removeAlias(userId: string, alias: string): Promise<void> {
  const db = await getDb();
  await db.query(
    'delete from profile_aliases where alias = $1 and profile_id = (select id from profiles where user_id = $2)',
    [normalizeUsername(alias), userId],
  );
}

// ----- Public reads ------------------------------------------------------------

export type PublicLookup =
  | { kind: 'profile'; profile: RenderableProfile; publishedAt: string; indexable: boolean }
  | { kind: 'redirect'; username: string }
  | { kind: 'not_found' };

type PublicRow = {
  id: string;
  username: string;
  published_snapshot: PublishedSnapshot | null;
  view_count: number;
  is_verified: boolean;
  is_demo: boolean;
  visibility: 'public' | 'unlisted';
};

export const getPublicProfile = cache(async (rawUsername: string): Promise<PublicLookup> => {
  const username = normalizeUsername(decodeURIComponent(rawUsername));
  if (!/^[a-z0-9._-]{1,40}$/.test(username)) return { kind: 'not_found' };
  const db = await getDb();
  const row = await db.one<PublicRow>(
    `select id, username, published_snapshot, view_count, is_verified, is_demo, visibility
       from profiles
      where lower(username) = $1 and is_published and suspended_at is null`,
    [username],
  );
  if (!row) {
    const alias = await db.one<{ username: string }>(
      `select p.username from profile_aliases a join profiles p on p.id = a.profile_id
        where a.alias = $1 and p.is_published and p.suspended_at is null`,
      [username],
    );
    return alias ? { kind: 'redirect', username: alias.username } : { kind: 'not_found' };
  }
  if (!row.published_snapshot) return { kind: 'not_found' };
  const snapshot = row.published_snapshot;
  const doc = { ...snapshot.doc, theme: parseTheme(snapshot.doc.theme) };
  return {
    kind: 'profile',
    publishedAt: snapshot.publishedAt,
    indexable: row.visibility === 'public' && !doc.seo?.noindex,
    profile: {
      id: row.id,
      username: row.username,
      doc,
      assets: snapshot.assets ?? {},
      viewCount: row.view_count,
      verified: row.is_verified,
      isDemo: row.is_demo,
    },
  };
});

/** Owner-only preview of the current draft (includes private files). */
export async function getDraftPreview(userId: string): Promise<RenderableProfile | null> {
  const db = await getDb();
  const meta = await db.one<{ id: string; username: string; view_count: number; is_verified: boolean; is_demo: boolean }>(
    'select id, username, view_count, is_verified, is_demo from profiles where user_id = $1',
    [userId],
  );
  if (!meta) return null;
  const current = await readDocument(db, meta.id);
  if (!current) return null;
  const assets: AssetMap = await resolveAssets(db, userId, referencedAssetIds(current.doc), { includePrivate: true });
  return { id: meta.id, username: meta.username, doc: current.doc, assets, viewCount: meta.view_count, verified: meta.is_verified, isDemo: meta.is_demo };
}

export type ProfileCard = {
  username: string;
  displayName: string;
  description: string;
  avatarUrl: string | null;
  viewCount: number;
  isDemo: boolean;
  verified: boolean;
  layout: string;
  preset: string;
  accent: string;
  publishedAt: string | null;
};

function toCard(row: { username: string; published_snapshot: PublishedSnapshot; view_count: number; is_demo: boolean; is_verified: boolean; published_at: Date | null }): ProfileCard {
  const snap = row.published_snapshot;
  const theme = parseTheme(snap.doc.theme);
  const avatarId = snap.doc.profile.avatarAssetId;
  return {
    username: row.username,
    displayName: snap.doc.profile.displayName || row.username,
    description: snap.doc.profile.description,
    avatarUrl: avatarId && snap.assets[avatarId] ? snap.assets[avatarId].url : null,
    viewCount: row.view_count,
    isDemo: row.is_demo,
    verified: row.is_verified,
    layout: theme.layout,
    preset: theme.background.presetId,
    accent: theme.colors.accent,
    publishedAt: row.published_at?.toISOString() ?? null,
  };
}

const LISTABLE = `is_published and suspended_at is null and visibility = 'public' and published_snapshot is not null`;

export async function listProfiles(kind: 'featured' | 'recent' | 'popular', limit = 12): Promise<ProfileCard[]> {
  const db = await getDb();
  const order = kind === 'recent' ? 'published_at desc' : kind === 'popular' ? 'view_count desc, published_at desc' : 'published_at desc';
  const where = kind === 'featured' ? `${LISTABLE} and is_featured` : LISTABLE;
  const rows = await db.query<Parameters<typeof toCard>[0]>(
    `select username, published_snapshot, view_count, is_demo, is_verified, published_at from profiles where ${where} order by ${order} limit $1`,
    [Math.min(Math.max(limit, 1), 100)],
  );
  return rows.map(toCard);
}

/** Ranking by unique views; `period = 30` counts views in the last 30 days from analytics. */
export async function leaderboard(period: 'all' | '30d', limit = 50): Promise<(ProfileCard & { score: number })[]> {
  const db = await getDb();
  if (period === 'all') {
    const cards = await listProfiles('popular', limit);
    return cards.map((card) => ({ ...card, score: card.viewCount }));
  }
  const rows = await db.query<Parameters<typeof toCard>[0] & { score: number }>(
    `select p.username, p.published_snapshot, p.view_count, p.is_demo, p.is_verified, p.published_at, count(e.id)::int as score
       from profiles p
       join analytics_events e on e.profile_id = p.id and e.type = 'view' and e.created_at > now() - interval '30 days'
      where ${LISTABLE.replace(/\b(is_published|suspended_at|visibility|published_snapshot)\b/g, 'p.$1')}
      group by p.id
      order by score desc
      limit $1`,
    [limit],
  );
  return rows.map((row) => ({ ...toCard(row), score: row.score }));
}

export { buildSnapshot };
