/**
 * Validates, normalises and stores an uploaded file. Shared by the upload API
 * and the demo seed (relative imports, no `server-only`).
 *
 *  - type from magic bytes only; size limits per kind;
 *  - images are decoded and re-encoded with sharp (strips EXIF/GPS metadata,
 *    neutralises polyglot files, caps dimensions, guards against pixel bombs);
 *  - videos get a poster frame and dimensions when ffmpeg/ffprobe exist;
 *  - storage keys are random UUIDs, never derived from user input.
 */
import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Queryable } from '../../lib/db/core.ts';
import type { StorageAdapter } from '../../lib/storage/index.ts';
import { sniff, safeFilename, type AssetKind } from './sniff.ts';

export type UploadLimits = Record<AssetKind, number>;

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type AssetRow = {
  id: string;
  user_id: string;
  kind: AssetKind;
  mime: string;
  ext: string;
  size_bytes: number;
  filename: string;
  storage_key: string;
  poster_key: string | null;
  visibility: 'private' | 'unlisted' | 'public';
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  created_at: Date;
};

const MAX_IMAGE_EDGE = 2560;

function run(cmd: string, args: string[], timeoutMs = 20_000): Promise<{ stdout: string }> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 }, (error, stdout) => (error ? reject(error) : resolve({ stdout })));
  });
}

let ffmpegAvailable: boolean | null = null;
async function hasFfmpeg(): Promise<boolean> {
  if (ffmpegAvailable === null) {
    ffmpegAvailable = await run('ffprobe', ['-version'], 5000).then(() => true, () => false);
  }
  return ffmpegAvailable;
}

async function probeMedia(file: string): Promise<{ width: number | null; height: number | null; duration: number | null }> {
  try {
    const { stdout } = await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_entries', 'stream=width,height,codec_type:format=duration', file]);
    const info = JSON.parse(stdout) as { streams?: { width?: number; height?: number; codec_type?: string }[]; format?: { duration?: string } };
    const video = info.streams?.find((s) => s.codec_type === 'video');
    const duration = Number(info.format?.duration);
    return { width: video?.width ?? null, height: video?.height ?? null, duration: Number.isFinite(duration) ? duration : null };
  } catch {
    return { width: null, height: null, duration: null };
  }
}

async function processImage(input: Buffer, animated: boolean) {
  const sharp = (await import('sharp')).default;
  const pipeline = sharp(input, { animated, limitInputPixels: 50_000_000, failOn: 'error' })
    .rotate()
    .resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: 'inside', withoutEnlargement: true });
  const { data, info } = await pipeline.webp({ quality: 86, effort: 4 }).toBuffer({ resolveWithObject: true });
  const pageHeight = (info as { pageHeight?: number }).pageHeight;
  return { data, width: info.width, height: pageHeight ?? info.height, mime: 'image/webp', ext: 'webp' };
}

export async function createAsset(
  q: Queryable,
  storage: StorageAdapter,
  input: { userId: string; data: Buffer; filename: string; kindHint?: AssetKind; visibility?: AssetRow['visibility']; limits: UploadLimits; quotaBytes: number },
): Promise<AssetRow> {
  const detected = sniff(input.data, input.kindHint);
  if (!detected) throw new UploadError('This file type isn’t supported. Upload images, videos, audio or font files.', 415);
  if (input.kindHint && input.kindHint !== detected.kind) {
    throw new UploadError(`Expected ${input.kindHint === 'audio' ? 'an' : 'a'} ${input.kindHint} file, but this looks like ${detected.kind}.`, 415);
  }
  const limit = input.limits[detected.kind];
  if (input.data.length > limit) {
    throw new UploadError(`That ${detected.kind} is ${(input.data.length / 1048576).toFixed(1)} MB; the limit is ${Math.round(limit / 1048576)} MB.`, 413);
  }

  const [usage] = await q.query<{ used: number }>('select coalesce(sum(size_bytes), 0)::float8 as used from assets where user_id = $1', [input.userId]);
  if ((usage?.used ?? 0) + input.data.length > input.quotaBytes) {
    throw new UploadError('Your media library is full. Delete unused files to free up space.', 413);
  }

  let data = input.data;
  let mime = detected.mime;
  let ext = detected.ext;
  let width: number | null = null;
  let height: number | null = null;
  let duration: number | null = null;
  let poster: Buffer | null = null;

  if (detected.kind === 'image') {
    try {
      const out = await processImage(input.data, detected.animated === true || detected.mime === 'image/webp');
      ({ data, width, height, mime, ext } = out);
    } catch {
      throw new UploadError('That image couldn’t be read. It may be corrupted or too large.', 422);
    }
  } else if ((detected.kind === 'video' || detected.kind === 'audio') && (await hasFfmpeg())) {
    const tmp = path.join(os.tmpdir(), `vybe-${randomUUID()}.${ext}`);
    try {
      await fsp.writeFile(tmp, input.data, { mode: 0o600 });
      const meta = await probeMedia(tmp);
      ({ width, height, duration } = meta);
      if (detected.kind === 'video') {
        const out = `${tmp}.jpg`;
        await run('ffmpeg', ['-v', 'error', '-ss', '0.5', '-i', tmp, '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '4', '-y', out]).catch(() => null);
        poster = await fsp.readFile(out).catch(() => null);
        await fsp.rm(out, { force: true });
        if (poster) {
          const sharp = (await import('sharp')).default;
          poster = await sharp(poster).webp({ quality: 80 }).toBuffer();
        }
      }
    } finally {
      await fsp.rm(tmp, { force: true });
    }
  }

  const id = randomUUID();
  const storageKey = `${input.userId}/${id}.${ext}`;
  const posterKey = poster ? `${input.userId}/${id}-poster.webp` : null;
  await storage.put(storageKey, data, mime);
  if (poster && posterKey) await storage.put(posterKey, poster, 'image/webp');

  const filename = safeFilename(input.filename, `${detected.kind}.${ext}`);
  try {
    const [row] = await q.query<AssetRow>(
      `insert into assets (id, user_id, kind, mime, ext, size_bytes, filename, storage_key, poster_key, visibility, width, height, duration_seconds, sha256)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       returning id, user_id, kind, mime, ext, size_bytes, filename, storage_key, poster_key, visibility, width, height, duration_seconds, created_at`,
      [id, input.userId, detected.kind, mime, ext, data.length, filename, storageKey, posterKey, input.visibility ?? 'unlisted', width, height, duration, createHash('sha256').update(data).digest('hex')],
    );
    return row;
  } catch (error) {
    // Don't leave orphaned files behind when the database write fails.
    await storage.delete(storageKey).catch(() => {});
    if (posterKey) await storage.delete(posterKey).catch(() => {});
    throw error;
  }
}
