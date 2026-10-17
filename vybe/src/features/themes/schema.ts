/**
 * The profile theme: every visual setting a creator can change, validated
 * defensively. `parseTheme` NEVER throws — missing, corrupted or out-of-range
 * values fall back to (or are clamped to) defaults — so a bad settings row can
 * never break a public profile. Colours are restricted to hex, fonts and enums
 * to allow-lists, so no user value can inject CSS or markup.
 *
 * Bump THEME_VERSION and extend `migrateTheme` when the shape changes.
 */
import { z } from 'zod';
import { FONT_KEYS } from './fonts.ts';

export const THEME_VERSION = 1;

export const LAYOUTS = ['cinematic', 'minimal', 'creator', 'futuristic', 'editorial', 'bento', 'tabs', 'terminal'] as const;
export type LayoutId = (typeof LAYOUTS)[number];

export const SCENE_PRESETS = ['rainforest', 'nebula', 'cyberpunk', 'obsidian', 'glacier', 'ocean', 'studio', 'particles'] as const;
export type ScenePresetId = (typeof SCENE_PRESETS)[number];

export const BACKGROUND_TYPES = ['preset', 'image', 'video', 'gradient', 'solid'] as const;
export const PARTICLE_KINDS = ['none', 'dust', 'snow', 'fireflies', 'stars', 'bubbles', 'embers', 'petals'] as const;
export const CURSOR_EFFECTS = ['none', 'glow', 'spotlight', 'trail', 'sparkle', 'ring'] as const;
export const INTRO_MODES = ['none', 'cinematic', 'enter'] as const;
export const USERNAME_EFFECTS = ['none', 'glow', 'gradient', 'shimmer', 'glitch', 'sparkle', 'rainbow'] as const;
export const ENTRANCES = ['none', 'fade', 'slide', 'stagger', 'scale', 'blur'] as const;
export const HOVERS = ['none', 'lift', 'glow', 'scale'] as const;
export const ICON_STYLES = ['glow', 'brand', 'mono', 'outline', 'pill', 'label'] as const;
export const AVATAR_DECORATIONS = ['none', 'ring', 'halo', 'orbit', 'pulse'] as const;
export const PLAYER_STYLES = ['full', 'compact', 'minimal'] as const;
export const PLAYER_PLACEMENTS = ['card', 'dock'] as const;
export const POSITIONS = ['center', 'top', 'bottom', 'left', 'right'] as const;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Object that tolerates any input (non-objects become {}), so inner defaults apply. */
function obj<T extends z.ZodRawShape>(shape: T) {
  return z.preprocess((value) => (isObject(value) ? value : {}), z.object(shape));
}

function num(min: number, max: number, fallback: number, step?: number) {
  return z.preprocess((value) => {
    const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
    const clamped = Math.min(max, Math.max(min, n));
    return step ? Math.round(clamped / step) * step : clamped;
  }, z.number());
}

const bool = (fallback: boolean) => z.boolean().catch(fallback);
const color = (fallback: string) =>
  z.preprocess((value) => (typeof value === 'string' ? value.trim().toLowerCase() : value), z.string().regex(HEX)).catch(fallback);
const oneOf = <T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) => z.enum(values).catch(fallback);
const assetId = z.preprocess((value) => (typeof value === 'string' && UUID.test(value) ? value.toLowerCase() : null), z.string().nullable());
const text = (max: number, fallback = '') =>
  z.preprocess((value) => (typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max) : fallback), z.string());
const fontKey = (fallback: (typeof FONT_KEYS)[number]) => z.enum(FONT_KEYS as unknown as [string, ...string[]]).catch(fallback);

