import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { siteConfig } from '@/lib/config/site';
import { Logo } from '@/components/ui/Logo';

export async function SiteFooter() {
  const { t } = await getI18n();
  const year = new Date().getUTCFullYear();

  const columns = [
    {
      title: t.footer.shop,
      links: [
        { href: '/products', label: t.nav.allProducts },
        { href: '/categories', label: t.nav.categories },
        { href: '/collections', label: t.nav.collections },
        { href: '/search', label: t.nav.search },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { href: '/about', label: t.nav.about },
        { href: '/resources', label: t.nav.resources },
        { href: '/blog', label: t.nav.blog },
        { href: '/contact', label: t.nav.contact },
      ],
    },
    {
      title: t.footer.help,
      links: [
        { href: '/library', label: t.nav.library },
        { href: '/account', label: t.nav.account },
        { href: '/wishlist', label: t.nav.wishlist },
        { href: '/contact', label: t.nav.support },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { href: '/terms', label: t.footer.terms },
        { href: '/privacy', label: t.footer.privacy },
        { href: '/refunds', label: t.footer.refunds },
        { href: '/licenses', label: t.footer.licenses },
      ],
    },
  ];

  return (
    <footer className="relative z-[1] mt-24 border-t border-line bg-surface/40">
      <div className="container-page py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label="Vektor Lab" className="inline-block rounded-lg">
              <Logo size={32} />
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-fg-muted">{t.footer.tagline}</p>
            <p className="t-eyebrow mb-3 mt-8">{t.footer.contactUs}</p>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a href={`mailto:${siteConfig.email}`} className="inline-flex items-center gap-2 text-fg-muted hover:text-fg">
                  <Mail className="h-4 w-4" aria-hidden />
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <a href={siteConfig.phoneHref} className="inline-flex items-center gap-2 text-fg-muted hover:text-fg">
                  <Phone className="h-4 w-4" aria-hidden />
                  {siteConfig.phone}
                </a>
              </li>
            </ul>
          </div>
          <nav aria-label={t.footer.legal} className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="t-eyebrow mb-4">{column.title}</p>
                <ul className="flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}`}>
                      <Link href={link.href} className="text-sm text-fg-muted transition-colors hover:text-fg">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.legalName}. {t.footer.rights}
          </p>
          <p className="t-mono tracking-wider">{siteConfig.domain}</p>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none overflow-hidden">
        <p className="container-page select-none whitespace-nowrap pb-2 text-[clamp(4rem,15vw,13rem)] font-semibold leading-[0.8] tracking-[-0.06em] text-[color-mix(in_oklab,var(--fg)_5%,transparent)]">
          VEKTOR LAB
        </p>
      </div>
    </footer>
  );
}
