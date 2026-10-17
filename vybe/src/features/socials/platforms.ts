/**
 * Supported link destinations. `brand` keys map to BRAND_ICONS; platforms
 * without a brand mark (trademark-restricted or generic) use a neutral glyph.
 * `template` turns a bare handle into a URL in the editor (e.g. "@name").
 */
export type PlatformCategory = 'social' | 'creator' | 'gaming' | 'music' | 'chat' | 'work' | 'support' | 'other';

export type Platform = {
  key: string;
  label: string;
  category: PlatformCategory;
  brand?: string;
  glyph?: 'globe' | 'mail' | 'briefcase' | 'gamepad' | 'link' | 'folder' | 'code' | 'download';
  color: string;
  template?: string;
  placeholder: string;
  allowMailto?: boolean;
};

export const PLATFORMS: readonly Platform[] = [
  { key: 'discord', label: 'Discord', category: 'chat', brand: 'discord', color: '#5865F2', placeholder: 'https://discord.gg/invite' },
  { key: 'github', label: 'GitHub', category: 'work', brand: 'github', color: '#f0f0f0', template: 'https://github.com/{h}', placeholder: 'username' },
  { key: 'youtube', label: 'YouTube', category: 'creator', brand: 'youtube', color: '#FF0000', template: 'https://youtube.com/@{h}', placeholder: '@channel' },
  { key: 'tiktok', label: 'TikTok', category: 'creator', brand: 'tiktok', color: '#ff2a6d', template: 'https://tiktok.com/@{h}', placeholder: '@username' },
  { key: 'instagram', label: 'Instagram', category: 'social', brand: 'instagram', color: '#FF0069', template: 'https://instagram.com/{h}', placeholder: 'username' },
  { key: 'x', label: 'X', category: 'social', brand: 'x', color: '#e7e9ea', template: 'https://x.com/{h}', placeholder: 'username' },
  { key: 'twitch', label: 'Twitch', category: 'creator', brand: 'twitch', color: '#9146FF', template: 'https://twitch.tv/{h}', placeholder: 'channel' },
  { key: 'kick', label: 'Kick', category: 'creator', brand: 'kick', color: '#53FC19', template: 'https://kick.com/{h}', placeholder: 'channel' },
  { key: 'spotify', label: 'Spotify', category: 'music', brand: 'spotify', color: '#1ED760', placeholder: 'https://open.spotify.com/…' },
  { key: 'soundcloud', label: 'SoundCloud', category: 'music', brand: 'soundcloud', color: '#FF5500', template: 'https://soundcloud.com/{h}', placeholder: 'username' },
  { key: 'applemusic', label: 'Apple Music', category: 'music', brand: 'applemusic', color: '#FA243C', placeholder: 'https://music.apple.com/…' },
  { key: 'bandcamp', label: 'Bandcamp', category: 'music', brand: 'bandcamp', color: '#408294', placeholder: 'https://name.bandcamp.com' },
  { key: 'lastfm', label: 'Last.fm', category: 'music', brand: 'lastfm', color: '#D51007', template: 'https://last.fm/user/{h}', placeholder: 'username' },
  { key: 'telegram', label: 'Telegram', category: 'chat', brand: 'telegram', color: '#26A5E4', template: 'https://t.me/{h}', placeholder: 'username' },
  { key: 'whatsapp', label: 'WhatsApp', category: 'chat', brand: 'whatsapp', color: '#25D366', placeholder: 'https://wa.me/…' },
  { key: 'signal', label: 'Signal', category: 'chat', brand: 'signal', color: '#3B45FD', placeholder: 'https://signal.me/…' },
  { key: 'reddit', label: 'Reddit', category: 'social', brand: 'reddit', color: '#FF4500', template: 'https://reddit.com/u/{h}', placeholder: 'username' },
  { key: 'snapchat', label: 'Snapchat', category: 'social', brand: 'snapchat', color: '#FFFC00', template: 'https://snapchat.com/add/{h}', placeholder: 'username' },
  { key: 'threads', label: 'Threads', category: 'social', brand: 'threads', color: '#f0f0f0', template: 'https://threads.net/@{h}', placeholder: 'username' },
  { key: 'bluesky', label: 'Bluesky', category: 'social', brand: 'bluesky', color: '#1185FE', template: 'https://bsky.app/profile/{h}', placeholder: 'name.bsky.social' },
  { key: 'mastodon', label: 'Mastodon', category: 'social', brand: 'mastodon', color: '#6364FF', placeholder: 'https://instance/@name' },
  { key: 'facebook', label: 'Facebook', category: 'social', brand: 'facebook', color: '#0866FF', template: 'https://facebook.com/{h}', placeholder: 'username' },
  { key: 'pinterest', label: 'Pinterest', category: 'social', brand: 'pinterest', color: '#BD081C', template: 'https://pinterest.com/{h}', placeholder: 'username' },
  { key: 'steam', label: 'Steam', category: 'gaming', brand: 'steam', color: '#c7d5e0', template: 'https://steamcommunity.com/id/{h}', placeholder: 'custom id' },
  { key: 'roblox', label: 'Roblox', category: 'gaming', brand: 'roblox', color: '#f0f0f0', placeholder: 'https://roblox.com/users/…' },
  { key: 'playstation', label: 'PlayStation', category: 'gaming', brand: 'playstation', color: '#0070D1', placeholder: 'https://psnprofiles.com/…' },
  { key: 'xbox', label: 'Xbox', category: 'gaming', glyph: 'gamepad', color: '#107C10', placeholder: 'https://account.xbox.com/…' },
  { key: 'epicgames', label: 'Epic Games', category: 'gaming', brand: 'epicgames', color: '#f0f0f0', placeholder: 'https://store.epicgames.com/…' },
  { key: 'battlenet', label: 'Battle.net', category: 'gaming', brand: 'battlenet', color: '#4381C3', placeholder: 'https://…' },
  { key: 'valorant', label: 'VALORANT', category: 'gaming', brand: 'valorant', color: '#FA4454', placeholder: 'https://tracker.gg/…' },
  { key: 'osu', label: 'osu!', category: 'gaming', brand: 'osu', color: '#FF66AA', template: 'https://osu.ppy.sh/users/{h}', placeholder: 'user id' },
  { key: 'patreon', label: 'Patreon', category: 'support', brand: 'patreon', color: '#f0f0f0', template: 'https://patreon.com/{h}', placeholder: 'name' },
  { key: 'kofi', label: 'Ko-fi', category: 'support', brand: 'kofi', color: '#FF6433', template: 'https://ko-fi.com/{h}', placeholder: 'name' },
  { key: 'buymeacoffee', label: 'Buy Me a Coffee', category: 'support', brand: 'buymeacoffee', color: '#FFDD00', template: 'https://buymeacoffee.com/{h}', placeholder: 'name' },
  { key: 'paypal', label: 'PayPal', category: 'support', brand: 'paypal', color: '#3b7bbf', placeholder: 'https://paypal.me/…' },
  { key: 'cashapp', label: 'Cash App', category: 'support', brand: 'cashapp', color: '#00C244', template: 'https://cash.app/${h}', placeholder: 'cashtag' },
  { key: 'linkedin', label: 'LinkedIn', category: 'work', glyph: 'briefcase', color: '#0A66C2', template: 'https://linkedin.com/in/{h}', placeholder: 'profile' },
  { key: 'gitlab', label: 'GitLab', category: 'work', brand: 'gitlab', color: '#FC6D26', template: 'https://gitlab.com/{h}', placeholder: 'username' },
  { key: 'behance', label: 'Behance', category: 'work', brand: 'behance', color: '#1769FF', template: 'https://behance.net/{h}', placeholder: 'username' },
  { key: 'dribbble', label: 'Dribbble', category: 'work', brand: 'dribbble', color: '#EA4C89', template: 'https://dribbble.com/{h}', placeholder: 'username' },
  { key: 'figma', label: 'Figma', category: 'work', brand: 'figma', color: '#F24E1E', placeholder: 'https://figma.com/@…' },
  { key: 'medium', label: 'Medium', category: 'creator', brand: 'medium', color: '#f0f0f0', template: 'https://medium.com/@{h}', placeholder: 'username' },
  { key: 'substack', label: 'Substack', category: 'creator', brand: 'substack', color: '#FF6719', template: 'https://{h}.substack.com', placeholder: 'name' },
  { key: 'vimeo', label: 'Vimeo', category: 'creator', brand: 'vimeo', color: '#1AB7EA', template: 'https://vimeo.com/{h}', placeholder: 'username' },
  { key: 'letterboxd', label: 'Letterboxd', category: 'creator', brand: 'letterboxd', color: '#40BCF4', template: 'https://letterboxd.com/{h}', placeholder: 'username' },
  { key: 'website', label: 'Website', category: 'other', glyph: 'globe', color: '#c4b5fd', placeholder: 'https://example.com' },
  { key: 'portfolio', label: 'Portfolio', category: 'work', glyph: 'folder', color: '#a5b4fc', placeholder: 'https://portfolio.example' },
  { key: 'email', label: 'Email', category: 'other', glyph: 'mail', color: '#e2e8f0', placeholder: 'you@example.com', allowMailto: true },
  { key: 'custom', label: 'Custom link', category: 'other', glyph: 'link', color: '#e2e8f0', placeholder: 'https://…', allowMailto: true },
];

const byKey = new Map(PLATFORMS.map((platform) => [platform.key, platform]));

export function getPlatform(key: string): Platform {
  return byKey.get(key) ?? byKey.get('custom')!;
}

export const PLATFORM_KEYS = PLATFORMS.map((platform) => platform.key) as [string, ...string[]];

/** Expands "@handle" / "handle" into a URL for platforms with a template. */
export function expandHandle(platformKey: string, input: string): string {
  const value = input.trim();
  const platform = getPlatform(platformKey);
  if (platform.key === 'email' && value && !value.startsWith('mailto:') && value.includes('@')) return `mailto:${value}`;
  if (!platform.template || !value || /^[a-z]+:/i.test(value) || value.includes('/') || value.includes('.')) return value;
  const handle = value.replace(/^@/, '');
  if (!/^[\w.-]{1,64}$/.test(handle)) return value;
  return platform.template.replace('{h}', encodeURIComponent(handle));
}
