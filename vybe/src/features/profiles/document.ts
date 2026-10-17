/**
 * The editable profile document: everything the dashboard edits, validated as
 * a whole before it is written. Unlike the theme (which is clamped silently),
 * content errors here are reported back to the creator with a field path.
 */
import { z } from 'zod';
import { limits } from '../../config/limits.ts';
import { checkUrl } from '../../lib/security/url.ts';
import { PLATFORM_KEYS, getPlatform } from '../socials/platforms.ts';
import { themeSchema, seoSchema } from '../themes/schema.ts';
import { BADGE_ICON_KEYS } from '../badges/icons.ts';
import { spotifyPath, videoEmbed, youtubeId, discordInviteCode } from '../widgets/embeds.ts';

const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id').transform((v) => v.toLowerCase());
const assetRef = uuid.nullable().default(null);
const hex = z.string().regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i, 'Use a hex colour like #b65cff');
const clean = (max: number, label: string) =>
  z
    .string()
    .transform((value) => value.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim())
    .pipe(z.string().max(max, `${label} can be at most ${max} characters.`));

function safeUrl(options: { allowMailto?: boolean } = {}) {
  return z.string().transform((value, ctx) => {
    const result = checkUrl(value, options);
    if (!result.ok) {
      ctx.addIssue({ code: 'custom', message: result.error });
      return z.NEVER;
    }
    return result.url;
  });
}
const optionalUrl = (options: { allowMailto?: boolean } = {}) =>
  z.union([z.literal('').transform(() => null), z.null(), safeUrl(options)]).default(null);

export const linkSchema = z
  .object({
    id: uuid,
    kind: z.enum(['social', 'button']).default('social'),
    platform: z.enum(PLATFORM_KEYS).catch('custom'),
    url: z.string().max(2048),
    label: clean(60, 'Label').default(''),
    iconAssetId: assetRef,
    accent: hex.nullable().default(null),
    displayMode: z.enum(['icon', 'button', 'card']).default('icon'),
    newTab: z.boolean().default(true),
    visible: z.boolean().default(true),
  })
  .transform((link, ctx) => {
    const result = checkUrl(link.url, { allowMailto: getPlatform(link.platform).allowMailto || link.kind === 'button' });
    if (!result.ok) {
      ctx.addIssue({ code: 'custom', message: result.error, path: ['url'] });
      return z.NEVER;
    }
    return { ...link, url: result.url };
  });
export type ProfileLink = z.output<typeof linkSchema>;

export const tabSchema = z.object({
  id: uuid,
  label: clean(24, 'Tab name').pipe(z.string().min(1, 'Name the tab.')),
  icon: z.enum(BADGE_ICON_KEYS).catch('sparkles'),
});
export type ProfileTab = z.output<typeof tabSchema>;

export const badgeSchema = z.object({
  id: uuid,
  label: clean(24, 'Badge label').pipe(z.string().min(1, 'Give the badge a label.')),
  icon: z.enum(BADGE_ICON_KEYS).catch('sparkles'),
  color: hex.default('#ffffff'),
  background: hex.default('#1d1530'),
  border: hex.default('#b65cff'),
  tooltip: clean(80, 'Tooltip').default(''),
  url: optionalUrl(),
  visible: z.boolean().default(true),
});
export type ProfileBadge = z.output<typeof badgeSchema>;

export const trackSchema = z.object({
  id: uuid,
  assetId: assetRef,
  title: clean(80, 'Track title').pipe(z.string().min(1, 'Name the track.')),
  artist: clean(80, 'Artist').default(''),
  coverAssetId: assetRef,
});
export type ProfileTrack = z.output<typeof trackSchema>;

// ----- Widgets ---------------------------------------------------------------

const embedUrl = (parse: (url: string) => unknown, message: string) =>
  safeUrl().refine((url) => parse(url) !== null, message);

export const widgetConfigSchemas = {
  text: z.object({ title: clean(60, 'Title').default(''), body: clean(1000, 'Text').default('') }),
  button: z.object({ label: clean(40, 'Label').pipe(z.string().min(1, 'Add a label.')), url: safeUrl({ allowMailto: true }), note: clean(80, 'Note').default('') }),
  image: z.object({ assetId: uuid, alt: clean(140, 'Alt text').default(''), caption: clean(140, 'Caption').default(''), url: optionalUrl() }),
  gallery: z.object({ title: clean(60, 'Title').default(''), assetIds: z.array(uuid).min(1, 'Add at least one image.').max(24) }),
  youtube: z.object({ url: embedUrl(youtubeId, 'Paste a YouTube video link.'), title: clean(80, 'Title').default('') }),
  video: z.object({ url: embedUrl(videoEmbed, 'Paste a YouTube or Vimeo link.'), title: clean(80, 'Title').default('') }),
  spotify: z.object({ url: embedUrl(spotifyPath, 'Paste an open.spotify.com track, album, playlist, artist, episode or show link.'), compact: z.boolean().default(true) }),
  discord: z.object({
    inviteUrl: embedUrl(discordInviteCode, 'Paste a discord.gg invite link.'),
    serverName: clean(60, 'Server name').pipe(z.string().min(1, 'Add the server name.')),
    description: clean(140, 'Description').default(''),
    iconAssetId: assetRef,
  }),
  github: z.object({ username: z.string().trim().regex(/^[a-z\d](?:[a-z\d-]{0,38})$/i, 'Enter a GitHub username.'), note: clean(140, 'Note').default('') }),
  telegram: z.object({ handle: z.string().transform((value) => value.trim().replace(/^@/, '')).pipe(z.string().regex(/^\w{4,32}$/, 'Enter a Telegram channel or username.')), title: clean(60, 'Title').default(''), note: clean(140, 'Note').default('') }),
  project: z.object({
    title: clean(60, 'Project name').pipe(z.string().min(1, 'Name the project.')),
    description: clean(280, 'Description').default(''),
    url: optionalUrl(),
    imageAssetId: assetRef,
    tags: z.array(clean(20, 'Tag')).max(6).default([]),
  }),
  info: z.object({
    title: clean(60, 'Title').default(''),
    items: z.array(z.object({ label: clean(30, 'Label'), value: clean(80, 'Value') })).max(10).default([]),
  }),
  audio: z.object({ trackId: uuid.nullable().default(null) }),
  contact: z.object({ title: clean(60, 'Title').default('Get in touch'), email: z.union([z.literal(''), z.email('Enter a valid email.')]).default(''), url: optionalUrl(), note: clean(140, 'Note').default('') }),
  featured: z.object({ linkId: uuid.nullable().default(null), caption: clean(140, 'Caption').default('') }),
} as const;

