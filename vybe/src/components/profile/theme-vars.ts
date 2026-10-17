import type { CSSProperties } from 'react';
import { fontFamily } from '@/features/themes/fonts';
import type { ProfileTheme } from '@/features/themes/schema';

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

/**
 * Maps a validated theme onto CSS custom properties. Every value is either a
 * number or an allow-listed token from the theme schema, so nothing a creator
 * types can escape into arbitrary CSS.
 */
export function themeToVars(theme: ProfileTheme): CSSProperties {
  const { colors, card, avatar, icons, typography, gradient, animation, effects, banner } = theme;
  return {
    '--p-accent': colors.accent,
    '--p-accent-soft': rgba(colors.accent, 0.18),
    '--p-secondary': colors.secondary,
    '--p-text': colors.text,
    '--p-muted': colors.muted,
    '--p-glow': colors.glow,
    '--p-glow-soft': rgba(colors.glow, 0.35 * card.glow + 0.05),
    '--p-icon': colors.icon,
    '--p-surface': rgba(colors.surface, card.opacity),
    '--p-surface-solid': colors.surface,
    '--p-surface-raised': rgba(colors.text, 0.06),
    '--p-border': rgba(colors.border, card.borderOpacity),
    '--p-line': rgba(colors.text, 0.1),
    '--p-card-blur': `${card.blur}px`,
    '--p-card-radius': `${card.radius}px`,
    '--p-card-width': `${card.width}px`,
    '--p-card-pad': `${card.padding}px`,
    '--p-card-gap': `${card.gap}px`,
    '--p-card-border-w': `${card.borderWidth}px`,
    '--p-card-shadow': `0 30px 80px -20px rgb(0 0 0 / ${(0.75 * card.shadow).toFixed(2)}), 0 0 ${Math.round(60 * card.glow)}px ${rgba(colors.glow, 0.35 * card.glow)}`,
    '--p-avatar-size': `${avatar.size}px`,
    '--p-avatar-radius': `${avatar.radius}%`,
    '--p-avatar-border-w': `${avatar.borderWidth}px`,
    '--p-avatar-border': avatar.borderColor,
    '--p-avatar-glow': `0 0 ${Math.round(48 * avatar.glow)}px ${rgba(avatar.borderColor, 0.6 * avatar.glow)}`,
    '--p-icon-size': `${icons.size}px`,
    '--p-icon-gap': `${icons.gap}px`,
    '--p-font-username': fontFamily(typography.usernameFont),
    '--p-font-body': fontFamily(typography.bodyFont),
    '--p-font-button': fontFamily(typography.buttonFont),
    '--p-font-heading': fontFamily(typography.headingFont),
    '--p-username-size': `${typography.usernameSize}px`,
    '--p-body-size': `${typography.bodySize}px`,
    '--p-tracking': `${typography.letterSpacing}em`,
    '--p-grad-from': gradient.from,
    '--p-grad-to': gradient.to,
    '--p-grad-angle': `${gradient.angle}deg`,
    '--p-anim-duration': `${animation.duration}s`,
    '--p-anim-delay': `${animation.delay}s`,
    '--p-anim-intensity': String(animation.intensity),
    '--p-speed': String(effects.speed),
    '--p-banner-h': `${banner.height}px`,
    color: colors.text,
    fontFamily: fontFamily(typography.bodyFont),
  } as CSSProperties;
}
