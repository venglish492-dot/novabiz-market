/**
 * Curated icon keys for decorative badges and tabs. Check-mark / shield-check
 * style icons are deliberately absent: only administrators can mark a profile
 * as verified, and decorative badges must never look like verification.
 */
export const BADGE_ICON_KEYS = [
  'sparkles', 'crown', 'gem', 'star', 'heart', 'flame', 'zap', 'music', 'code', 'gamepad', 'camera', 'palette',
  'rocket', 'moon', 'sun', 'ghost', 'skull', 'leaf', 'coffee', 'trophy', 'wand', 'headphones', 'pen', 'film',
  'globe', 'cat', 'snowflake', 'cloud', 'feather', 'diamond', 'anchor', 'bolt', 'flower', 'swords', 'terminal',
  'image', 'link', 'user', 'mic', 'book',
] as const;
export type BadgeIconKey = (typeof BADGE_ICON_KEYS)[number];
