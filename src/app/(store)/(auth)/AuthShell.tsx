import type { ReactNode } from 'react';
import { getI18n } from '@/i18n/server';
import { publicSupabase, siteConfig } from '@/lib/config/site';
import { Notice } from '@/components/ui/Notice';
import { LogoMark } from '@/components/ui/Logo';

/** Centered authentication card with an honest state when accounts are not configured. */
export async function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { t } = await getI18n();
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(50%_60%_at_50%_0%,var(--bg-glow),transparent)]" />
      <div className="container-page relative flex justify-center py-14 lg:py-20">
        <div className="w-full max-w-[420px]">
          <div className="flex flex-col items-center text-center">
            <LogoMark size={40} />
            <h1 className="mt-6 text-[28px] font-semibold leading-tight tracking-tight text-fg">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-fg-muted">{subtitle}</p>}
          </div>
          <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-md sm:p-7">
            {publicSupabase.configured ? (
              children
            ) : (
              <Notice tone="info" title={t.config.accountsUnavailableTitle}>
                {t.config.accountsUnavailableBody}{' '}
                <a href={`mailto:${siteConfig.email}`} className="text-fg underline underline-offset-4">
                  {siteConfig.email}
                </a>
              </Notice>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
