/**
 * Low-level profile persistence (no auth checks — callers in service.ts and the
 * seed are responsible for authorization). Relative imports only, so the CLI
 * scripts can use it too.
 */
import type { Queryable } from '../../lib/db/core.ts';
import { parseSeo, parseTheme } from '../themes/schema.ts';
import { referencedAssetIds, type ProfileDocument, type ProfileWidget } from './document.ts';
import { fileUrl, posterUrl, type AssetMap, type PublishedSnapshot } from './types.ts';

type ProfileRow = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  description: string;
  status_text: string;
  location: string;
  pronouns: string;
  avatar_asset_id: string | null;
  banner_asset_id: string | null;
  theme: unknown;
  seo: unknown;
  visibility: 'public' | 'unlisted';
  revision: number;
};

export async function readDocument(q: Queryable, profileId: string): Promise<{ doc: ProfileDocument; revision: number; username: string; userId: string } | null> {
  const [row] = await q.query<ProfileRow>('select * from profiles where id = $1', [profileId]);
  if (!row) return null;
  const [links, tabs, widgets, badges, tracks] = await Promise.all([
    q.query<Record<string, unknown>>('select * from links where profile_id = $1 order by position, id', [profileId]),
    q.query<Record<string, unknown>>('select * from tabs where profile_id = $1 order by position, id', [profileId]),
    q.query<Record<string, unknown>>('select * from widgets where profile_id = $1 order by position, id', [profileId]),
    q.query<Record<string, unknown>>('select * from badges where profile_id = $1 order by position, id', [profileId]),
    q.query<Record<string, unknown>>('select * from audio_tracks where profile_id = $1 order by position, id', [profileId]),
  ]);
  const doc: ProfileDocument = {
    profile: {
      displayName: row.display_name,
      description: row.description,
      statusText: row.status_text,
      location: row.location,
      pronouns: row.pronouns,
      avatarAssetId: row.avatar_asset_id,
      bannerAssetId: row.banner_asset_id,
      visibility: row.visibility,
    },
    theme: parseTheme(row.theme),
    seo: parseSeo(row.seo),
    links: links.map((l) => ({
      id: l.id as string,
      kind: l.kind as 'social' | 'button',
      platform: l.platform as string,
      url: l.url as string,
      label: l.label as string,
      iconAssetId: (l.icon_asset_id as string) ?? null,
      accent: (l.accent as string) ?? null,
      displayMode: l.display_mode as 'icon' | 'button' | 'card',
      newTab: l.new_tab as boolean,
      visible: l.visible as boolean,
    })),
    tabs: tabs.map((t) => ({ id: t.id as string, label: t.label as string, icon: (t.icon as string) || 'sparkles' })) as ProfileDocument['tabs'],
    widgets: widgets.map((w) => ({
      id: w.id as string,
      type: w.type as ProfileWidget['type'],
      tabId: (w.tab_id as string) ?? null,
      size: w.size as ProfileWidget['size'],
      visible: w.visible as boolean,
      config: (w.config as Record<string, unknown>) ?? {},
    })),
    badges: badges.map((b) => ({
      id: b.id as string,
      label: b.label as string,
      icon: b.icon as string,
      color: b.color as string,
      background: b.background as string,
      border: b.border as string,
      tooltip: b.tooltip as string,
      url: (b.url as string) ?? null,
      visible: b.visible as boolean,
    })) as ProfileDocument['badges'],
    tracks: tracks.map((t) => ({
      id: t.id as string,
      assetId: (t.asset_id as string) ?? null,
      title: t.title as string,
      artist: t.artist as string,
      coverAssetId: (t.cover_asset_id as string) ?? null,
    })),
  };
  return { doc, revision: row.revision, username: row.username, userId: row.user_id };
}

