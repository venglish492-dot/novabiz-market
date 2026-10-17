/**
 * Built-in visual presets. Each scene preset is a distinct environment with its
 * own palette, atmosphere and typography — not a tint of one background.
 * `applyScenePreset` restyles a theme for a scene while keeping the creator's
 * layout and content choices.
 */
import { DEFAULT_THEME, mergeTheme, type ProfileTheme, type ScenePresetId, type LayoutId } from './schema.ts';

export type ScenePreset = {
  id: ScenePresetId;
  name: string;
  mood: string;
  swatch: [string, string, string];
  patch: Record<string, unknown>;
};

export const SCENE_PRESET_LIST: readonly ScenePreset[] = [
  {
    id: 'rainforest',
    name: 'Blue Rainforest',
    mood: 'Night pines, drifting mist, rain and bioluminescent flowers.',
    swatch: ['#06122a', '#1f4f9c', '#7fd4ff'],
    patch: {
      colors: { accent: '#7fb8ff', secondary: '#5eead4', text: '#eef5ff', muted: '#9fb3cf', surface: '#06101f', glow: '#6aa8ff', icon: '#ffffff', border: '#9cc2ff' },
      effects: { rain: true, rainIntensity: 0.55, particles: 'fireflies', particleColor: '#8fe3ff', particleDensity: 0.3, fog: true, fogColor: '#8fb0ff', fogDensity: 0.35, vignette: 0.6 },
      card: { opacity: 0.38, blur: 16, borderOpacity: 0.18, glow: 0.3 },
      avatar: { borderColor: '#7fb8ff' },
      typography: { usernameFont: 'space-grotesk', bodyFont: 'inter' },
      gradient: { from: '#7fb8ff', to: '#5eead4' },
    },
  },
  {
    id: 'nebula',
    name: 'Purple Nebula',
    mood: 'Slow-turning violet gas clouds and twinkling stars.',
    swatch: ['#0b0418', '#6b21a8', '#f0abfc'],
    patch: {
      colors: { accent: '#d58cff', secondary: '#f0abfc', text: '#fbf5ff', muted: '#c0a8d8', surface: '#12061f', glow: '#c084fc', icon: '#ffffff', border: '#e9d5ff' },
      effects: { rain: false, particles: 'stars', particleColor: '#f5d0fe', fog: false, vignette: 0.5 },
      card: { opacity: 0.32, blur: 18, borderOpacity: 0.2, glow: 0.4 },
      avatar: { borderColor: '#d58cff' },
      typography: { usernameFont: 'syne', bodyFont: 'outfit' },
      gradient: { from: '#d58cff', to: '#60a5fa' },
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Night City',
    mood: 'Neon skyline, wet streets and electric haze.',
    swatch: ['#07020f', '#ff2a9d', '#00e5ff'],
    patch: {
      colors: { accent: '#ff2a9d', secondary: '#00e5ff', text: '#f9f7ff', muted: '#a9a2c2', surface: '#0a0414', glow: '#ff2a9d', icon: '#ffffff', border: '#ff7ac6' },
      effects: { rain: true, rainIntensity: 0.75, particles: 'none', fog: true, fogColor: '#ff5fb7', fogDensity: 0.35, vignette: 0.55 },
      card: { opacity: 0.55, blur: 10, radius: 10, borderOpacity: 0.35, glow: 0.45 },
      avatar: { borderColor: '#00e5ff', radius: 22 },
      typography: { usernameFont: 'orbitron', bodyFont: 'space-grotesk', usernameEffect: 'glitch' },
      gradient: { from: '#ff2a9d', to: '#00e5ff' },
    },
  },
  {
    id: 'obsidian',
    name: 'Obsidian Violet',
    mood: 'Black glass shards veined with slow violet light.',
    swatch: ['#050307', '#2a1145', '#b65cff'],
    patch: {
      colors: { accent: '#b65cff', secondary: '#e9d5ff', text: '#f5f0fa', muted: '#9d91ad', surface: '#070409', glow: '#9333ea', icon: '#e9d5ff', border: '#b65cff' },
      effects: { rain: false, particles: 'dust', particleColor: '#c4a1ff', fog: false, vignette: 0.75, grain: 0.2 },
      card: { opacity: 0.6, blur: 8, borderOpacity: 0.22, glow: 0.2 },
      avatar: { borderColor: '#b65cff', decoration: 'halo' },
      typography: { usernameFont: 'cormorant', bodyFont: 'inter', usernameEffect: 'shimmer' },
      gradient: { from: '#b65cff', to: '#f0abfc' },
    },
  },
  {
    id: 'glacier',
    name: 'Icy Frontier',
    mood: 'Blue-hour glaciers, aurora ribbons and drifting snow.',
    swatch: ['#0d2a4a', '#9fd4f0', '#7cf7d4'],
    patch: {
      colors: { accent: '#7cf7d4', secondary: '#9fd4f0', text: '#f4fbff', muted: '#a7c4d6', surface: '#081a2c', glow: '#7cf7d4', icon: '#ffffff', border: '#c7ecff' },
      effects: { rain: false, particles: 'snow', particleColor: '#ffffff', fog: true, fogColor: '#d6f1ff', fogDensity: 0.3, vignette: 0.35 },
      card: { opacity: 0.3, blur: 22, borderOpacity: 0.3, glow: 0.2 },
      avatar: { borderColor: '#c7ecff' },
      typography: { usernameFont: 'unbounded', bodyFont: 'sora' },
      gradient: { from: '#7cf7d4', to: '#9fd4f0' },
    },
  },
  {
    id: 'ocean',
    name: 'Dream Ocean',
    mood: 'Under the surface: caustic light, sun shafts and rising bubbles.',
    swatch: ['#020617', '#0c4a6e', '#67e8f9'],
    patch: {
      colors: { accent: '#67e8f9', secondary: '#38bdf8', text: '#f0fdff', muted: '#9ec7d4', surface: '#03182a', glow: '#22d3ee', icon: '#ffffff', border: '#a5f3fc' },
      effects: { rain: false, particles: 'bubbles', particleColor: '#bdf4ff', fog: true, fogColor: '#38bdf8', fogDensity: 0.3, vignette: 0.5 },
      card: { opacity: 0.32, blur: 18, radius: 28, borderOpacity: 0.22, glow: 0.3 },
      avatar: { borderColor: '#67e8f9' },
      typography: { usernameFont: 'outfit', bodyFont: 'outfit' },
      gradient: { from: '#67e8f9', to: '#818cf8' },
    },
  },
  {
    id: 'studio',
    name: 'Minimal Dark Studio',
    mood: 'One soft spotlight on a seamless charcoal backdrop.',
    swatch: ['#0b0b0c', '#2a2826', '#e9e4dc'],
    patch: {
      colors: { accent: '#e9e4dc', secondary: '#c9b8a6', text: '#f5f3ef', muted: '#a19c95', surface: '#121212', glow: '#ffffff', icon: '#f5f3ef', border: '#ffffff' },
      effects: { rain: false, particles: 'none', fog: false, vignette: 0.7, grain: 0.25 },
      card: { opacity: 0.5, blur: 6, borderOpacity: 0.1, glow: 0, shadow: 0.4 },
      avatar: { borderColor: '#e9e4dc', decoration: 'none', glow: 0 },
      typography: { usernameFont: 'dm-serif', bodyFont: 'inter', usernameEffect: 'none' },
      gradient: { from: '#e9e4dc', to: '#c9b8a6' },
    },
  },
  {
    id: 'particles',
    name: 'Particle Universe',
    mood: 'A slow 3D vortex of glowing particles (WebGL).',
    swatch: ['#03030a', '#3b82f6', '#b65cff'],
    patch: {
      colors: { accent: '#8b9dff', secondary: '#b65cff', text: '#f5f7ff', muted: '#a3a9c9', surface: '#05060f', glow: '#8b9dff', icon: '#ffffff', border: '#c7d2fe' },
      effects: { rain: false, particles: 'none', fog: false, vignette: 0.45 },
      card: { opacity: 0.4, blur: 14, borderOpacity: 0.2, glow: 0.35 },
      avatar: { borderColor: '#8b9dff', decoration: 'orbit' },
      typography: { usernameFont: 'sora', bodyFont: 'inter' },
      gradient: { from: '#8b9dff', to: '#b65cff' },
    },
  },
];

const sceneById = new Map(SCENE_PRESET_LIST.map((preset) => [preset.id, preset]));

export function getScenePreset(id: string): ScenePreset {
  return sceneById.get(id as ScenePresetId) ?? SCENE_PRESET_LIST[0];
}

export function applyScenePreset(theme: ProfileTheme, id: ScenePresetId): ProfileTheme {
  const preset = getScenePreset(id);
  return mergeTheme(theme, { ...preset.patch, background: { ...theme.background, type: 'preset', presetId: id } });
}

/** Layout-specific starting points used when a creator switches layout from the gallery. */
export const LAYOUT_INFO: Record<LayoutId, { name: string; description: string }> = {
  cinematic: { name: 'Cinematic Glass', description: 'Centered translucent panel over an atmospheric scene.' },
  minimal: { name: 'Minimal Identity', description: 'Small card, generous space, quiet typography.' },
  creator: { name: 'Creator Studio', description: 'Big avatar, clear buttons and a portfolio area.' },
  futuristic: { name: 'Futuristic Interface', description: 'HUD-style panels, cool light and compact metadata.' },
  editorial: { name: 'Editorial', description: 'Wide banner, large type, magazine composition.' },
  bento: { name: 'Modular Bento', description: 'A grid of tiles for identity, links, media and widgets.' },
  tabs: { name: 'Multi-Tab', description: 'Identity panel with tabs for widgets, links and media.' },
  terminal: { name: 'Terminal', description: 'Monospace, command-line flavoured and restrained.' },
};

/** Complete looks offered in the editor's preset gallery. */
export const THEME_PRESETS: readonly { id: string; name: string; theme: ProfileTheme }[] = [
  { id: 'forest-glass', name: 'Forest Glass', theme: applyScenePreset(mergeTheme(DEFAULT_THEME, { layout: 'cinematic', effects: { intro: 'cinematic' } }), 'rainforest') },
  { id: 'nebula-tabs', name: 'Nebula Tabs', theme: applyScenePreset(mergeTheme(DEFAULT_THEME, { layout: 'tabs' }), 'nebula') },
  { id: 'neon-hud', name: 'Neon HUD', theme: applyScenePreset(mergeTheme(DEFAULT_THEME, { layout: 'futuristic', effects: { cursor: 'trail', cursorColor: '#00e5ff' } }), 'cyberpunk') },
  { id: 'obsidian-editorial', name: 'Obsidian Editorial', theme: applyScenePreset(mergeTheme(DEFAULT_THEME, { layout: 'editorial' }), 'obsidian') },
  { id: 'glacier-bento', name: 'Glacier Bento', theme: applyScenePreset(mergeTheme(DEFAULT_THEME, { layout: 'bento' }), 'glacier') },
  { id: 'ocean-creator', name: 'Ocean Creator', theme: applyScenePreset(mergeTheme(DEFAULT_THEME, { layout: 'creator' }), 'ocean') },
  { id: 'studio-minimal', name: 'Studio Minimal', theme: applyScenePreset(mergeTheme(DEFAULT_THEME, { layout: 'minimal', card: { align: 'center' } }), 'studio') },
  {
    id: 'void-terminal',
    name: 'Void Terminal',
    theme: mergeTheme(applyScenePreset(DEFAULT_THEME, 'particles'), {
      layout: 'terminal',
      typography: { usernameFont: 'jetbrains-mono', bodyFont: 'jetbrains-mono', buttonFont: 'jetbrains-mono', usernameEffect: 'none' },
      colors: { accent: '#39ff88', secondary: '#7dd3fc', text: '#d7ffe6', muted: '#7fae92', icon: '#39ff88', border: '#39ff88', glow: '#39ff88' },
      avatar: { radius: 8, borderColor: '#39ff88', decoration: 'none' },
      card: { radius: 6 },
    }),
  },
];

/** The theme a brand-new profile starts with. */
export const STARTER_THEME: ProfileTheme = THEME_PRESETS[0].theme;
