import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_THEME, mergeTheme, parseTheme, LAYOUTS } from '../../src/features/themes/schema.ts';
import { THEME_PRESETS, SCENE_PRESET_LIST, applyScenePreset } from '../../src/features/themes/presets.ts';

test('missing or garbage theme input falls back to defaults', () => {
  for (const input of [undefined, null, 'garbage', 42, [], {}]) {
    const theme = parseTheme(input);
    assert.equal(theme.layout, 'cinematic');
    assert.equal(theme.card.width, DEFAULT_THEME.card.width);
  }
});

test('out-of-range numbers are clamped, not rejected', () => {
  const theme = parseTheme({ card: { opacity: 5, blur: -10, width: 99999 }, effects: { speed: 100 } });
  assert.equal(theme.card.opacity, 1);
  assert.equal(theme.card.blur, 0);
  assert.equal(theme.card.width, 960);
  assert.equal(theme.effects.speed, 2);
});

test('colours must be hex — CSS injection attempts are replaced by defaults', () => {
  const theme = parseTheme({ colors: { accent: 'red;}</style><script>alert(1)</script>', text: 'url(javascript:alert(1))', muted: '#ABCDEF' } });
  assert.equal(theme.colors.accent, DEFAULT_THEME.colors.accent);
  assert.equal(theme.colors.text, DEFAULT_THEME.colors.text);
  assert.equal(theme.colors.muted, '#abcdef');
});

test('enums and fonts only accept allow-listed values', () => {
  const theme = parseTheme({ layout: 'evil', typography: { usernameFont: "Arial'; }", usernameEffect: 'explode' } });
  assert.equal(theme.layout, 'cinematic');
  assert.equal(theme.typography.usernameFont, DEFAULT_THEME.typography.usernameFont);
  assert.equal(theme.typography.usernameEffect, DEFAULT_THEME.typography.usernameEffect);
});

test('asset references must be UUIDs', () => {
  const theme = parseTheme({ background: { assetId: '../../etc/passwd' }, typography: { customFontAssetId: 'C5E5E8B2-0D2B-4C1A-9C5E-6F1D2A3B4C5D' } });
  assert.equal(theme.background.assetId, null);
  assert.equal(theme.typography.customFontAssetId, 'c5e5e8b2-0d2b-4c1a-9c5e-6f1d2a3b4c5d');
});

test('typewriter strings are filtered and capped', () => {
  const theme = parseTheme({ typewriter: { strings: ['a', 3, null, 'b', ...Array(20).fill('x')] } });
  assert.ok(theme.typewriter.strings.length <= 8);
  assert.deepEqual(theme.typewriter.strings.slice(0, 2), ['a', 'b']);
});

test('mergeTheme deep-merges and re-validates', () => {
  const merged = mergeTheme(DEFAULT_THEME, { card: { radius: 4 }, colors: { accent: 'nope' } });
  assert.equal(merged.card.radius, 4);
  assert.equal(merged.card.width, DEFAULT_THEME.card.width);
  assert.equal(merged.colors.accent, DEFAULT_THEME.colors.accent);
});

test('legacy v0 themes are migrated', () => {
  assert.equal(parseTheme({ layoutId: 'bento' }).layout, 'bento');
});

test('every preset is valid and the eight scenes are distinct', () => {
  for (const preset of THEME_PRESETS) assert.deepEqual(parseTheme(preset.theme), preset.theme);
  const accents = new Set(SCENE_PRESET_LIST.map((s) => s.patch.colors && (s.patch.colors as { accent: string }).accent));
  assert.equal(accents.size, 8);
  assert.equal(new Set(THEME_PRESETS.map((p) => p.theme.layout)).size, LAYOUTS.length);
});

test('applying a scene keeps the layout', () => {
  const theme = applyScenePreset(mergeTheme(DEFAULT_THEME, { layout: 'terminal' }), 'cyberpunk');
  assert.equal(theme.layout, 'terminal');
  assert.equal(theme.background.presetId, 'cyberpunk');
});
