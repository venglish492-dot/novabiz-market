import 'server-only';
import { getCurrentUser } from '@/lib/auth/session';
import { getStorage } from '@/lib/storage';
import { getServableAsset } from './service';

const NOT_FOUND = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

/**
 * Streams a stored file with HTTP Range support (needed for video/audio
 * seeking). Uploaded bytes are served with nosniff and a sandboxing CSP so a
 * file can never execute as a page, even if a browser were tricked into it.
 */
export async function serveAsset(request: Request, id: string, variant: 'file' | 'poster'): Promise<Response> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NOT_FOUND();
  // Only look up the session when needed (private files); public files stay cacheable.
  let asset = await getServableAsset(id, null);
  let viewerOwned = false;
  if (!asset) {
    const user = await getCurrentUser();
    if (user) {
      asset = await getServableAsset(id, user.id);
      viewerOwned = Boolean(asset);
    }
  }
  if (!asset) return NOT_FOUND();
  const key = variant === 'poster' ? asset.posterKey : asset.storageKey;
  if (!key) return NOT_FOUND();
  const mime = variant === 'poster' ? 'image/webp' : asset.mime;

  const rangeHeader = request.headers.get('range');
  let range: { start: number; end?: number } | undefined;
  const match = rangeHeader?.match(/^bytes=(\d+)-(\d*)$/);
  if (match) range = { start: Number(match[1]), end: match[2] ? Number(match[2]) : undefined };

  const object = await getStorage().get(key, range);
  if (!object) return NOT_FOUND();
  if (range && range.start >= object.total) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${object.total}` } });
  }

  const ascii = asset.filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '');
  const headers = new Headers({
    'Content-Type': mime,
    'Content-Length': String(object.size),
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    'Cross-Origin-Resource-Policy': 'same-site',
    'Content-Disposition': `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
    'Cache-Control': asset.visibility === 'private' || viewerOwned ? 'private, no-store' : 'public, max-age=3600, stale-while-revalidate=86400',
  });
  if (asset.kind === 'font') headers.set('Access-Control-Allow-Origin', '*');
  if (range) headers.set('Content-Range', `bytes ${object.start}-${object.end}/${object.total}`);
  return new Response(object.body, { status: range ? 206 : 200, headers });
}