export const themeSchema = obj({
  version: z.literal(THEME_VERSION).catch(THEME_VERSION),
  layout: oneOf(LAYOUTS, 'cinematic'),
  background: obj({
    type: oneOf(BACKGROUND_TYPES, 'preset'),
    presetId: oneOf(SCENE_PRESETS, 'rainforest'),
    assetId,
    color: color('#070910'),
    gradientFrom: color('#1b1036'),
    gradientVia: color('#0b1a3a'),
    gradientTo: color('#05060b'),
    gradientAngle: num(0, 360, 160, 1),
    animateGradient: bool(true),
    overlay: num(0, 0.9, 0.35, 0.01),
    blur: num(0, 24, 0, 0.5),
    brightness: num(0.3, 1.4, 1, 0.01),
    saturation: num(0, 2, 1, 0.01),
    position: oneOf(POSITIONS, 'center'),
    zoom: num(1, 1.6, 1.05, 0.01),
    tint: color('#000000'),
    tintStrength: num(0, 1, 0, 0.01),
  }),
  /** Additional scenes visitors can switch between with the numbered controls. */
  scenes: z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(z.enum(SCENE_PRESETS).catch('rainforest')).max(5),
  ).catch([]),
  effects: obj({
    animate: bool(true),
    rain: bool(false),
    rainIntensity: num(0, 1, 0.5, 0.01),
    particles: oneOf(PARTICLE_KINDS, 'dust'),
    particleColor: color('#a5c8ff'),
    particleDensity: num(0, 1, 0.45, 0.01),
    fog: bool(true),
    fogColor: color('#9fb7ff'),
    fogDensity: num(0, 1, 0.5, 0.01),
    parallax: num(0, 1, 0.5, 0.01),
    speed: num(0.25, 2, 1, 0.05),
    vignette: num(0, 1, 0.55, 0.01),
    grain: num(0, 1, 0.15, 0.01),
    cursor: oneOf(CURSOR_EFFECTS, 'none'),
    cursorColor: color('#b65cff'),
    cardTilt: bool(true),
    intro: oneOf(INTRO_MODES, 'none'),
    introText: text(40, 'click to enter'),
  }),
  colors: obj({
    accent: color('#b65cff'),
    secondary: color('#60a5fa'),
    text: color('#f7f7fc'),
    muted: color('#a2a8ba'),
    surface: color('#0b0f1c'),
    border: color('#ffffff'),
    glow: color('#7aa7ff'),
    icon: color('#ffffff'),
  }),
  gradient: obj({
    username: bool(false),
    card: bool(false),
    from: color('#b65cff'),
    to: color('#60a5fa'),
    angle: num(0, 360, 120, 1),
  }),
  card: obj({
    opacity: num(0, 1, 0.42, 0.01),
    blur: num(0, 40, 14, 0.5),
    width: num(300, 960, 620, 1),
    radius: num(0, 48, 22, 1),
    borderWidth: num(0, 4, 1, 0.5),
    borderOpacity: num(0, 1, 0.16, 0.01),
    shadow: num(0, 1, 0.6, 0.01),
    glow: num(0, 1, 0.25, 0.01),
    padding: num(12, 56, 28, 1),
    gap: num(4, 40, 18, 1),
    align: oneOf(['left', 'center'] as const, 'left'),
    position: oneOf(['center', 'top', 'bottom'] as const, 'center'),
  }),
  avatar: obj({
    size: num(56, 200, 104, 1),
    radius: num(0, 50, 50, 1),
    borderWidth: num(0, 8, 2, 0.5),
    borderColor: color('#7aa7ff'),
    glow: num(0, 1, 0.35, 0.01),
    decoration: oneOf(AVATAR_DECORATIONS, 'ring'),
  }),
  banner: obj({
    height: num(80, 320, 150, 1),
    fade: bool(true),
  }),
  icons: obj({
    style: oneOf(ICON_STYLES, 'glow'),
    size: num(16, 44, 26, 1),
    gap: num(4, 28, 14, 1),
  }),
  typography: obj({
    usernameFont: fontKey('space-grotesk'),
    bodyFont: fontKey('inter'),
    buttonFont: fontKey('inter'),
    headingFont: fontKey('space-grotesk'),
    usernameSize: num(20, 72, 34, 1),
    bodySize: num(12, 20, 15, 0.5),
    letterSpacing: num(-0.05, 0.3, 0, 0.005),
    usernameEffect: oneOf(USERNAME_EFFECTS, 'glow'),
    uppercase: bool(false),
    customFontAssetId: assetId,
  }),
  animation: obj({
    entrance: oneOf(ENTRANCES, 'stagger'),
    duration: num(0.2, 2, 0.7, 0.05),
    delay: num(0, 2, 0.1, 0.05),
    intensity: num(0, 1, 0.6, 0.01),
    hover: oneOf(HOVERS, 'lift'),
    float: bool(false),
    pulse: bool(false),
  }),
  typewriter: obj({
    enabled: bool(false),
    strings: z.preprocess(
      (value) => (Array.isArray(value) ? value.filter((item) => typeof item === 'string').slice(0, 8) : []),
      z.array(text(140)),
    ).catch([]),
    typeSpeed: num(20, 200, 70, 1),
    deleteSpeed: num(10, 150, 40, 1),
    pause: num(500, 8000, 1800, 50),
    loop: bool(true),
    cursor: bool(true),
  }),
  visibility: obj({
    displayName: bool(true),
    views: bool(true),
    badges: bool(true),
    location: bool(true),
    socials: bool(true),
    audio: bool(true),
    banner: bool(true),
    status: bool(true),
    pronouns: bool(true),
    divider: bool(true),
    controls: bool(true),
  }),
  audio: obj({
    player: oneOf(PLAYER_STYLES, 'compact'),
    placement: oneOf(PLAYER_PLACEMENTS, 'card'),
    volume: num(0, 1, 0.5, 0.01),
    playOnEnter: bool(false),
    loop: bool(true),
  }),
  layoutOptions: obj({
    bentoColumns: num(2, 4, 3, 1),
    terminalPrompt: text(24, 'guest@vybe:~$'),
    editorialKicker: text(40, ''),
  }),
});

