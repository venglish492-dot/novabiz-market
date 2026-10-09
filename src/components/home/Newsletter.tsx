'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { siteConfig } from '@/lib/config/site';
import { buttonClasses } from '@/components/ui/Button';

/**
 * Newsletter sign-up. When the subscriber store is not configured, no form is
 * shown — just an honest invitation to write to us.
 */
export function Newsletter({ enabled }: { enabled: boolean }) {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<'idle' | 'pending' | 'done' | 'invalid' | 'error'>('idle');

  const privacyLink = (
    <Link href="/privacy" className="underline underline-offset-4 hover:text-fg">
      {t.newsletter.privacyLink}
    </Link>
  );
  const [before, after] = t.newsletter.consent.split('{privacy}');

  return (
    <section className="border-t border-line py-20 lg:py-24" aria-labelledby="newsletter-title">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
        <div className="max-w-xl">
          <p className="t-eyebrow mb-4">{t.newsletter.eyebrow}</p>
          <h2 id="newsletter-title" className="t-h2 text-fg">
            {t.newsletter.title}
          </h2>
          <p className="t-lead mt-4">{enabled ? t.newsletter.body : t.newsletter.unavailableBody}</p>
        </div>

        {enabled ? (
          <form
            noValidate
            className="w-full"
            onSubmit={async (event) => {
              event.preventDefault();
              const email = String(new FormData(event.currentTarget).get('email') ?? '').trim();
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setStatus('invalid');
                return;
              }
              setStatus('pending');
              try {
                const response = await fetch('/api/newsletter', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, locale }),
                });
                setStatus(response.ok ? 'done' : response.status === 400 ? 'invalid' : 'error');
              } catch {
                setStatus('error');
              }
            }}
          >
            {status === 'done' ? (
              <p role="status" className="rounded-2xl border border-success/30 bg-success-soft px-5 py-4 text-sm text-fg">
                {t.newsletter.success}
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label htmlFor="newsletter-email" className="sr-only">
                    {t.auth.email}
                  </label>
                  <input
                    id="newsletter-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={t.newsletter.placeholder}
                    aria-invalid={status === 'invalid'}
                    aria-describedby="newsletter-message"
                    className="h-12 min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-5 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-accent"
                  />
                  <button type="submit" disabled={status === 'pending'} className={buttonClasses({ size: 'lg' })}>
                    {status === 'pending' ? t.newsletter.submitting : t.newsletter.submit}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <p id="newsletter-message" role={status === 'invalid' || status === 'error' ? 'alert' : undefined} className="mt-3 px-1 text-xs text-fg-subtle">
                  {status === 'invalid' ? (
                    <span className="text-danger">{t.newsletter.invalid}</span>
                  ) : status === 'error' ? (
                    <span className="text-danger">{t.newsletter.error}</span>
                  ) : (
                    <>
                      {before}
                      {privacyLink}
                      {after}
                    </>
                  )}
                </p>
              </>
            )}
          </form>
        ) : (
          <a href={`mailto:${siteConfig.email}`} className={buttonClasses({ variant: 'secondary', size: 'lg', className: 'justify-self-start lg:justify-self-end' })}>
            <Mail className="h-4 w-4" aria-hidden />
            {siteConfig.email}
          </a>
        )}
      </div>
    </section>
  );
}
