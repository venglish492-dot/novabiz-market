'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { Button } from '@/components/ui/Button';
import { siteConfig } from '@/lib/config/site';

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    // Details are logged server-side; only the digest is useful to share with support.
    console.error('page_error', error.digest ?? '');
  }, [error]);
  return (
    <div className="container-page flex min-h-[60vh] max-w-xl flex-col items-start justify-center py-16">
      <p className="t-eyebrow">{t.common.somethingWrong}</p>
      <h1 className="t-h1 mt-4 text-fg">{t.errors.genericTitle}</h1>
      <p className="t-lead mt-4">{t.errors.genericBody}</p>
      {error.digest && <p className="t-mono mt-3 text-xs text-fg-subtle">ref: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap gap-2">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          {t.common.retry}
        </Button>
        <Link href="/" className="inline-flex h-11 items-center px-5 text-sm text-fg-muted hover:text-fg">
          {t.errors.home}
        </Link>
        <a href={`mailto:${siteConfig.email}`} className="inline-flex h-11 items-center px-5 text-sm text-fg-muted hover:text-fg">
          {siteConfig.email}
        </a>
      </div>
    </div>
  );
}
