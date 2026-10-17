'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Pencil, Search, Trash2, UploadCloud } from 'lucide-react';
import { deleteAssetAction, renameAssetAction, setAssetVisibilityAction } from '@/app/actions/profile';
import { referencedAssetIds } from '@/features/profiles/document';
import { ACCEPT } from '@/features/uploads/sniff';
import type { LibraryAsset } from '@/features/uploads/service';
import { limits } from '@/config/limits';
import { CopyButton } from '@/components/media/MediaActions';
import { UploadQueue } from '@/components/media/UploadQueue';
import { formatBytes, useUploader } from '@/components/media/useUploader';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { useEditor } from '../EditorProvider';
import { AssetThumb } from '../AssetField';

type Kind = 'all' | LibraryAsset['kind'];
type Sort = 'newest' | 'oldest' | 'largest' | 'name';

export function MediaSection() {
  const { library, setLibrary, doc } = useEditor();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [dragOver, setDragOver] = useState(false);
  const [confirm, setConfirm] = useState<LibraryAsset | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const { jobs, upload, cancel, clearFinished } = useUploader((asset) => setLibrary((all) => [asset, ...all]));

  const inUse = useMemo(() => new Set(referencedAssetIds(doc)), [doc]);
  const used = library.reduce((sum, a) => sum + a.sizeBytes, 0);
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = library.filter((a) => (kind === 'all' || a.kind === kind) && (!q || a.filename.toLowerCase().includes(q)));
    const sorters: Record<Sort, (a: LibraryAsset, b: LibraryAsset) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
      largest: (a, b) => b.sizeBytes - a.sizeBytes,
      name: (a, b) => a.filename.localeCompare(b.filename),
    };
    return [...filtered].sort(sorters[sort]);
  }, [library, kind, query, sort]);

  const setVisibility = async (asset: LibraryAsset, visibility: LibraryAsset['visibility']) => {
    const previous = asset.visibility;
    setLibrary((all) => all.map((a) => (a.id === asset.id ? { ...a, visibility } : a)));
    const result = await setAssetVisibilityAction(asset.id, visibility);
    if (!result.ok) {
      setLibrary((all) => all.map((a) => (a.id === asset.id ? { ...a, visibility: previous } : a)));
      toast.show('error', result.error);
    } else if (visibility === 'private' && inUse.has(asset.id)) {
      toast.show('info', 'This file is on your page', 'Private files are hidden from visitors after your next publish.');
    }
  };

  return (
    <div className="space-y-6">
      <section
        className={`card flex flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-10 text-center transition-colors ${dragOver ? 'border-primary bg-primary/10' : 'border-line-strong'}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void upload(e.dataTransfer.files);
        }}
        aria-label="Upload files"
      >
        <UploadCloud className="size-8 text-lavender" aria-hidden />
        <p className="font-semibold">Drag files here to upload</p>
        <p className="max-w-md text-sm text-muted">
          Images ({ACCEPT.image.label}), video ({ACCEPT.video.label}), audio and fonts. SVG and HTML aren’t accepted. Image metadata such as GPS location is removed.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => input.current?.click()}>
          Choose files
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept={[ACCEPT.image.accept, ACCEPT.video.accept, ACCEPT.audio.accept, ACCEPT.font.accept].join(',')}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files);
            e.target.value = '';
          }}
        />
      </section>
      <UploadQueue jobs={jobs} onCancel={cancel} onClear={clearFinished} />

      <div className="card p-4">
        <div className="flex items-center justify-between text-sm">
          <span>Storage</span>
          <span className="font-mono text-xs text-muted">
            {formatBytes(used)} of {formatBytes(limits.storagePerUserBytes)} · {library.length} files
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round((used / limits.storagePerUserBytes) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${Math.min(100, (used / limits.storagePerUserBytes) * 100)}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search files</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name" className="input pl-9" />
        </label>
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="input sm:w-36" aria-label="Filter by type">
          <option value="all">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
          <option value="font">Fonts</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input sm:w-36" aria-label="Sort">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="largest">Largest</option>
          <option value="name">Name</option>
        </select>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">{library.length ? 'No files match your filters.' : 'Your library is empty. Upload something above.'}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((asset) => (
            <li key={asset.id} className="card flex gap-3 p-3">
              <a href={`/media/${asset.id}`} target="_blank" rel="noopener" className="size-20 shrink-0 overflow-hidden rounded-xl border border-line" aria-label={`Open ${asset.filename}`}>
                <AssetThumb asset={asset} />
              </a>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-1">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <button type="button" className="rounded p-1 text-muted hover:text-text" onClick={() => setRenaming({ id: asset.id, name: asset.filename })} aria-label={`Rename ${asset.filename}`}>
                    <Pencil className="size-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted">
                  {asset.kind} · {formatBytes(asset.sizeBytes)}
                  {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ''} · {new Date(asset.createdAt).toLocaleDateString()}
                </p>
                {inUse.has(asset.id) && <p className="mt-0.5 text-xs font-semibold text-emerald-300">In use on your page</p>}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <select value={asset.visibility} onChange={(e) => void setVisibility(asset, e.target.value as LibraryAsset['visibility'])} className="input !min-h-8 !w-auto !py-0 text-xs" aria-label={`Visibility of ${asset.filename}`}>
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                  {asset.visibility !== 'private' && <CopyButton text={`/media/${asset.id}`} label="Link" className="btn btn-ghost btn-sm !min-h-8 !px-2 text-xs" />}
                  <Link href={`/media/${asset.id}`} target="_blank" className="btn btn-ghost btn-sm !min-h-8 !px-2 text-xs">
                    <ExternalLink className="size-3.5" aria-hidden /> Open
                  </Link>
                  <button type="button" className="btn btn-ghost btn-sm !min-h-8 !px-2 text-xs hover:!text-rose-300" onClick={() => setConfirm(asset)}>
                    <Trash2 className="size-3.5" aria-hidden /> Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} title="Delete this file?" description={confirm?.filename} size="sm">
        {confirm && (
          <div className="space-y-4">
            {inUse.has(confirm.id) && <p className="rounded-xl bg-warning/10 p-3 text-sm text-warning">This file is used on your page. That spot will show a fallback until you choose something else.</p>}
            <p className="text-sm text-muted">Deleting is permanent and breaks any shared links to it.</p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={async () => {
                  const target = confirm;
                  setConfirm(null);
                  const result = await deleteAssetAction(target.id);
                  if (result.ok) {
                    setLibrary((all) => all.filter((a) => a.id !== target.id));
                    toast.show('success', 'File deleted');
                  } else toast.show('error', result.error);
                }}
              >
                Delete permanently
              </button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={Boolean(renaming)} onClose={() => setRenaming(null)} title="Rename file" size="sm">
        {renaming && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const target = renaming;
              setRenaming(null);
              const result = await renameAssetAction(target.id, target.name);
              if (result.ok) setLibrary((all) => all.map((a) => (a.id === target.id ? { ...a, filename: target.name.trim() } : a)));
              else toast.show('error', result.error);
            }}
          >
            <label htmlFor="rename" className="label">
              Name
            </label>
            <input id="rename" className="input" value={renaming.name} maxLength={120} onChange={(e) => setRenaming({ ...renaming, name: e.target.value })} autoFocus />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setRenaming(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!renaming.name.trim()}>
                Save
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
