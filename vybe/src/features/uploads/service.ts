import 'server-only';
import { getDb } from '@/lib/db';
import { getStorage } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { readDocument } from '@/features/profiles/repository';
import { referencedAssetIds } from '@/features/profiles/document';
import { fileUrl, posterUrl } from '@/features/profiles/types';
import type { AssetKind } from './sniff';

export type LibraryAsset = {
  id: string;
  kind: AssetKind;
  mime: string;
  filename: string;
  sizeBytes: number;
  visibility: 'private' | 'unlisted' | 'public';
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  createdAt: string;
  url: string;
  posterUrl: string | null;
};

type Row = {
  id: string;
  kind: AssetKind;
  mime: string;
  filename: string;
  size_bytes: number;
  visibility: LibraryAsset['visibility'];
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  created_at: Date;
  poster_key: string | null;
};

export function toLibraryAsset(row: Row): LibraryAsset {
  return {
    id: row.id,
    kind: row.kind,
    mime: row.mime,
    filename: row.filename,
    sizeBytes: row.size_bytes,
    visibility: row.visibility,
    width: row.width,
    height: row.height,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at.toISOString(),
    url: fileUrl(row.id),
    posterUrl: row.poster_key ? posterUrl(row.id) : null,
  };
}

const COLUMNS = 'id, kind, mime, filename, size_bytes, visibility, width, height, duration_seconds, created_at, poster_key';

export async function listAssets(userId: string): Promise<LibraryAsset[]> {
  const db = await getDb();
  const rows = await db.query<Row>(`select ${COLUMNS} from assets where user_id = $1 order by created_at desc limit 1000`, [userId]);
  return rows.map(toLibraryAsset);
}

export async function storageUsage(userId: string): Promise<{ usedBytes: number; files: number }> {
  const db = await getDb();
  const row = await db.one<{ used: number; files: number }>('select coalesce(sum(size_bytes), 0)::float8 as used, count(*)::int as files from assets where user_id = $1', [userId]);
  return { usedBytes: row?.used ?? 0, files: row?.files ?? 0 };
}

/** Asset ids used by the creator's draft profile (for "in use" indicators). */
export async function assetsInUse(userId: string): Promise<string[]> {
  const db = await getDb();
  const profile = await db.one<{ id: string }>('select id from profiles where user_id = $1', [userId]);
  if (!profile) return [];
  const current = await readDocument(db, profile.id);
  return current ? referencedAssetIds(current.doc) : [];
}

export async function renameAsset(userId: string, id: string, name: string): Promise<boolean> {
  const clean = name.replace(/[\u0000-\u001f\u007f<>:"|?*\\/]/g, '').trim().slice(0, 120);
  if (!clean) return false;
  const db = await getDb();
  const rows = await db.query('update assets set filename = $3, updated_at = now() where id = $1 and user_id = $2 returning id', [id, userId, clean]);
  return rows.length > 0;
}

export async function setAssetVisibility(userId: string, id: string, visibility: LibraryAsset['visibility']): Promise<boolean> {
  if (!['private', 'unlisted', 'public'].includes(visibility)) return false;
  const db = await getDb();
  const rows = await db.query('update assets set visibility = $3, updated_at = now() where id = $1 and user_id = $2 returning id', [id, userId, visibility]);
  return rows.length > 0;
}

export async function deleteAsset(userId: string, id: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db.query<{ storage_key: string; poster_key: string | null }>('delete from assets where id = $1 and user_id = $2 returning storage_key, poster_key', [id, userId]);
  if (!rows.length) return false;
  const storage = getStorage();
  for (const key of [rows[0].storage_key, rows[0].poster_key]) {
    if (key) await storage.delete(key).catch((error) => logger.warn('storage.delete_failed', { error }));
  }
  return true;
}

export type ServedAsset = { id: string; userId: string; kind: AssetKind; mime: string; filename: string; storageKey: string; posterKey: string | null; visibility: LibraryAsset['visibility']; sizeBytes: number };

/** Returns the asset only if `viewerId` may see it (owner, or not private). */
export async function getServableAsset(id: string, viewerId: string | null): Promise<ServedAsset | null> {
  const db = await getDb();
  const row = await db.one<{ id: string; user_id: string; kind: AssetKind; mime: string; filename: string; storage_key: string; poster_key: string | null; visibility: LibraryAsset['visibility']; size_bytes: number }>(
    'select id, user_id, kind, mime, filename, storage_key, poster_key, visibility, size_bytes from assets where id = $1',
    [id],
  );
  if (!row) return null;
  if (row.visibility === 'private' && row.user_id !== viewerId) return null;
  return { id: row.id, userId: row.user_id, kind: row.kind, mime: row.mime, filename: row.filename, storageKey: row.storage_key, posterKey: row.poster_key, visibility: row.visibility, sizeBytes: row.size_bytes };
}

export type MediaPageData = LibraryAsset & { owner: { username: string | null; published: boolean }; isOwner: boolean };

export async function getMediaPage(id: string, viewerId: string | null): Promise<MediaPageData | null> {
  const db = await getDb();
  const row = await db.one<Row & { user_id: string; username: string | null; is_published: boolean | null }>(
    `select a.${COLUMNS.split(', ').join(', a.')}, a.user_id, p.username, p.is_published
       from assets a left join profiles p on p.user_id = a.user_id
      where a.id = $1`,
    [id],
  );
  if (!row) return null;
  if (row.visibility === 'private' && row.user_id !== viewerId) return null;
  return {
    ...toLibraryAsset(row),
    owner: { username: row.is_published ? row.username : null, published: Boolean(row.is_published) },
    isOwner: row.user_id === viewerId,
  };
}

/** Public gallery: files their owners marked "public", from published, unsuspended profiles. */
export async function recentPublicMedia(limit = 24): Promise<(LibraryAsset & { username: string })[]> {
  const db = await getDb();
  const rows = await db.query<Row & { username: string }>(
    `select a.${COLUMNS.split(', ').join(', a.')}, p.username
       from assets a join profiles p on p.user_id = a.user_id
      where a.visibility = 'public' and a.kind in ('image', 'video') and p.is_published and p.suspended_at is null
      order by a.created_at desc limit $1`,
    [limit],
  );
  return rows.map((row) => ({ ...toLibraryAsset(row), username: row.username }));
}
