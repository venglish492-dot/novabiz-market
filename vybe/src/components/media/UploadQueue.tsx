'use client';

import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { formatBytes, type UploadJob } from './useUploader';

export function UploadQueue({ jobs, onCancel, onClear }: { jobs: UploadJob[]; onCancel: (id: string) => void; onClear: () => void }) {
  if (!jobs.length) return null;
  return (
    <div className="space-y-2" aria-live="polite">
      {jobs.map((job) => (
        <div key={job.id} className="rounded-xl border border-line bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            {job.state === 'done' && <CheckCircle2 className="size-4 text-emerald-300" aria-hidden />}
            {job.state === 'error' && <AlertTriangle className="size-4 text-rose-300" aria-hidden />}
            <span className="min-w-0 flex-1 truncate">{job.name}</span>
            <span className="font-mono text-xs text-faint">{formatBytes(job.size)}</span>
            {job.state === 'uploading' && (
              <button type="button" onClick={() => onCancel(job.id)} className="rounded p-1 text-muted hover:text-text" aria-label={`Cancel upload of ${job.name}`}>
                <X className="size-4" />
              </button>
            )}
          </div>
          {job.state === 'uploading' && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(job.progress * 100)} aria-label={`Uploading ${job.name}`}>
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.max(4, job.progress * 100)}%` }} />
            </div>
          )}
          {job.error && <p className="mt-1 text-xs text-rose-300">{job.error}</p>}
          {job.state === 'cancelled' && <p className="mt-1 text-xs text-muted">Cancelled</p>}
        </div>
      ))}
      {jobs.some((j) => j.state !== 'uploading') && (
        <button type="button" onClick={onClear} className="text-xs text-muted hover:text-text">
          Clear finished
        </button>
      )}
    </div>
  );
}
