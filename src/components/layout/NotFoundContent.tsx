import { Search } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { ButtonLink, buttonClasses } from '@/components/ui/Button';
import { SceneFallback } from '@/components/three/SceneFallback';

export async function NotFoundContent() {
  const { t } = await getI18n();
  return (
    <section className="relative overflow-hidden">
      <div className="container-page grid min-h-[70vh] items-center gap-10 py-16 lg:grid-cols-[1.1fr_1fr]">
        <div className="max-w-xl">
          <p className="t-eyebrow">{t.errors.notFoundEyebrow}</p>
          <h1 className="t-h1 mt-5 text-balance text-fg">{t.errors.notFoundTitle}</h1>
          <p className="t-lead mt-5">{t.errors.notFoundBody}</p>
          <form action="/search" role="search" className="mt-8 flex gap-2">
            <label htmlFor="not-found-search" className="sr-only">
              {t.search.label}
            </label>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
              <input
                id="not-found-search"
                name="q"
                type="search"
                placeholder={t.search.placeholder}
                className="h-12 w-full rounded-full border border-line-strong bg-surface pl-11 pr-4 text-[15px] text-fg outline-none placeholder:text-fg-subtle focus:border-accent"
              />
            </div>
            <button type="submit" className={buttonClasses({ size: 'lg', variant: 'secondary' })}>
              {t.search.title}
            </button>
          </form>
          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink href="/products">{t.errors.browse}</ButtonLink>
            <ButtonLink href="/" variant="ghost">
              {t.errors.home}
            </ButtonLink>
          </div>
        </div>
        <div className="relative hidden h-[420px] lg:block" aria-hidden>
          <SceneFallback />
          <p className="t-mono absolute inset-x-0 bottom-0 text-center text-[120px] font-medium leading-none tracking-tighter text-[color-mix(in_oklab,var(--fg)_6%,transparent)]">
            404
          </p>
        </div>
      </div>
    </section>
  );
}
