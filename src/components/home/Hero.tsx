import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { pick, type Locale, type LocalizedText } from '@/i18n/config';
import { ButtonLink } from '@/components/ui/Button';
import { HeroVisual } from '@/components/three/HeroVisual';
import type { CategoryTone } from '@/types';

export function Hero({
  t,
  locale,
  categories,
}: {
  t: Dictionary;
  locale: Locale;
  categories: Array<{ slug: string; name: LocalizedText; count: number; tone: CategoryTone }>;
}) {
  return (
    <section data-hero className="relative isolate -mt-16 overflow-hidden pt-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[640px] w-[820px] rounded-full bg-[radial-gradient(closest-side,var(--bg-glow),transparent)]" />
        <div className="absolute -right-32 top-10 h-[560px] w-[620px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent-2)_8%,transparent),transparent)]" />
        <div className="hairline-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(70%_60%_at_60%_40%,black,transparent)]" />
      </div>

      <div className="container-page grid items-center gap-6 pb-14 pt-6 lg:min-h-[min(860px,calc(100svh-4rem))] lg:grid-cols-[1.02fr_1fr] lg:gap-4 lg:pb-20 lg:pt-10">
        <div className="relative order-1 h-[260px] sm:h-[360px] lg:order-2 lg:h-[640px]">
          <HeroVisual label={t.hero.sceneLabel} />
        </div>

        <div className="relative order-2 max-w-2xl animate-fade-up lg:order-1">
          <p className="t-eyebrow flex items-center gap-2.5 text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" aria-hidden />
            {t.hero.eyebrow}
          </p>
          <h1 className="t-display mt-6 text-balance text-fg">
            {t.hero.titleLead}{' '}
            <span className="text-fg-subtle">{t.hero.titleTail}</span>
          </h1>
          <p className="t-lead mt-6 max-w-xl text-pretty">{t.hero.subtitle}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/products" size="lg" className="group">
              {t.hero.primaryCta}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/categories" size="lg" variant="secondary">
              {t.hero.secondaryCta}
            </ButtonLink>
          </div>
          <p className="mt-5 flex items-center gap-2 text-[13px] text-fg-subtle">
            <Check className="h-4 w-4 text-success" aria-hidden />
            {t.hero.note}
          </p>

          {categories.length > 0 && (
            <nav aria-label={t.nav.categories} className="mt-12 border-t border-line pt-6">
              <ul className="flex flex-wrap gap-x-6 gap-y-3">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="group flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--tone-${category.tone})` }} aria-hidden />
                      {pick(category.name, locale)}
                      <span className="t-mono text-[11px] text-fg-subtle">{String(category.count).padStart(2, '0')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
