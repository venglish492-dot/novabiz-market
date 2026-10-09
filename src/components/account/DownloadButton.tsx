'use client';

import { useState } from 'react';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { track } from '@/lib/client/analytics';
import { useToast } from '@/components/providers/ToastProvider';
import { buttonClasses } from '@/components/ui/Button';

/**
 * Requests a short-lived signed URL from the server (which verifies ownership)
 * and then navigates to it. Falls back to a plain link without JavaScript.
 */
export function DownloadButton({
  fileId,
  productId,
  label,
  external = false,
  variant = 'secondary',
}: {
  fileId: string;
  productId: string;
  label: string;
  external?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const href = `/api/download?file=${fileId}`;

  return (
    <a
      href={href}
      onClick={async (event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        try {
          const response = await fetch(`${href}&mode=json`, { cache: 'no-store' });
          const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
          if (!response.ok || !body.url) {
            toast({
              tone: 'error',
              message: response.status === 429 ? t.library.rateLimited : t.library.downloadError,
            });
            return;
          }
          track('download', { productId });
          if (external) window.open(body.url, '_blank', 'noopener,noreferrer');
          else window.location.assign(body.url);
        } catch {
          toast({ tone: 'error', message: t.library.downloadError });
        } finally {
          setPending(false);
        }
      }}
      className={buttonClasses({ variant, size: 'sm' })}
      aria-busy={pending}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : external ? (
        <ExternalLink className="h-4 w-4" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      {label}
    </a>
  );
}