/** Replaces the profile's draft with `doc` (already validated). Run inside a transaction. */
export async function writeDocument(q: Queryable, profileId: string, doc: ProfileDocument): Promise<void> {
  const p = doc.profile;
  await q.query(
    `update profiles set display_name = $2, description = $3, status_text = $4, location = $5, pronouns = $6,
       avatar_asset_id = $7, banner_asset_id = $8, visibility = $9, theme = $10::jsonb, seo = $11::jsonb,
       updated_at = now()
     where id = $1`,
    [profileId, p.displayName, p.description, p.statusText, p.location, p.pronouns, p.avatarAssetId, p.bannerAssetId, p.visibility, JSON.stringify(doc.theme), JSON.stringify(doc.seo)],
  );

  // Children: delete rows that disappeared, upsert the rest (ids are client-generated UUIDs
  // scoped to this profile — the `profile_id = $1` guard stops cross-profile id reuse).
  const sync = async (table: string, ids: string[]) => {
    if (ids.length) await q.query(`delete from ${table} where profile_id = $1 and not (id = any($2::uuid[]))`, [profileId, ids]);
    else await q.query(`delete from ${table} where profile_id = $1`, [profileId]);
  };

  await sync('widgets', doc.widgets.map((w) => w.id));
  await sync('tabs', doc.tabs.map((t) => t.id));
  for (const [position, tab] of doc.tabs.entries()) {
    await q.query(
      `insert into tabs (id, profile_id, label, icon, position) values ($1, $2, $3, $4, $5)
       on conflict (id) do update set label = excluded.label, icon = excluded.icon, position = excluded.position
       where tabs.profile_id = excluded.profile_id`,
      [tab.id, profileId, tab.label, tab.icon, position],
    );
  }

  await sync('links', doc.links.map((l) => l.id));
  for (const [position, l] of doc.links.entries()) {
    await q.query(
      `insert into links (id, profile_id, kind, platform, url, label, icon_asset_id, accent, display_mode, new_tab, visible, position)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       on conflict (id) do update set kind = excluded.kind, platform = excluded.platform, url = excluded.url, label = excluded.label,
         icon_asset_id = excluded.icon_asset_id, accent = excluded.accent, display_mode = excluded.display_mode,
         new_tab = excluded.new_tab, visible = excluded.visible, position = excluded.position
       where links.profile_id = excluded.profile_id`,
      [l.id, profileId, l.kind, l.platform, l.url, l.label, l.iconAssetId, l.accent, l.displayMode, l.newTab, l.visible, position],
    );
  }

  for (const [position, w] of doc.widgets.entries()) {
    await q.query(
      `insert into widgets (id, profile_id, tab_id, type, config, size, visible, position)
       values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
       on conflict (id) do update set tab_id = excluded.tab_id, type = excluded.type, config = excluded.config,
         size = excluded.size, visible = excluded.visible, position = excluded.position
       where widgets.profile_id = excluded.profile_id`,
      [w.id, profileId, w.tabId, w.type, JSON.stringify(w.config), w.size, w.visible, position],
    );
  }

  await sync('badges', doc.badges.map((b) => b.id));
  for (const [position, b] of doc.badges.entries()) {
    await q.query(
      `insert into badges (id, profile_id, label, icon, color, background, border, tooltip, url, visible, position)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (id) do update set label = excluded.label, icon = excluded.icon, color = excluded.color,
         background = excluded.background, border = excluded.border, tooltip = excluded.tooltip, url = excluded.url,
         visible = excluded.visible, position = excluded.position
       where badges.profile_id = excluded.profile_id`,
      [b.id, profileId, b.label, b.icon, b.color, b.background, b.border, b.tooltip, b.url, b.visible, position],
    );
  }

  await sync('audio_tracks', doc.tracks.map((t) => t.id));
  for (const [position, t] of doc.tracks.entries()) {
    await q.query(
      `insert into audio_tracks (id, profile_id, asset_id, title, artist, cover_asset_id, position)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set asset_id = excluded.asset_id, title = excluded.title, artist = excluded.artist,
         cover_asset_id = excluded.cover_asset_id, position = excluded.position
       where audio_tracks.profile_id = excluded.profile_id`,
      [t.id, profileId, t.assetId, t.title, t.artist, t.coverAssetId, position],
    );
  }
}

type AssetRow = { id: string; kind: 'image' | 'video' | 'audio' | 'font'; mime: string; width: number | null; height: number | null; poster_key: string | null; visibility: string; user_id: string };

/**
 * Resolves asset ids to public URLs. Only the owner's own, non-private assets
 * are included, so a published profile can never leak a private upload or
 * another user's file.
 */
export async function resolveAssets(q: Queryable, ownerId: string, ids: string[], options: { includePrivate?: boolean } = {}): Promise<AssetMap> {
  if (!ids.length) return {};
  const rows = await q.query<AssetRow>(
    'select id, kind, mime, width, height, poster_key, visibility, user_id from assets where id = any($1::uuid[]) and user_id = $2',
    [ids, ownerId],
  );
  const map: AssetMap = {};
  for (const row of rows) {
    if (row.visibility === 'private' && !options.includePrivate) continue;
    map[row.id] = {
      id: row.id,
      kind: row.kind,
      url: fileUrl(row.id),
      posterUrl: row.poster_key ? posterUrl(row.id) : null,
      width: row.width,
      height: row.height,
      mime: row.mime,
    };
  }
  return map;
}

/** Removes hidden items so private drafts of links/widgets never reach the public snapshot. */
export function publicView(doc: ProfileDocument): ProfileDocument {
  return {
    ...doc,
    links: doc.links.filter((l) => l.visible),
    widgets: doc.widgets.filter((w) => w.visible),
    badges: doc.badges.filter((b) => b.visible),
  };
}

export async function buildSnapshot(q: Queryable, profileId: string): Promise<PublishedSnapshot | null> {
  const current = await readDocument(q, profileId);
  if (!current) return null;
  const doc = publicView(current.doc);
  const assets = await resolveAssets(q, current.userId, referencedAssetIds(doc));
  return { v: 1, username: current.username, doc, assets, publishedAt: new Date().toISOString() };
}

export async function publishProfile(q: Queryable, profileId: string): Promise<PublishedSnapshot | null> {
  const snapshot = await buildSnapshot(q, profileId);
  if (!snapshot) return null;
  await q.query(
    `update profiles set published_snapshot = $2::jsonb, is_published = true, published_at = now(), updated_at = now() where id = $1`,
    [profileId, JSON.stringify(snapshot)],
  );
  return snapshot;
}
