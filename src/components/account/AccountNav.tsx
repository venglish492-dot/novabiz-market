'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n/client';

export function AccountNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const items = [
    { href: '/account', label: t.account.overview, exact: true },
    { href: '/library', label: t.account.library },
    { href: '/account/purchases', label: t.account.purchases },
    { href: '/account/licenses', label: t.account.licenses },
    { href: '/account/downloads', label: t.account.downloads },
    { href: '/account/profile', label: t.account.profile },
    { href: '/account/security', label: t.account.security },
    { href: '/account/settings', label: t.account.settings },
  ];
  return (
    <nav aria-label={t.account.nav} className="no-scrollbar relative -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className="shrink-0 rounded-full px-3.5 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:text-fg lg:rounded-lg"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
