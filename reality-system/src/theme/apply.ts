/** Applies theme tokens and layout preferences to the document root. */
import type { Appearance } from '@/domain/settings'
import { hexToRgb } from '@/lib/color'
import { onColor, resolveTokens, type ThemeTokens } from './themes'

const CACHE_KEY = 'reality-system:appearance-cache'

export function applyTokens(tokens: ThemeTokens, root: HTMLElement = document.documentElement): void {
  for (const [k, v] of Object.entries(tokens)) {
    root.style.setProperty(`--rs-${k}`, v)
    const [r, g, b] = hexToRgb(v)
    root.style.setProperty(`--rs-${k}-rgb`, `${r} ${g} ${b}`)
  }
  root.style.setProperty('--rs-on-accent', onColor(tokens.accent))
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokens.bg)
}

export function applyAppearance(appearance: Appearance, reducedMotion: boolean): void {
  const root = document.documentElement
  applyTokens(resolveTokens(appearance), root)
  root.dataset.density = appearance.density
  root.dataset.motion = reducedMotion ? 'minimal' : appearance.motion
  root.dataset.reducedMotion = reducedMotion ? 'true' : 'false'
  root.dataset.theme = appearance.themeId
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ themeId: appearance.themeId, customTheme: appearance.customTheme, density: appearance.density }))
  } catch {
    /* storage may be unavailable; the database remains the source of truth */
  }
}

/** Applies the last-used theme instantly at startup (before the database opens) to avoid a flash. */
export function applyCachedAppearance(): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return
    const cached = JSON.parse(raw) as Pick<Appearance, 'themeId' | 'customTheme' | 'density'>
    applyTokens(resolveTokens(cached))
    document.documentElement.dataset.density = cached.density
  } catch {
    /* ignore a corrupt cache */
  }
}
