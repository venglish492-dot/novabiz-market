import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getStorage } from '@/lib/storage';
import { env } from '@/lib/env';
import { limits } from '@/config/limits';
import { logger } from '@/lib/logger';
import { isSameOrigin } from '@/lib/security/request';
import { rateLimit } from '@/lib/security/rate-limit';
import { createAsset, UploadError } from '@/features/uploads/process';
import { toLibraryAsset } from '@/features/uploads/service';
import type { AssetKind } from '@/features/uploads/sniff';

export const runtime = 'nodejs';

const KINDS = new Set<AssetKind>(['image', 'video', 'audio', 'font']);

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return error('Cross-site upload blocked.', 403);
  const user = await getCurrentUser();
  if (!user) return error('Sign in to upload files.', 401);

  const maxBytes = Math.max(env.upload.imageMaxBytes, env.upload.videoMaxBytes, env.upload.audioMaxBytes, env.upload.fontMaxBytes);
  const length = Number(request.headers.get('content-length') || 0);
  if (!length) return error('Upload size is required.', 411);
  if (length > maxBytes + 64 * 1024) return error(`Files can be at most ${Math.round(maxBytes / 1048576)} MB.`, 413);

  const limit = await rateLimit(`upload:${user.id}`, limits.uploadsPerHour, 3600);
  if (!limit.ok) return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error('The upload was interrupted or malformed.', 400);
  }
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return error('Choose a file to upload.', 400);
  const kindRaw = String(form.get('kind') || '');
  const kindHint = KINDS.has(kindRaw as AssetKind) ? (kindRaw as AssetKind) : undefined;
  const visibilityRaw = String(form.get('visibility') || 'unlisted');
  const visibility = visibilityRaw === 'private' || visibilityRaw === 'public' ? visibilityRaw : 'unlisted';

  try {
    const db = await getDb();
    const row = await createAsset(db, getStorage(), {
      userId: user.id,
      data: Buffer.from(await file.arrayBuffer()),
      filename: file.name,
      kindHint,
      visibility,
      limits: { image: env.upload.imageMaxBytes, video: env.upload.videoMaxBytes, audio: env.upload.audioMaxBytes, font: env.upload.fontMaxBytes },
      quotaBytes: limits.storagePerUserBytes,
    });
    return NextResponse.json({ asset: toLibraryAsset(row) }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) return error(err.message, err.status);
    logger.error('upload.failed', { error: err, userId: user.id });
    return error('The upload failed. Please try again.', 500);
  }
}
