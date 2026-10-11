import { describe, expect, it } from 'vitest'
import { DEFAULT_WIDGETS, parseProfile, parseSettings } from './settings'
import { contrastRatio } from '@/lib/color'
import { customTokens } from '@/theme/themes'

describe('settings parsing', () => {
  it('fills defaults for empty or old data without losing existing choices', () => {
    const s = parseSettings({ appearance: { themeId: 'crimson-hunter' } })
    expect(s.appearance.themeId).toBe('crimson-hunter')
    expect(s.appearance.motion).toBe('balanced')
    expect(s.sound.enabled).toBe(false) // sounds default to off
    expect(s.dashboard.widgets).toHaveLength(DEFAULT_WIDGETS.length)
  })

  it('recovers from an invalid section by resetting only that section', () => {
    const s = parseSettings({ appearance: { themeId: 'not-a-theme' }, sound: { enabled: true } })
    expect(s.appearance.themeId).toBe('void-blue')
    expect(s.sound.enabled).toBe(true)
  })

  it('appends widgets added in newer versions and removes duplicates', () => {
    const s = parseSettings({ dashboard: { widgets: [DEFAULT_WIDGETS[1], DEFAULT_WIDGETS[1]] } })
    expect(s.dashboard.widgets[0].id).toBe(DEFAULT_WIDGETS[1].id)
    expect(new Set(s.dashboard.widgets.map((w) => w.id)).size).toBe(DEFAULT_WIDGETS.length)
  })

  it('profile never requires identifying information', () => {
    const p = parseProfile(undefined)
    expect(p.displayName).toBe('')
    expect(p.onboardingComplete).toBe(false)
  })
})

describe('custom theme contrast', () => {
  it('keeps custom accent colours readable on the background', () => {
    const t = customTokens({ accent: '#101820', accent2: '#111111', highlight: '#202020', background: '#0a0a0a' })
    expect(contrastRatio(t.accent, t.bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(t.highlight, t.bg)).toBeGreaterThanOrEqual(4.5)
  })
})
