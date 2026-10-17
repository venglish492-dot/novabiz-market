'use client';

import { useActionState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { reportAction } from '@/app/actions/community';

const REASONS: { value: string; label: string }[] = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'explicit', label: 'Sexual or explicit content' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'illegal', label: 'Illegal content' },
  { value: 'copyright', label: 'Copyright infringement' },
  { value: 'other', label: 'Something else' },
];

export function ReportDialog({ open, onClose, targetType, targetId, targetLabel }: { open: boolean; onClose: () => void; targetType: 'profile' | 'media'; targetId: string; targetLabel: string }) {
  const [state, action, pending] = useActionState(reportAction, undefined);
  return (
    <Dialog open={open} onClose={onClose} title={`Report ${targetLabel}`} description="Reports are reviewed by moderators. Your identity isn’t shared with the creator." size="sm">
      {state?.ok ? (
        <div className="space-y-4">
          <p className="text-sm text-emerald-300" role="status">
            {state.message}
          </p>
          <button type="button" className="btn btn-secondary w-full" onClick={onClose}>
            Close
          </button>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <fieldset>
            <legend className="label">Reason</legend>
            <div className="grid gap-1.5">
              {REASONS.map((reason) => (
                <label key={reason.value} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 py-2 text-sm hover:bg-white/5 has-[:checked]:border-primary/60 has-[:checked]:bg-primary/10">
                  <input type="radio" name="reason" value={reason.value} required className="accent-[var(--color-primary)]" />
                  {reason.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="report-details" className="label">
              Details <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea id="report-details" name="details" maxLength={1000} className="input" placeholder="Anything that helps moderators understand the problem" />
          </div>
          {state?.error && (
            <p className="field-error" role="alert">
              {state.error}
            </p>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={pending}>
            {pending ? <span className="spinner" /> : null} Send report
          </button>
        </form>
      )}
    </Dialog>
  );
}
