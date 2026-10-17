/**
 * Object storage behind a small interface. Two adapters:
 *  - local:    files under VYBE_DATA_DIR/uploads (development, single server)
 *  - supabase: Supabase Storage via its REST API with the service-role key,
 *              in a PRIVATE bucket — every byte is still served through
 *              /api/files/[id], which enforces visibility.
 * Keys are generated server-side (`<userId>/<uuid>.<ext>`), never from file names.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

export type StoredObject = { body: ReadableStream<Uint8Array>; size: number; start: number; end: number; total: number };

export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  /** Range is inclusive, like HTTP. Returns null when the object does not exist. */
  get(key: string, range?: { start: number; end?: number }): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

const KEY_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}(?:-poster)?\.[a-z0-9]{2,5}$/;

export function assertSafeKey(key: string) {
  if (!KEY_PATTERN.test(key)) throw new Error('Invalid storage key');
}

class LocalStorage implements StorageAdapter {
  private root: string;
  constructor(root: string) {
    this.root = root;
  }

  private file(key: string) {
    assertSafeKey(key);
    const resolved = path.resolve(/*turbopackIgnore: true*/ this.root, key);
    if (!resolved.startsWith(path.resolve(/*turbopackIgnore: true*/ this.root) + path.sep)) throw new Error('Path traversal blocked');
    return resolved;
  }

  async put(key: string, data: Buffer) {
    const file = this.file(key);
    await fsp.mkdir(path.dirname(file), { recursive: true });
    await fsp.writeFile(file, data, { mode: 0o600 });
  }

  async get(key: string, range?: { start: number; end?: number }) {
    const file = this.file(key);
    let stat: fs.Stats;
    try {
      stat = await fsp.stat(file);
    } catch {
      return null;
    }
    const total = stat.size;
    const start = Math.min(range?.start ?? 0, Math.max(0, total - 1));
    const end = Math.min(range?.end ?? total - 1, total - 1);
    const stream = fs.createReadStream(file, { start, end });
    return { body: Readable.toWeb(stream) as ReadableStream<Uint8Array>, size: end - start + 1, start, end, total };
  }

  async delete(key: string) {
    await fsp.rm(this.file(key), { force: true });
  }
}

class SupabaseStorage implements StorageAdapter {
  private baseUrl: string;
  private serviceKey: string;
  private bucket: string;
  constructor(baseUrl: string, serviceKey: string, bucket: string) {
    this.baseUrl = baseUrl;
    this.serviceKey = serviceKey;
    this.bucket = bucket;
  }

  private url(key: string) {
    assertSafeKey(key);
    return `${this.baseUrl.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(this.bucket)}/${key}`;
  }

  private headers(extra: Record<string, string> = {}) {
    return { Authorization: `Bearer ${this.serviceKey}`, apikey: this.serviceKey, ...extra };
  }

  async put(key: string, data: Buffer, contentType: string) {
    const response = await fetch(this.url(key), {
      method: 'POST',
      headers: this.headers({ 'Content-Type': contentType, 'x-upsert': 'false' }),
      body: new Uint8Array(data),
    });
    if (!response.ok) throw new Error(`Storage upload failed (${response.status})`);
  }

  async get(key: string, range?: { start: number; end?: number }) {
    const response = await fetch(this.url(key), {
      headers: this.headers(range ? { Range: `bytes=${range.start}-${range.end ?? ''}` } : {}),
    });
    if (response.status === 404 || response.status === 400) return null;
    if (!response.ok || !response.body) throw new Error(`Storage read failed (${response.status})`);
    const length = Number(response.headers.get('content-length') || 0);
    const contentRange = response.headers.get('content-range')?.match(/bytes (\d+)-(\d+)\/(\d+)/);
    const start = contentRange ? Number(contentRange[1]) : 0;
    const end = contentRange ? Number(contentRange[2]) : length - 1;
    const total = contentRange ? Number(contentRange[3]) : length;
    return { body: response.body, size: end - start + 1, start, end, total };
  }

  async delete(key: string) {
    await fetch(`${this.baseUrl.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(this.bucket)}`, {
      method: 'DELETE',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prefixes: [key] }),
    });
  }
}

let instance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (instance) return instance;
  if (process.env.STORAGE_DRIVER === 'supabase') {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('STORAGE_DRIVER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    instance = new SupabaseStorage(url, key, process.env.SUPABASE_STORAGE_BUCKET || 'vybe-media');
  } else {
    instance = new LocalStorage(path.join(path.resolve(/*turbopackIgnore: true*/ process.env.VYBE_DATA_DIR || '.data'), 'uploads'));
  }
  return instance;
}