export type WidgetType = keyof typeof widgetConfigSchemas;
export const WIDGET_TYPES = Object.keys(widgetConfigSchemas) as [WidgetType, ...WidgetType[]];

export const widgetSchema = z
  .object({
    id: uuid,
    type: z.enum(WIDGET_TYPES),
    tabId: uuid.nullable().default(null),
    size: z.enum(['full', 'half', 'tall']).default('full'),
    visible: z.boolean().default(true),
    config: z.unknown(),
  })
  .transform((widget, ctx) => {
    const parsed = widgetConfigSchemas[widget.type].safeParse(widget.config ?? {});
    if (!parsed.success) {
      for (const issue of parsed.error.issues) ctx.addIssue({ code: 'custom', message: issue.message, path: ['config', ...issue.path.map(String)] });
      return z.NEVER;
    }
    return { ...widget, config: parsed.data as Record<string, unknown> };
  });
export type ProfileWidget = { id: string; type: WidgetType; tabId: string | null; size: 'full' | 'half' | 'tall'; visible: boolean; config: Record<string, unknown> };

// ----- Document ----------------------------------------------------------------

export const profileFieldsSchema = z.object({
  displayName: clean(limits.displayName, 'Display name').default(''),
  description: clean(limits.description, 'Description').default(''),
  statusText: clean(limits.statusText, 'Status').default(''),
  location: clean(limits.location, 'Location').default(''),
  pronouns: clean(limits.pronouns, 'Pronouns').default(''),
  avatarAssetId: assetRef,
  bannerAssetId: assetRef,
  visibility: z.enum(['public', 'unlisted']).default('public'),
});
export type ProfileFields = z.output<typeof profileFieldsSchema>;

export const profileDocumentSchema = z.object({
  profile: profileFieldsSchema,
  theme: themeSchema,
  seo: seoSchema,
  links: z.array(linkSchema).max(limits.links, `At most ${limits.links} links.`),
  tabs: z.array(tabSchema).max(limits.tabs, `At most ${limits.tabs} tabs.`),
  widgets: z.array(widgetSchema).max(limits.widgets, `At most ${limits.widgets} widgets.`),
  badges: z.array(badgeSchema).max(limits.badges, `At most ${limits.badges} badges.`),
  tracks: z.array(trackSchema).max(limits.audioTracks, `At most ${limits.audioTracks} tracks.`),
});

export type ProfileDocument = {
  profile: ProfileFields;
  theme: z.output<typeof themeSchema>;
  seo: z.output<typeof seoSchema>;
  links: ProfileLink[];
  tabs: ProfileTab[];
  widgets: ProfileWidget[];
  badges: ProfileBadge[];
  tracks: ProfileTrack[];
};

export type DocumentIssue = { path: string; message: string };

export function validateDocument(input: unknown): { ok: true; doc: ProfileDocument } | { ok: false; issues: DocumentIssue[] } {
  const result = profileDocumentSchema.safeParse(input);
  if (result.success) {
    const doc = result.data as ProfileDocument;
    // Widgets may only point at tabs that exist.
    const tabIds = new Set(doc.tabs.map((tab) => tab.id));
    for (const widget of doc.widgets) if (widget.tabId && !tabIds.has(widget.tabId)) widget.tabId = null;
    return { ok: true, doc };
  }
  return {
    ok: false,
    issues: result.error.issues.slice(0, 20).map((issue) => ({ path: issue.path.map(String).join('.'), message: issue.message })),
  };
}

/** All asset ids a document references (for ownership checks and publishing). */
export function referencedAssetIds(doc: ProfileDocument): string[] {
  const ids = new Set<string>();
  const add = (id: unknown) => {
    if (typeof id === 'string') ids.add(id);
  };
  add(doc.profile.avatarAssetId);
  add(doc.profile.bannerAssetId);
  add(doc.theme.background.assetId);
  add(doc.theme.typography.customFontAssetId);
  add(doc.seo.ogImageAssetId);
  add(doc.seo.faviconAssetId);
  for (const link of doc.links) add(link.iconAssetId);
  for (const track of doc.tracks) {
    add(track.assetId);
    add(track.coverAssetId);
  }
  for (const widget of doc.widgets) {
    const config = widget.config;
    add(config.assetId);
    add(config.imageAssetId);
    add(config.iconAssetId);
    if (Array.isArray(config.assetIds)) config.assetIds.forEach(add);
  }
  return [...ids];
}
