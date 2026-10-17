/**
 * File-type detection from magic bytes. The browser-supplied MIME type and file
 * extension are never trusted. SVG, HTML and every other text/scriptable format
 * are rejected by omission.
 */
export type AssetKind = 'image' | 'video' | 'audio' | 'font';
export type Sniffed = { mime: string; ext: string; kind: AssetKind; animated?: boolean };

const ascii = (buf: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...buf.subarray(start, start + length));

export function sniff(buf: Uint8Array, declaredKind?: AssetKind): Sniffed | null {
  if (buf.length < 12) return null;

  // Images
  if (buf[0] === 0x89 && ascii(buf, 1, 3) === 'PNG') return { mime: 'image/png', ext: 'png', kind: 'image' };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg', kind: 'image' };
  if (ascii(buf, 0, 6) === 'GIF87a' || ascii(buf, 0, 6) === 'GIF89a') return { mime: 'image/gif', ext: 'gif', kind: 'image', animated: true };
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 4) === 'WEBP') return { mime: 'image/webp', ext: 'webp', kind: 'image' };
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 4) === 'WAVE') return { mime: 'audio/wav', ext: 'wav', kind: 'audio' };

  // ISO base media (MP4 / MOV / M4A / AVIF)
  if (ascii(buf, 4, 4) === 'ftyp') {
    const brand = ascii(buf, 8, 4);
    if (brand === 'avif' || brand === 'avis') return { mime: 'image/avif', ext: 'avif', kind: 'image' };
    if (brand === 'M4A ' || brand === 'M4B ') return { mime: 'audio/mp4', ext: 'm4a', kind: 'audio' };
    if (brand === 'qt  ') return { mime: 'video/quicktime', ext: 'mov', kind: 'video' };
    if (/^(isom|iso\d|mp4\d|mp41|mp42|avc1|M4V |dash|MSNV|3gp\d)$/.test(brand)) {
      return declaredKind === 'audio' ? { mime: 'audio/mp4', ext: 'm4a', kind: 'audio' } : { mime: 'video/mp4', ext: 'mp4', kind: 'video' };
    }
    return null;
  }

  // Matroska / WebM
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return declaredKind === 'audio' ? { mime: 'audio/webm', ext: 'weba', kind: 'audio' } : { mime: 'video/webm', ext: 'webm', kind: 'video' };
  }

  // Audio
  if (ascii(buf, 0, 4) === 'OggS') return { mime: 'audio/ogg', ext: 'ogg', kind: 'audio' };
  if (ascii(buf, 0, 4) === 'fLaC') return { mime: 'audio/flac', ext: 'flac', kind: 'audio' };
  if (ascii(buf, 0, 3) === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0 && (buf[1] & 0x06) !== 0)) {
    return { mime: 'audio/mpeg', ext: 'mp3', kind: 'audio' };
  }

  // Fonts
  if (ascii(buf, 0, 4) === 'wOF2') return { mime: 'font/woff2', ext: 'woff2', kind: 'font' };
  if (ascii(buf, 0, 4) === 'wOFF') return { mime: 'font/woff', ext: 'woff', kind: 'font' };
  if (ascii(buf, 0, 4) === 'OTTO') return { mime: 'font/otf', ext: 'otf', kind: 'font' };
  if ((buf[0] === 0 && buf[1] === 1 && buf[2] === 0 && buf[3] === 0) || ascii(buf, 0, 4) === 'true') {
    return { mime: 'font/ttf', ext: 'ttf', kind: 'font' };
  }
  return null;
}

/** Human-readable allow-list per kind, for upload UIs. */
export const ACCEPT: Record<AssetKind, { accept: string; label: string }> = {
  image: { accept: 'image/png,image/jpeg,image/gif,image/webp,image/avif', label: 'PNG, JPEG, GIF, WebP or AVIF' },
  video: { accept: 'video/mp4,video/webm,video/quicktime', label: 'MP4, WebM or MOV' },
  audio: { accept: 'audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm,audio/flac,.m4a,.mp3,.ogg,.wav,.flac', label: 'MP3, M4A, OGG, WAV, FLAC or WebM audio' },
  font: { accept: '.woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf', label: 'WOFF2, WOFF, TTF or OTF' },
};

/** Strips paths, control characters and anything unusual from a display filename. */
export function safeFilename(input: string, fallback: string): string {
  const base = input.split(/[\\/]/).pop() ?? '';
  const cleaned = base
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return cleaned && cleaned !== '.' && cleaned !== '..' ? cleaned : fallback;
}
