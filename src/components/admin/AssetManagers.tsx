'use client';

import { useActionState, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import {
  addChangelogAction,
  addExternalLinkAction,
  createUploadUrlAction,
  registerFileAction,
  registerImageAction,
  type AdminActionState,
} from '@/lib/actions/admin';
import { Button } from '@/components/ui/Button';
import { useAdminT } from './AdminI18n';
import { inputClass, labelClass } from './ui';

async function sha256Hex(file: File): Promise<string | undefined> {
  // Hashing very large files in the browser is memory-heavy; skip above 150 MB.
  if (file.size > 150 * 1024 * 1024 || !crypto?.subtle) return undefined;
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Uploads straight to the private bucket via a one-time signed upload URL, then registers the file. */
export function FileUploader({ productId, defaultVersion }: { productId: string; defaultVersion: string }) {
  const t = useAdminT();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  return (
    <form
      ref={formRef}
      className="grid gap-3 rounded-xl border border-dashed border-line-strong p-4 md:grid-cols-[1fr_120px_160px_auto] md:items-end"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const file = form.get('file');
        if (!(file instanceof File) || !file.size) return;
        setStatus('uploading');
        try {
          const target = await createUploadUrlAction({ productId, fileName: file.name, target: 'files' });
          if ('error' in target) throw new Error(target.error);
          const supabase = getSupabaseBrowser();
          if (!supabase) throw new Error('not configured');
          const { error } = await supabase.storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type || undefined });
          if (error) throw error;
          const result = await registerFileAction({
            productId,
            path: target.path,
            fileName: file.name,
            mimeType: file.type || undefined,
            sizeBytes: file.size,
            version: String(form.get('version') || defaultVersion),
            kind: form.get('kind') === 'documentation' ? 'documentation' : 'download',
            label: { ru: String(form.get('label') || file.name), en: String(form.get('label') || file.name) },
            checksum: await sha256Hex(file),
          });
          if (!result.ok) throw new Error(result.error);
          setStatus('done');
          formRef.current?.reset();
          router.refresh();
        } catch {
          setStatus('error');
        }
      }}
    >
      <label className={labelClass}>
        {t.files.label}
        <input name="label" className={inputClass} />
      </label>
      <label className={labelClass}>
        {t.files.version}
        <input name="version" defaultValue={defaultVersion} className={inputClass} />
      </label>
      <label className={labelClass}>
        {t.files.kind}
        <select name="kind" className={inputClass}>
          <option value="download">{t.files.kinds.download}</option>
          <option value="documentation">{t.files.kinds.documentation}</option>
        </select>
      </label>
      <div className="flex flex-col gap-2 md:col-span-4 md:flex-row md:items-center">
        <input name="file" type="file" required className="text-sm text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-3 file:px-4 file:py-2 file:text-sm file:text-fg" />
        <Button type="submit" variant="secondary" size="sm" disabled={status === 'uploading'}>
          <Upload className="h-4 w-4" aria-hidden />
          {status === 'uploading' ? t.files.uploading : t.files.upload}
        </Button>
        <span role="status" className={`text-xs ${status === 'error' ? 'text-danger' : 'text-success'}`}>
          {status === 'done' ? t.files.uploaded : status === 'error' ? t.common.error : ''}
        </span>
      </div>
    </form>
  );
}

export function ExternalLinkForm({ productId, defaultVersion }: { productId: string; defaultVersion: string }) {
  const t = useAdminT();
  const [state, action, pending] = useActionState<AdminActionState, FormData>(addExternalLinkAction, {});
  return (
    <form action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto] md:items-end">
      <input type="hidden" name="product_id" value={productId} />
      <label className={labelClass}>
        {t.files.externalUrl}
        <input name="external_url" type="url" required placeholder="https://" className={inputClass} />
      </label>
      <label className={labelClass}>
        {t.files.label}
        <input name="label.ru" placeholder="Шаблон Notion" className={inputClass} />
        <input name="label.en" placeholder="Notion template" className={inputClass} />
      </label>
      <label className={labelClass}>
        {t.files.version}
        <input name="version" defaultValue={defaultVersion} className={inputClass} />
      </label>
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {t.files.addLink}
      </Button>
      {state.error && <p className="text-xs text-danger md:col-span-4">{t.common.error}</p>}
    </form>
  );
}

export function ImageUploader({ productId }: { productId: string }) {
  const t = useAdminT();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  return (
    <form
      className="flex flex-col gap-3 md:flex-row md:items-end"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const file = form.get('image');
        if (!(file instanceof File) || !file.size) return;
        setStatus('uploading');
        try {
          const target = await createUploadUrlAction({ productId, fileName: file.name, target: 'media' });
          if ('error' in target) throw new Error(target.error);
          const supabase = getSupabaseBrowser();
          if (!supabase) throw new Error('not configured');
          const { error } = await supabase.storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
          if (error) throw error;
          const bitmap = await createImageBitmap(file).catch(() => null);
          const alt = String(form.get('alt') ?? '');
          const result = await registerImageAction({
            productId,
            path: target.path,
            kind: (form.get('kind') as 'thumbnail' | 'gallery' | 'og') ?? 'gallery',
            alt: { ru: alt, en: alt },
            width: bitmap?.width,
            height: bitmap?.height,
          });
          if (!result.ok) throw new Error(result.error);
          setStatus('idle');
          router.refresh();
        } catch {
          setStatus('error');
        }
      }}
    >
      <label className={labelClass}>
        {t.images.kind}
        <select name="kind" className={inputClass}>
          <option value="thumbnail">{t.images.kinds.thumbnail}</option>
          <option value="gallery">{t.images.kinds.gallery}</option>
          <option value="og">{t.images.kinds.og}</option>
        </select>
      </label>
      <label className={`${labelClass} flex-1`}>
        Alt
        <input name="alt" className={inputClass} />
      </label>
      <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/avif" required className="text-sm text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-3 file:px-4 file:py-2 file:text-sm file:text-fg" />
      <Button type="submit" variant="secondary" size="sm" disabled={status === 'uploading'}>
        {status === 'uploading' ? t.files.uploading : t.images.upload}
      </Button>
      {status === 'error' && <span className="text-xs text-danger">{t.common.error}</span>}
    </form>
  );
}

export function ChangelogForm({ productId, defaultVersion }: { productId: string; defaultVersion: string }) {
  const t = useAdminT();
  const [state, action, pending] = useActionState<AdminActionState, FormData>(addChangelogAction, {});
  return (
    <form action={action} className="grid gap-3 md:grid-cols-[120px_160px_1fr_1fr_auto] md:items-end">
      <input type="hidden" name="product_id" value={productId} />
      <label className={labelClass}>
        {t.changelog.version}
        <input name="version" required defaultValue={defaultVersion} className={inputClass} />
      </label>
      <label className={labelClass}>
        {t.changelog.date}
        <input name="released_at" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
      </label>
      <label className={labelClass}>
        {t.changelog.notes} (RU)
        <input name="notes.ru" required className={inputClass} />
      </label>
      <label className={labelClass}>
        {t.changelog.notes} (EN)
        <input name="notes.en" required className={inputClass} />
      </label>
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {t.changelog.add}
      </Button>
      {state.ok && <p className="text-xs text-success md:col-span-5">{t.common.saved}</p>}
      {state.error && <p className="text-xs text-danger md:col-span-5">{t.common.error}</p>}
    </form>
  );
}
