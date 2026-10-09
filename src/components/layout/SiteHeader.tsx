'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ChevronDown, Heart, LayoutDashboard, Library, LogOut, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { pick, type LocalizedText } from '@/i18n/config';
import { plural } from '@/i18n/plural';
import type { CategoryTone } from '@/types';
import { Logo } from '@/components/ui/Logo';
import { Popover } from '@/components/ui/Popover';
import { Dialog } from '@/components/ui/Dialog';
import { buttonClasses } from '@/components/ui/Button';
import { useCart, useWishlist } from '@/components/providers/CommerceProvider';
import { useUI } from '@/components/providers/UIProvider';
import { useSession } from '@/components/providers/SessionProvider';
import { signOutAction } from '@/lib/actions/auth';
import { LanguageOptions, PreferencesIcon, ThemeOptions } from './Preferences';

export interface NavData {
  categories: Array<{ slug: string; name: LocalizedText; description: LocalizedText; count: number; tone: CategoryTone }>;
  collections: Array<{ slug: string; title: LocalizedText }>;
}

/** Display is set separately so responsive `hidden`/`sm:inline-flex` variants don't conflict. */
const iconButtonBase =
  'relative h-10 w-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg';
const iconButton = `inline-flex ${iconButtonBase}`;

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ nav }: { nav: NavData }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const { openPalette } = useUI();
  const cart = useCart();
  const wishlist = useWishlist();
  const { user, accountsEnabled } = useSession();
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > 8, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={isActive(pathname, href) ? 'page' : undefined}
      className="rounded-full px-3 py-2 text-[13.5px] text-fg-muted transition-colors hover:text-fg aria-[current=page]:text-fg"
    >
      {label}
    </Link>
  );

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || mobileOpen ? 'glass border-line' : 'border-transparent bg-transparent'
      }`}
    >
      <div className="container-page flex h-16 items-center gap-2">
        <Link href="/" aria-label="Vektor Lab" className="mr-2 shrink-0 rounded-lg py-1 lg:mr-6">
          <Logo />
        </Link>

        <nav aria-label={t.nav.primary} className="hidden items-center lg:flex">
          {navLink('/products', t.nav.products)}
          <Popover
            triggerLabel={t.nav.categories}
            align="start"
            trigger={
              <span className="flex items-center gap-1">
                {t.nav.categories}
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </span>
            }
            triggerClassName={`rounded-full px-3 py-2 text-[13.5px] transition-colors hover:text-fg aria-expanded:text-fg ${
              isActive(pathname, '/categories') ? 'text-fg' : 'text-fg-muted'
            }`}
            panelClassName="w-[560px] p-3"
          >
            {(close) => (
              <div>
                <ul className="grid grid-cols-2 gap-1">
                  {nav.categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/categories/${category.slug}`}
                        onClick={close}
                        className="group flex flex-col rounded-xl p-3 transition-colors hover:bg-surface-2"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-fg">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--tone-${category.tone})` }} aria-hidden />
                          {pick(category.name, locale)}
                          <span className="ml-auto text-xs font-normal text-fg-subtle">{category.count}</span>
                        </span>
                        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-fg-subtle">{pick(category.description, locale)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center justify-between border-t border-line px-3 pt-3">
                  <Link href="/categories" onClick={close} className="flex items-center gap-1 text-sm text-fg hover:text-accent">
                    {t.nav.allCategories}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                  <Link href="/products" onClick={close} className="text-sm text-fg-muted hover:text-fg">
                    {t.nav.allProducts}
                  </Link>
                </div>
              </div>
            )}
          </Popover>
          {navLink('/collections', t.nav.collections)}
          {navLink('/resources', t.nav.resources)}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={openPalette}
            className="hidden h-10 w-[260px] items-center gap-2.5 rounded-full border border-line bg-surface-2/70 pl-4 pr-2 text-left text-[13px] text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted xl:flex"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span className="flex-1 truncate">{t.nav.searchPlaceholder}</span>
            <kbd className="t-mono rounded-md border border-line px-1.5 py-0.5 text-[10px] text-fg-subtle">⌘K</kbd>
          </button>
          <button type="button" onClick={openPalette} className={`${iconButtonBase} inline-flex xl:hidden`} aria-label={t.nav.search}>
            <Search className="h-[18px] w-[18px]" aria-hidden />
          </button>

          <Link href="/wishlist" className={`${iconButtonBase} hidden sm:inline-flex`} aria-label={`${t.nav.wishlist} (${wishlist.count})`}>
            <Heart className="h-[18px] w-[18px]" aria-hidden />
            {wishlist.count > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden />
            )}
          </Link>

          <button
            type="button"
            onClick={cart.open}
            className={iconButton}
            aria-label={`${t.nav.cart}: ${plural(t.common.items, cart.count, locale)}`}
          >
            <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
            {cart.count > 0 && (
              <span
                key={cart.count}
                className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] animate-pop items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-fg"
                aria-hidden
              >
                {cart.count}
              </span>
            )}
          </button>

          <div className="hidden sm:block">
            <Popover
              triggerLabel={`${t.nav.language} / ${t.nav.theme}`}
              trigger={<PreferencesIcon />}
              triggerClassName={iconButton}
              panelClassName="w-60"
            >
              {(close) => (
                <div className="flex flex-col gap-2">
                  <LanguageOptions onDone={close} />
                  <div className="h-px bg-line" />
                  <ThemeOptions />
                </div>
              )}
            </Popover>
          </div>

          {user ? (
            <div className="hidden sm:block">
              <Popover
                triggerLabel={t.nav.account}
                trigger={
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong bg-surface-2 text-xs font-semibold uppercase text-fg">
                    {(user.name || user.email).slice(0, 1)}
                  </span>
                }
                triggerClassName="ml-1 rounded-full"
                panelClassName="w-64"
              >
                {(close) => (
                  <div className="flex flex-col">
                    <div className="px-3 pb-3 pt-2">
                      <p className="truncate text-sm font-medium text-fg">{user.name || user.email}</p>
                      {user.name && <p className="truncate text-xs text-fg-subtle">{user.email}</p>}
                    </div>
                    <div className="h-px bg-line" />
                    <div className="flex flex-col py-1.5">
                      <MenuLink href="/library" icon={<Library className="h-4 w-4" />} label={t.nav.library} onClick={close} />
                      <MenuLink href="/account" icon={<User className="h-4 w-4" />} label={t.nav.account} onClick={close} />
                      {user.isStaff && (
                        <MenuLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label={t.nav.admin} onClick={close} />
                      )}
                    </div>
                    <div className="h-px bg-line" />
                    <form action={signOutAction} className="pt-1.5">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
                      >
                        <LogOut className="h-4 w-4" aria-hidden />
                        {t.nav.signOut}
                      </button>
                    </form>
                  </div>
                )}
              </Popover>
            </div>
          ) : (
            accountsEnabled && (
              <div className="ml-1 hidden sm:block">
                <Link href="/login" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                  {t.nav.signIn}
                </Link>
              </div>
            )
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={`${iconButtonBase} inline-flex lg:hidden`}
            aria-label={t.nav.openMenu}
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} label={t.nav.primary} variant="sheet-right">
        <MobileNav nav={nav} onClose={() => setMobileOpen(false)} />
      </Dialog>
    </header>
  );
}

function MenuLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg">
      <span aria-hidden>{icon}</span>
      {label}
    </Link>
  );
}

function MobileNav({ nav, onClose }: { nav: NavData; onClose: () => void }) {
  const { t, locale } = useI18n();
  const { user, accountsEnabled } = useSession();
  const wishlist = useWishlist();
  const pathname = usePathname();

  const primary = [
    { href: '/products', label: t.nav.products },
    { href: '/categories', label: t.nav.categories },
    { href: '/collections', label: t.nav.collections },
    { href: '/resources', label: t.nav.resources },
    { href: '/about', label: t.nav.about },
    { href: '/contact', label: t.nav.contact },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
        <Logo />
        <button type="button" onClick={onClose} className={iconButton} aria-label={t.nav.closeMenu}>
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <nav aria-label={t.nav.primary} className="flex-1 overflow-y-auto px-4 py-4">
        <ul className="flex flex-col">
          {primary.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                className="flex items-center justify-between border-b border-line py-3.5 text-[17px] font-medium tracking-tight text-fg aria-[current=page]:text-accent"
              >
                {item.label}
                <ArrowUpRight className="h-4 w-4 text-fg-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <p className="t-eyebrow mb-2 mt-7">{t.nav.categories}</p>
        <ul className="grid grid-cols-2 gap-1.5">
          {nav.categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/categories/${category.slug}`}
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm text-fg-muted hover:text-fg"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: `var(--tone-${category.tone})` }} aria-hidden />
                <span className="truncate">{pick(category.name, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-7 grid grid-cols-2 gap-2">
          <Link href="/wishlist" onClick={onClose} className={buttonClasses({ variant: 'secondary', size: 'md' })}>
            <Heart className="h-4 w-4" aria-hidden />
            {t.nav.wishlist}
            {wishlist.count > 0 && <span className="text-fg-subtle">{wishlist.count}</span>}
          </Link>
          {user ? (
            <Link href="/library" onClick={onClose} className={buttonClasses({ variant: 'secondary', size: 'md' })}>
              <Library className="h-4 w-4" aria-hidden />
              {t.nav.library}
            </Link>
          ) : (
            accountsEnabled && (
              <Link href="/login" onClick={onClose} className={buttonClasses({ variant: 'primary', size: 'md' })}>
                {t.nav.signIn}
              </Link>
            )
          )}
        </div>
        {user && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/account" onClick={onClose} className={buttonClasses({ variant: 'ghost', size: 'md' })}>
              {t.nav.account}
            </Link>
            <form action={signOutAction}>
              <button type="submit" className={buttonClasses({ variant: 'ghost', size: 'md', className: 'w-full' })}>
                {t.nav.signOut}
              </button>
            </form>
          </div>
        )}

        <div className="mt-7 grid grid-cols-1 gap-4 rounded-2xl border border-line p-2 sm:grid-cols-2">
          <LanguageOptions onDone={onClose} />
          <ThemeOptions />
        </div>
      </nav>
    </div>
  );
}
