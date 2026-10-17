'use client';

import { useState } from 'react';
import { Check, Copy, Flag } from 'lucide-react';
import { ReportDialog } from '@/components/community/ReportDialog';
import { useToast } from '@/components/ui/Toast';

export function CopyButton({ text, label = 'Copy link', className = 'btn btn-secondary btn-sm' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const url = text.startsWith('/') ? `${location.origin}${text}` : text;
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.show('error', 'Couldn’t copy automatically', url);
        }
      }}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? 'Copied' : label}
    </button>
  );
}

export function MediaReportButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        <Flag className="size-4" aria-hidden /> Report
      </button>
      <ReportDialog open={open} onClose={() => setOpen(false)} targetType="media" targetId={id} targetLabel="this file" />
    </>
  );
}
