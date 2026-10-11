/**
 * Colour themes. Every theme defines the full token set, which drives the
 * whole interface: surfaces, borders, text, accents, charts, glows, the
 * animated background and the 3D lighting.
 */
import type { Appearance, ThemeId } from '@/domain/settings'
import { ensureContrast, luminance, mix } from '@/lib/color'

export interface ThemeTokens {
  bg: string
  bg2: string
  surface: string
  surface2: string
  border: string
  text: string
  muted: string
  accent: string
  accent2: string
  highlight: string
  success: string
  warning: string
  danger: string
}

export interface ThemeDef {
  id: ThemeId
  name: string
  description: string
  tokens: ThemeTokens
}

const status = { success: '#34d399', warning: '#fbbf24', danger: '#f87171' }

export const THEMES: ThemeDef[] = [
  {
    id: 'void-blue',
    name: 'Void Blue',
    description: 'Deep midnight with electric cyan and violet. The default system look.',
    tokens: { bg: '#050914', bg2: '#0b1838', surface: '#0a1226', surface2: '#101b36', border: '#1d2b4e', text: '#e6f0ff', muted: '#8ea3c7', accent: '#38bdf8', accent2: '#8b5cf6', highlight: '#e2b955', ...status },
  },
  {
    id: 'violet-eclipse',
    name: 'Violet Eclipse',
    description: 'Dark violet with magenta flares.',
    tokens: { bg: '#0a0614', bg2: '#1d0f3a', surface: '#120b22', surface2: '#1b1131', border: '#30205a', text: '#f1eaff', muted: '#a998cc', accent: '#a78bfa', accent2: '#ec4899', highlight: '#fcd34d', ...status },
  },
  {
    id: 'crimson-hunter',
    name: 'Crimson Hunter',
    description: 'Blood-red intensity with ember orange.',
    tokens: { bg: '#0d0507', bg2: '#2c0a12', surface: '#170a0d', surface2: '#221014', border: '#431c24', text: '#ffeef0', muted: '#cc99a0', accent: '#f43f5e', accent2: '#fb923c', highlight: '#fbbf24', ...status, danger: '#fca5a5' },
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    description: 'Code-green glow over a dark grid.',
    tokens: { bg: '#030d09', bg2: '#062b1c', surface: '#08170f', surface2: '#0d2117', border: '#17442d', text: '#e6fff2', muted: '#8fc2a6', accent: '#34d399', accent2: '#22d3ee', highlight: '#d9f99d', ...status, success: '#a3e635' },
  },
  {
    id: 'arctic-silver',
    name: 'Arctic Silver',
    description: 'Cool steel, ice blue and quiet precision.',
    tokens: { bg: '#0b0f14', bg2: '#1b2533', surface: '#111821', surface2: '#18212d', border: '#2b3748', text: '#f1f5f9', muted: '#9caabb', accent: '#cbd5e1', accent2: '#7dd3fc', highlight: '#f8fafc', ...status },
  },
  {
    id: 'golden-ascension',
    name: 'Golden Ascension',
    description: 'Royal gold and warm amber.',
    tokens: { bg: '#0c0904', bg2: '#2b1f08', surface: '#16110a', surface2: '#201810', border: '#41321a', text: '#fff8e7', muted: '#cdb98f', accent: '#fbbf24', accent2: '#f97316', highlight: '#fde68a', ...status },
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'Hot magenta and electric cyan.',
    tokens: { bg: '#07040f', bg2: '#1c0733', surface: '#100a1c', surface2: '#170f28', border: '#381b60', text: '#f8f5ff', muted: '#aa9fcf', accent: '#ff3fd8', accent2: '#00e5ff', highlight: '#f5ff3a', ...status },
  },
  {
    id: 'dark-obsidian',
    name: 'Dark Obsidian',
    description: 'Near-black stone with restrained blue.',
    tokens: { bg: '#050505', bg2: '#151517', surface: '#0e0e10', surface2: '#161619', border: '#29292e', text: '#f4f4f5', muted: '#a1a1aa', accent: '#60a5fa', accent2: '#a78bfa', highlight: '#d4d4d8', ...status },
  },
  {
    id: 'celestial-purple',
    name: 'Celestial Purple',
    description: 'Starlit indigo with soft pink nebulae.',
    tokens: { bg: '#080617', bg2: '#1d1549', surface: '#100c26', surface2: '#171236', border: '#2d2563', text: '#eef0ff', muted: '#a6a8d8', accent: '#a5b4fc', accent2: '#f0abfc', highlight: '#fde68a', ...status },
  },
  {
    id: 'midnight-rose',
    name: 'Midnight Rose',
    description: 'Deep plum with rose-gold light.',
    tokens: { bg: '#0d0610', bg2: '#2b0f26', surface: '#170b17', surface2: '#211020', border: '#43203d', text: '#ffeef8', muted: '#d29dbb', accent: '#fb7185', accent2: '#c084fc', highlight: '#fda4af', ...status },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Pure greyscale for zero distraction.',
    tokens: { bg: '#0a0a0a', bg2: '#1a1a1a', surface: '#121212', surface2: '#1a1a1a', border: '#303030', text: '#fafafa', muted: '#a3a3a3', accent: '#e5e5e5', accent2: '#a3a3a3', highlight: '#ffffff', success: '#d4d4d4', warning: '#e5e5e5', danger: '#f5f5f5' },
  },
]

/** Builds a full, readable token set from four user-chosen colours. */
export function customTokens(c: Appearance['customTheme']): ThemeTokens {
  // Keep the background dark enough for light text.
  const bg = luminance(c.background) > 0.08 ? mix(c.background, '#000000', 0.7) : c.background
  return {
    bg,
    bg2: mix(bg, c.accent2, 0.18),
    surface: mix(bg, '#ffffff', 0.04),
    surface2: mix(bg, '#ffffff', 0.08),
    border: mix(bg, c.accent, 0.25),
    text: '#f1f5f9',
    muted: '#9ca9bc',
    accent: ensureContrast(c.accent, bg, 4.5),
    accent2: ensureContrast(c.accent2, bg, 3),
    highlight: ensureContrast(c.highlight, bg, 4.5),
    ...status,
  }
}

export function resolveTokens(appearance: Pick<Appearance, 'themeId' | 'customTheme'>): ThemeTokens {
  if (appearance.themeId === 'custom') return customTokens(appearance.customTheme)
  return (THEMES.find((t) => t.id === appearance.themeId) ?? THEMES[0]).tokens
}

export function themeName(id: ThemeId): string {
  return id === 'custom' ? 'Custom colours' : (THEMES.find((t) => t.id === id)?.name ?? id)
}

/** Text colour placed on top of an accent-coloured surface. */
export function onColor(hex: string): string {
  return luminance(hex) > 0.35 ? '#050816' : '#ffffff'
}