export type ProfileTheme = z.infer<typeof themeSchema>;

/** Upgrades stored themes from older versions before validation. */
export function migrateTheme(raw: unknown): unknown {
  if (!isObject(raw)) return {};
  // v0 (pre-release) stored the layout name as `layoutId`.
  if (raw.version === undefined && typeof raw.layoutId === 'string' && raw.layout === undefined) {
    return { ...raw, layout: raw.layoutId, version: THEME_VERSION };
  }
  return raw;
}

export function parseTheme(raw: unknown): ProfileTheme {
  const result = themeSchema.safeParse(migrateTheme(raw));
  // The schema catches every field, so failure is practically impossible; the
  // fallback keeps the guarantee even if a future edit forgets a `.catch`.
  return result.success ? result.data : (themeSchema.parse({}) as ProfileTheme);
}

export const DEFAULT_THEME: ProfileTheme = parseTheme({});

/** Deep-merges a partial theme over a base and re-validates. */
export function mergeTheme(base: ProfileTheme, patch: unknown): ProfileTheme {
  const merge = (a: unknown, b: unknown): unknown => {
    if (!isObject(a) || !isObject(b)) return b === undefined ? a : b;
    const out: Record<string, unknown> = { ...a };
    for (const [key, value] of Object.entries(b)) out[key] = merge(a[key], value);
    return out;
  };
  return parseTheme(merge(base, patch));
}

// ----- SEO -----------------------------------------------------------------

export const seoSchema = obj({
  title: text(70),
  description: text(200),
  ogImageAssetId: assetId,
  faviconAssetId: assetId,
  themeColor: color('#070910'),
  noindex: bool(false),
});
export type ProfileSeo = z.infer<typeof seoSchema>;

export function parseSeo(raw: unknown): ProfileSeo {
  const result = seoSchema.safeParse(raw);
  return result.success ? result.data : (seoSchema.parse({}) as ProfileSeo);
}
