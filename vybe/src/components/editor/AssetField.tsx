'use client';

import { useMemo, useRef, useState } from 'react';
import { FileAudio, ImageIcon, Lock, Type, UploadCloud, Video, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { ACCEPT, type AssetKind } from '@/features/uploads/sniff';
import type { LibraryAsset } from '@/features/uploads/service';
import { UploadQueue } from '@/components/media/UploadQueue';
import { useUploader } from '@/components/media/useUploader';
import { useEditor } from './EditorProvider';

const KIND_ICON = { image: ImageIcon, video: Video, audio: FileAudio, font: Type };

export function AssetThumb({ asset, className = 'size-full' }: { asset: LibraryAsset | undefined; className?: string }) {
  if (!asset) return <div className={`${className} flex items-center justify-center bg-white/5 text-faint`}><ImageIcon className="size-5" aria-hidden /></div>;
  if (asset.kind === 'image') {
    // eslint-disable-next-line @next/next/no-img-element -- user media
    return <img src={asset.url} alt="" className={`${className} object-cover`} loading="lazy" />;
  }
  if (asset.kind === 'video' && asset.posterUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- user media
    return <img src={asset.posterUrl} alt="" className={`${className} object-cover`} loading="lazy" />;
  }
  const Icon = KIND_ICON[asset.kind];
  return (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br from-primary/25 to-secondary/15 text-lavender`}>
      <Icon className="size-6" aria-hidden />
    </div>
  );
}

/** Dialog to choose a file of a given kind from the library, or upload a new one. */
export function MediaPicker({ open, onClose, kind, onPick, multiple = false }: { open: boolean; onClose: () => void; kind: AssetKind; onPick: (ids: string[]) => void; multiple?: boolean }) {
  const { library, setLibrary } = useEditor();
  const [selected, setSelected] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const { jobs, upload, cancel, clearFinished } = useUploader((asset) => setLibrary((all) => [asset, ...all]));
  const items = useMemo(() => library.filter((a) => a.kind === kind), [library, kind]);

  const choose = (id: string) => {
    if (!multiple) {
      onPick([id]);
      onClose();
      return;
    }
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Choose ${kind === 'audio' ? 'an audio file' : kind === 'image' ? 'an image' : `a ${kind}`}`} description={`Pick from your library or upload ${ACCEPT[kind].label}.`} size="lg">
      <div className="space-y-4">
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong px-4 py-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault();
            const done = await upload(e.dataTransfer.files, kind);
            const first = done.find(Boolean);
            if (first && !multiple) choose(first.id);
          }}
        >
          <UploadCloud className="size-6 text-lavender" aria-hidden />
          <p className="text-sm text-muted">Drop files here or</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => input.current?.click()}>
            Upload {kind}
          </button>
          <input
            ref={input}
            type="file"
            accept={ACCEPT[kind].accept}
            multiple={multiple}
            className="sr-only"
            onChange={async (e) => {
              if (!e.target.files?.length) return;
              const done = await upload(e.target.files, kind);
              e.target.value = '';
              const first = done.find(Boolean);
              if (first && !multiple) choose(first.id);
            }}
          />
        </div>
        <UploadQueue jobs={jobs} onCancel={cancel} onClear={clearFinished} />
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No {kind} files in your library yet.</p>
        ) : (
          <ul className="grid max-h-[46vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
            {items.map((asset) => {
              const isSelected = selected.includes(asset.id);
              return (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => choose(asset.id)}
                    aria-pressed={multiple ? isSelected : undefined}
                    className={`group relative block w-full overflow-hidden rounded-xl border-2 text-left ${isSelected ? 'border-primary' : 'border-transparent hover:border-line-strong'}`}
                  >
                    <div className="aspect-square">
                      <AssetThumb asset={asset} />
                    </div>
                    <span className="block truncate bg-black/50 px-2 py-1 text-[11px]">{asset.filename}</span>
                    {asset.visibility === 'private' && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1" title="Private — hidden on your public page">
                        <Lock className="size-3" aria-label="Private" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {multiple && (
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!selected.length}
              onClick={() => {
                onPick(selected);
                setSelected([]);
                onClose();
              }}
            >
              Add {selected.length || ''} selected
            </button>
          </div>
        )}
      </div>
    </Dialog>
  );
}

/** A form field holding a single asset reference. */
export function AssetField({ label, kind, value, onChange, hint, shape = 'square' }: { label: string; kind: AssetKind; value: string | null; onChange: (id: string | null) => void; hint?: string; shape?: 'square' | 'wide' | 'round' }) {
  const { library } = useEditor();
  const [open, setOpen] = useState(false);
  const asset = value ? library.find((a) => a.id === value) : undefined;
  const missing = Boolean(value && !asset);
  const box = shape === 'wide' ? 'h-16 w-28' : shape === 'round' ? 'size-16 rounded-full' : 'size-16';
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-3">
        <div className={`${box} shrink-0 overflow-hidden rounded-xl border border-line`}>
          <AssetThumb asset={asset} />
        </div>
        <div className="min-w-0 flex-1">
          {asset ? <p className="truncate text-sm">{asset.filename}</p> : <p className="text-sm text-muted">{missing ? 'File was deleted' : 'None selected'}</p>}
          {asset?.visibility === 'private' && <p className="text-xs text-warning">Private — won’t show on your public page</p>}
          <div className="mt-1.5 flex gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>
              {asset ? 'Change' : 'Choose'}
            </button>
            {value && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)} aria-label={`Remove ${label}`}>
                <X className="size-4" aria-hidden /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
      {hint && <p className="hint mt-1.5">{hint}</p>}
      <MediaPicker open={open} onClose={() => setOpen(false)} kind={kind} onPick={([id]) => onChange(id)} />
    </div>
  );
}
