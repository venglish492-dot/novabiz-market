/**
 * Parses provider URLs into the minimal identifiers needed for official public
 * embeds. Only these allow-listed embed origins are ever framed (see the CSP
 * frame-src in next.config.ts); nothing is scraped.
 */

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else {
        const match = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
        id = match?.[1] ?? null;
      }
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function vimeoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (!/(^|\.)vimeo\.com$/.test(u.hostname)) return null;
    const match = u.pathname.match(/\/(\d{5,12})(?:$|\/)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

const SPOTIFY_TYPES = new Set(['track', 'album', 'playlist', 'artist', 'episode', 'show']);

/** Returns e.g. "track/4uLU6hMCjMI75M1A2tKUQC". */
export function spotifyPath(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname !== 'open.spotify.com') return null;
    const parts = u.pathname.split('/').filter(Boolean).filter((part) => !part.startsWith('intl-'));
    const index = parts[0] === 'embed' ? 1 : 0;
    const [type, id] = [parts[index], parts[index + 1]];
    return type && id && SPOTIFY_TYPES.has(type) && /^[A-Za-z0-9]{10,40}$/.test(id) ? `${type}/${id}` : null;
  } catch {
    return null;
  }
}

/** Discord invite code from discord.gg/<code> or discord.com/invite/<code>. */
export function discordInviteCode(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '');
    let code: string | null = null;
    if (host === 'discord.gg') code = u.pathname.slice(1).split('/')[0];
    else if (host === 'discord.com' || host === 'discordapp.com') code = u.pathname.match(/^\/invite\/([^/]+)/)?.[1] ?? null;
    return code && /^[\w-]{2,32}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

export function videoEmbed(url: string): { provider: 'youtube' | 'vimeo'; id: string } | null {
  const yt = youtubeId(url);
  if (yt) return { provider: 'youtube', id: yt };
  const vm = vimeoId(url);
  if (vm) return { provider: 'vimeo', id: vm };
  return null;
}
