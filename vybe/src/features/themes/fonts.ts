/**
 * Curated font library. Every font is self-hosted through @fontsource (see
 * font-faces.ts), so no request leaves the site and browsers only download the
 * faces a profile actually uses.
 */
export type FontCategory = 'sans' | 'serif' | 'mono' | 'display' | 'gothic' | 'pixel' | 'script';

export type FontDef = { key: string; label: string; family: string; category: FontCategory };

export const FONTS: readonly FontDef[] = [
  { key: 'inter', label: 'Inter', family: "'Inter', system-ui, sans-serif", category: 'sans' },
  { key: 'space-grotesk', label: 'Space Grotesk', family: "'Space Grotesk', system-ui, sans-serif", category: 'sans' },
  { key: 'outfit', label: 'Outfit', family: "'Outfit', system-ui, sans-serif", category: 'sans' },
  { key: 'sora', label: 'Sora', family: "'Sora', system-ui, sans-serif", category: 'sans' },
  { key: 'playfair', label: 'Playfair Display', family: "'Playfair Display', Georgia, serif", category: 'serif' },
  { key: 'cormorant', label: 'Cormorant Garamond', family: "'Cormorant Garamond', Georgia, serif", category: 'serif' },
  { key: 'dm-serif', label: 'DM Serif Display', family: "'DM Serif Display', Georgia, serif", category: 'serif' },
  { key: 'jetbrains-mono', label: 'JetBrains Mono', family: "'JetBrains Mono', ui-monospace, monospace", category: 'mono' },
  { key: 'ibm-plex-mono', label: 'IBM Plex Mono', family: "'IBM Plex Mono', ui-monospace, monospace", category: 'mono' },
  { key: 'space-mono', label: 'Space Mono', family: "'Space Mono', ui-monospace, monospace", category: 'mono' },
  { key: 'syne', label: 'Syne', family: "'Syne', system-ui, sans-serif", category: 'display' },
  { key: 'unbounded', label: 'Unbounded', family: "'Unbounded', system-ui, sans-serif", category: 'display' },
  { key: 'orbitron', label: 'Orbitron', family: "'Orbitron', system-ui, sans-serif", category: 'display' },
  { key: 'bebas', label: 'Bebas Neue', family: "'Bebas Neue', Impact, sans-serif", category: 'display' },
  { key: 'monoton', label: 'Monoton', family: "'Monoton', system-ui, sans-serif", category: 'display' },
  { key: 'unifraktur', label: 'UnifrakturMaguntia', family: "'UnifrakturMaguntia', serif", category: 'gothic' },
  { key: 'unifraktur-cook', label: 'UnifrakturCook', family: "'UnifrakturCook', serif", category: 'gothic' },
  { key: 'pirata', label: 'Pirata One', family: "'Pirata One', serif", category: 'gothic' },
  { key: 'grenze', label: 'Grenze Gotisch', family: "'Grenze Gotisch', serif", category: 'gothic' },
  { key: 'press-start', label: 'Press Start 2P', family: "'Press Start 2P', ui-monospace, monospace", category: 'pixel' },
  { key: 'vt323', label: 'VT323', family: "'VT323', ui-monospace, monospace", category: 'pixel' },
  { key: 'silkscreen', label: 'Silkscreen', family: "'Silkscreen', ui-monospace, monospace", category: 'pixel' },
  { key: 'caveat', label: 'Caveat', family: "'Caveat', cursive", category: 'script' },
  { key: 'pacifico', label: 'Pacifico', family: "'Pacifico', cursive", category: 'script' },
];

/** `custom` selects the creator's uploaded font (typography.customFontAssetId). */
export const FONT_KEYS = [...FONTS.map((font) => font.key), 'custom'] as const;

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  sans: 'Sans-serif',
  serif: 'Serif',
  mono: 'Monospace',
  display: 'Display',
  gothic: 'Gothic',
  pixel: 'Pixel',
  script: 'Script',
};

const byKey = new Map(FONTS.map((font) => [font.key, font]));

export const CUSTOM_FONT_FAMILY = 'VybeCustomFont';

export function fontFamily(key: string): string {
  if (key === 'custom') return `'${CUSTOM_FONT_FAMILY}', 'Inter', system-ui, sans-serif`;
  return byKey.get(key)?.family ?? byKey.get('inter')!.family;
}
