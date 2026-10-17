/**
 * Demo content: eight clearly labelled demo profiles (one per layout) built
 * through the same pipeline as real profiles — real asset uploads, validated
 * documents and published snapshots. Demo accounts cannot sign in (unusable
 * password hash), are flagged is_demo, and show a "Demo" label publicly.
 * No analytics are fabricated: view counts start at zero.
 *
 * Disable with VYBE_SEED_DEMO=false.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Database, Queryable } from './core.ts';
import { getStorage } from '../storage/index.ts';
import { createAsset } from '../../features/uploads/process.ts';
import { validateDocument, type ProfileDocument } from '../../features/profiles/document.ts';
import { writeDocument, publishProfile } from '../../features/profiles/repository.ts';
import { THEME_PRESETS } from '../../features/themes/presets.ts';
import { mergeTheme, type ProfileTheme } from '../../features/themes/schema.ts';

const SEED_DIR = path.join(process.cwd(), 'db', 'seed-assets');
const UNLIMITED = { image: 1e9, video: 1e9, audio: 1e9, font: 1e9 };

type DemoSpec = {
  username: string;
  displayName: string;
  description: string;
  status?: string;
  location?: string;
  avatar: string;
  banner?: string;
  preset: string;
  themePatch?: Record<string, unknown>;
  typewriter?: string[];
  links: { platform: string; url: string; label?: string; kind?: 'social' | 'button'; displayMode?: 'icon' | 'button' | 'card' }[];
  badges?: { label: string; icon: string; color: string; background: string; border: string; tooltip?: string }[];
  tracks?: { file: string; title: string; artist: string }[];
  tabs?: string[];
  widgets?: (ctx: Record<string, string>) => { type: string; tab?: number; size?: 'full' | 'half' | 'tall'; config: Record<string, unknown> }[];
  gallery?: string[];
  featured?: boolean;
};

const BADGE = {
  creator: { label: 'Creator', icon: 'sparkles', color: '#ffffff', background: '#1b2a4a', border: '#7fb8ff', tooltip: 'Makes things' },
  music: { label: 'Producer', icon: 'headphones', color: '#fdf4ff', background: '#3b0764', border: '#f0abfc', tooltip: 'Makes music' },
  gamer: { label: 'Gamer', icon: 'gamepad', color: '#ffffff', background: '#2a0a1f', border: '#ff2a9d', tooltip: 'Plays too much' },
  photo: { label: 'Photographer', icon: 'camera', color: '#f5f0fa', background: '#1a0f26', border: '#b65cff' },
  code: { label: 'Developer', icon: 'code', color: '#e6fff1', background: '#052e1a', border: '#39ff88' },
  early: { label: 'Early', icon: 'rocket', color: '#ffffff', background: '#172036', border: '#60a5fa', tooltip: 'Joined early' },
};

const DEMOS: DemoSpec[] = [
  {
    username: 'nova',
    displayName: 'Nova Lumen',
    description: 'Ambient producer & visual artist. Building quiet worlds after midnight.',
    status: 'composing in the rain',
    location: 'Somewhere in the pines',
    avatar: 'avatar-nova.svg',
    preset: 'forest-glass',
    themePatch: { scenes: ['nebula', 'ocean', 'glacier'], audio: { player: 'compact' } },
    typewriter: ['Ambient producer & visual artist.', 'Building quiet worlds after midnight.', 'New EP: Rain Over Pines.'],
    links: [
      { platform: 'discord', url: 'https://discord.com' },
      { platform: 'github', url: 'https://github.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'soundcloud', url: 'https://soundcloud.com' },
    ],
    badges: [BADGE.creator, BADGE.music, BADGE.early],
    tracks: [
      { file: 'rain-over-pines.ogg', title: 'Rain Over Pines', artist: 'Nova Lumen' },
      { file: 'neon-drift.ogg', title: 'Neon Drift', artist: 'Nova Lumen' },
    ],
    featured: true,
  },
  {
    username: 'kairo',
    displayName: 'KAIRO',
    description: 'Variety streamer. Rhythm games, retro shooters, too much coffee.',
    status: 'live on fridays',
    location: 'Neo Seoul (in spirit)',
    avatar: 'avatar-kairo.svg',
    preset: 'neon-hud',
    links: [
      { platform: 'twitch', url: 'https://twitch.tv' },
      { platform: 'kick', url: 'https://kick.com' },
      { platform: 'steam', url: 'https://store.steampowered.com' },
      { platform: 'discord', url: 'https://discord.com' },
      { platform: 'x', url: 'https://x.com' },
    ],
    badges: [BADGE.gamer, BADGE.early],
    widgets: () => [
      { type: 'info', config: { title: 'Setup', items: [{ label: 'Main', value: 'Rhythm & arcade' }, { label: 'Schedule', value: 'Fri · Sat 21:00' }, { label: 'Rank', value: 'Diamond-ish' }] } },
      { type: 'button', config: { label: 'Stream schedule', url: 'https://twitch.tv', note: 'Opens Twitch' } },
    ],
    featured: true,
  },
  {
    username: 'selene',
    displayName: 'Selene Vale',
    description: 'Night photographer. Long exposures, wet streets, violet hours.',
    location: 'Lisbon',
    avatar: 'avatar-selene.svg',
    banner: 'banner-selene.svg',
    preset: 'obsidian-editorial',
    themePatch: { layoutOptions: { editorialKicker: 'Portfolio — Vol. III' } },
    links: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'behance', url: 'https://behance.net' },
      { platform: 'email', url: 'mailto:hello@example.com', label: 'Commissions' },
    ],
    badges: [BADGE.photo],
    gallery: ['art-violet.svg', 'art-ember.svg', 'art-ice.svg', 'art-moss.svg'],
    widgets: (ctx) => [
      { type: 'gallery', config: { title: 'Recent work', assetIds: ctx.gallery.split(',') } },
      { type: 'text', config: { title: 'About', body: 'Shooting cities after the rain since 2014. Prints and commissions open twice a year.' } },
    ],
    featured: true,
  },
  {
    username: 'mira',
    displayName: 'Mira Okafor',
    description: 'Product designer. I like calm interfaces and loud typography.',
    location: 'Berlin',
    avatar: 'avatar-mira.svg',
    preset: 'studio-minimal',
    links: [
      { platform: 'dribbble', url: 'https://dribbble.com' },
      { platform: 'figma', url: 'https://figma.com' },
      { platform: 'portfolio', url: 'https://example.com', label: 'Portfolio' },
      { platform: 'linkedin', url: 'https://linkedin.com' },
    ],
  },
  {
    username: 'atlas',
    displayName: 'Atlas Reyes',
    description: 'Systems engineer. Writing small tools for cold places.',
    status: 'shipping v2',
    location: 'Reykjavík',
    avatar: 'avatar-atlas.svg',
    preset: 'glacier-bento',
    links: [
      { platform: 'github', url: 'https://github.com' },
      { platform: 'gitlab', url: 'https://gitlab.com' },
      { platform: 'mastodon', url: 'https://joinmastodon.org' },
      { platform: 'website', url: 'https://example.org', label: 'Blog' },
    ],
    badges: [BADGE.code],
    gallery: ['art-ice.svg'],
    widgets: (ctx) => [
      { type: 'project', size: 'half', config: { title: 'Frostbyte', description: 'A tiny offline-first notes sync engine.', url: 'https://example.org', imageAssetId: ctx.gallery.split(',')[0], tags: ['rust', 'crdt'] } },
      { type: 'info', size: 'half', config: { title: 'Now', items: [{ label: 'Building', value: 'Frostbyte v2' }, { label: 'Reading', value: 'Designing Data-Intensive Apps' }] } },
      { type: 'contact', config: { title: 'Say hi', email: 'hello@example.org', note: 'Usually replies within a week.' } },
    ],
  },
  {
    username: 'echo',
    displayName: 'ECHO',
    description: 'Synth producer. Patches, loops and late-night sessions.',
    avatar: 'avatar-echo.svg',
    preset: 'nebula-tabs',
    themePatch: { audio: { player: 'full' } },
    links: [
      { platform: 'spotify', url: 'https://open.spotify.com' },
      { platform: 'soundcloud', url: 'https://soundcloud.com' },
      { platform: 'bandcamp', url: 'https://bandcamp.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
    ],
    badges: [BADGE.music],
    tracks: [
      { file: 'neon-drift.ogg', title: 'Neon Drift', artist: 'ECHO' },
      { file: 'rain-over-pines.ogg', title: 'Rain Over Pines (echo edit)', artist: 'ECHO' },
    ],
    tabs: ['Music', 'About'],
    widgets: (ctx) => [
      { type: 'audio', tab: 0, config: { trackId: ctx.track0 } },
      { type: 'text', tab: 1, config: { title: 'About', body: 'Modular patches, tape loops and too many presets. Everything on this page is free to listen to.' } },
      { type: 'info', tab: 1, config: { title: 'Gear', items: [{ label: 'Synth', value: 'Anything with a filter' }, { label: 'DAW', value: 'Whatever is open' }] } },
    ],
    featured: true,
  },
  {
    username: 'byte',
    displayName: 'byte',
    description: 'Security researcher. CTF player. Breaks things responsibly.',
    avatar: 'avatar-byte.svg',
    preset: 'void-terminal',
    typewriter: ['whoami → security researcher', 'cat interests.txt → ctf, reversing, coffee', 'echo "hack the planet (legally)"'],
    links: [
      { platform: 'github', url: 'https://github.com' },
      { platform: 'mastodon', url: 'https://joinmastodon.org' },
      { platform: 'email', url: 'mailto:security@example.com', label: 'PGP on request' },
    ],
    badges: [BADGE.code],
  },
  {
    username: 'marina',
    displayName: 'Marina Costa',
    description: 'Freediver and filmmaker. Stories from under the surface.',
    location: 'Azores',
    avatar: 'avatar-marina.svg',
    banner: 'banner-marina.svg',
    preset: 'ocean-creator',
    links: [
      { platform: 'youtube', url: 'https://youtube.com', label: 'Watch the films', kind: 'button', displayMode: 'button' },
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'patreon', url: 'https://patreon.com' },
    ],
    badges: [BADGE.creator],
    gallery: ['art-ice.svg', 'art-moss.svg'],
    widgets: (ctx) => [
      { type: 'project', config: { title: 'Blue Hours', description: 'A short documentary about the people who dive before sunrise.', url: 'https://example.com', imageAssetId: ctx.gallery.split(',')[0], tags: ['documentary', '2026'] } },
      { type: 'contact', config: { title: 'Work with me', email: 'hello@example.com', note: 'Brand collaborations and festival screenings.' } },
    ],
  },
];

async function rasterize(file: string): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  return sharp(path.join(SEED_DIR, file)).png().toBuffer();
}

async function upload(q: Queryable, userId: string, file: string): Promise<string> {
  const data = file.endsWith('.svg') ? await rasterize(file) : await fs.readFile(path.join(SEED_DIR, file));
  const row = await createAsset(q, getStorage(), {
    userId,
    data,
    filename: file.replace(/\.svg$/, '.png'),
    visibility: 'public',
    limits: UNLIMITED,
    quotaBytes: 1e12,
  });
  return row.id;
}

async function seedOne(db: Queryable, spec: DemoSpec) {
  const preset = THEME_PRESETS.find((p) => p.id === spec.preset) ?? THEME_PRESETS[0];
  const [user] = await db.query<{ id: string }>(
    `insert into users (email, password_hash) values ($1, '!demo-account-cannot-sign-in') returning id`,
    [`demo+${spec.username}@vybe.invalid`],
  );
  const [profile] = await db.query<{ id: string }>(
    `insert into profiles (user_id, username, is_demo, is_featured) values ($1, $2, true, $3) returning id`,
    [user.id, spec.username, spec.featured ?? false],
  );

  const avatar = await upload(db, user.id, spec.avatar);
  const banner = spec.banner ? await upload(db, user.id, spec.banner) : null;
  const gallery: string[] = [];
  for (const file of spec.gallery ?? []) gallery.push(await upload(db, user.id, file));
  const tracks = [];
  for (const track of spec.tracks ?? []) {
    tracks.push({ id: randomUUID(), assetId: await upload(db, user.id, track.file), title: track.title, artist: track.artist, coverAssetId: avatar });
  }
  const tabs = (spec.tabs ?? []).map((label, i) => ({ id: randomUUID(), label, icon: i === 0 ? 'music' : 'user' }));
  const ctx: Record<string, string> = { gallery: gallery.join(','), track0: tracks[0]?.id ?? '' };

  let theme: ProfileTheme = mergeTheme(preset.theme, spec.themePatch ?? {});
  if (spec.typewriter) theme = mergeTheme(theme, { typewriter: { enabled: true, strings: spec.typewriter } });

  const input = {
    profile: {
      displayName: spec.displayName,
      description: spec.description,
      statusText: spec.status ?? '',
      location: spec.location ?? '',
      pronouns: '',
      avatarAssetId: avatar,
      bannerAssetId: banner,
      visibility: 'public',
    },
    theme,
    seo: { title: `${spec.displayName} (demo)`, description: spec.description },
    links: spec.links.map((link) => ({ id: randomUUID(), kind: link.kind ?? 'social', label: link.label ?? '', displayMode: link.displayMode ?? 'icon', ...link })),
    tabs,
    widgets: (spec.widgets?.(ctx) ?? []).map((w) => ({ id: randomUUID(), type: w.type, size: w.size ?? 'full', tabId: w.tab !== undefined ? tabs[w.tab]?.id ?? null : null, config: w.config })),
    badges: (spec.badges ?? []).map((b) => ({ id: randomUUID(), tooltip: '', ...b })),
    tracks,
  };
  const result = validateDocument(input);
  if (!result.ok) throw new Error(`Demo ${spec.username} invalid: ${JSON.stringify(result.issues)}`);
  await writeDocument(db, profile.id, result.doc as ProfileDocument);
  await publishProfile(db, profile.id);
}

export async function seedDemoContent(db: Database): Promise<number> {
  let created = 0;
  for (const spec of DEMOS) {
    const exists = await db.one('select 1 from profiles where lower(username) = $1', [spec.username]);
    if (exists) continue;
    await db.tx((q) => seedOne(q, spec));
    created++;
  }
  return created;
}

export const DEMO_USERNAMES = DEMOS.map((d) => d.username);
