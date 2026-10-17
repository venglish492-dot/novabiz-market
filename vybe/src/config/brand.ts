/**
 * Global brand configuration. Change the product name, tagline, accent colours
 * and public links here — nothing else in the codebase hardcodes them.
 */
export const brand = {
  name: 'VYBE',
  tagline: 'Your identity. Your atmosphere. Your entire digital world — in one link.',
  headline: 'Your entire world. One unforgettable link.',
  description:
    'Create a cinematic personal page with custom layouts, animated backgrounds, social links, widgets, music, and every creative feature unlocked for free.',
  supportEmail: 'support@vybe.example',
  colors: {
    background: '#070910',
    surface: '#10131d',
    surfaceRaised: '#171a27',
    primary: '#b65cff',
    secondary: '#60a5fa',
    highlight: '#d8c4ff',
    text: '#f7f7fc',
    textMuted: '#a2a8ba',
  },
  /** Shown in the footer and changelog. */
  version: '1.0.0',
} as const;

export type Brand = typeof brand;
