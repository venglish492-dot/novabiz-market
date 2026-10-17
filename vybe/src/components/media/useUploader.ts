'use client';

import { useCallback, useRef, useState } from 'react';
import type { LibraryAsset } from '@/features/uploads/service';
import type { AssetKind } from '@/features/uploads/sniff';

export type UploadJob = { id: string; name: string; size: number; progress: number; state: 'uploading' | 'done' | 'error' | 'cancelled'; error?: string };

/**
 * Uploads files with XMLHttpRequest (fetch can't report upload progress),
 * one request per file, each cancellable.
 */
export function useUploader(onUploaded: (asset: LibraryAsset) => void) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const requests = useRef(new Map<string, XMLHttpRequest>());

  const patch = (id: string, p: Partial<UploadJob>) => setJobs((all) => all.map((j) => (j.id === id ? { ...j, ...p } : j)));

  const upload = useCallback(
    (files: FileList | File[], kind?: AssetKind) =>
      Promise.all(
        [...files].map(
          (file) =>
            new Promise<LibraryAsset | null>((resolve) => {
              const id = crypto.randomUUID();
              setJobs((all) => [...all.filter((j) => j.state === 'uploading').slice(-8), { id, name: file.name, size: file.size, progress: 0, state: 'uploading' }]);
              const form = new FormData();
              form.append('file', file);
              if (kind) form.append('kind', kind);
              const xhr = new XMLHttpRequest();
              requests.current.set(id, xhr);
              xhr.open('POST', '/api/uploads');
              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) patch(id, { progress: event.loaded / event.total });
              };
              xhr.onload = () => {
                requests.current.delete(id);
                let body: { asset?: LibraryAsset; error?: string } = {};
                try {
                  body = JSON.parse(xhr.responseText);
                } catch {
                  /* non-JSON error page */
                }
                if (xhr.status === 201 && body.asset) {
                  patch(id, { progress: 1, state: 'done' });
                  onUploaded(body.asset);
                  resolve(body.asset);
                } else {
                  patch(id, { state: 'error', error: body.error ?? (xhr.status === 413 ? 'That file is too large.' : `Upload failed (${xhr.status}).`) });
                  resolve(null);
                }
              };
              xhr.onerror = () => {
                requests.current.delete(id);
                patch(id, { state: 'error', error: 'Network error — check your connection.' });
                resolve(null);
              };
              xhr.onabort = () => {
                requests.current.delete(id);
                patch(id, { state: 'cancelled' });
                resolve(null);
              };
              xhr.send(form);
            }),
        ),
      ),
    [onUploaded],
  );

  const cancel = useCallback((id: string) => requests.current.get(id)?.abort(), []);
  const clearFinished = useCallback(() => setJobs((all) => all.filter((j) => j.state === 'uploading')), []);
  return { jobs, upload, cancel, clearFinished };
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
