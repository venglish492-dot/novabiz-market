'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  CreditCard,
  FileStack,
  FolderTree,
  LayoutDashboard,
  Layers,
  Menu,
  MessageSquare,
  Newspaper,
  Package,
  Receipt,
  ScrollText,
  Settings,
  Tag,
  Users,
  X,
  ArrowLeft,
} from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import { useAdminT } from './AdminI18n';

export function AdminShell({ isAdmin, email, children }: { isAdmin: boolean; email: string; children: React.ReactNode }) {
  const t = useAdminT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = [
    { href: '/admin', label: t.nav.overview, icon: LayoutDashboard, exact: true, admin: false },
    { href: '/admin/products', label: t.nav.products, icon: Package, admin: false },
    { href: '/admin/orders', label: t.nav.orders, icon: Receipt, admin: true },
    { href: '/admin/payments', label: t.nav.payments, icon: CreditCard, admin: true },
    { href: '/admin/customers', label: t.nav.customers, icon: Users, admin: true },
    { href: '/admin/reviews', label: t.nav.reviews, icon: MessageSquare, admin: true },
    { href: '/admin/categories', label: t.nav.categories, icon: FolderTree, admin: false },
    { href: '/admin/collections', label: t.nav.collections, icon: Layers, admin: false },
    { href: '/admin/bundles', label: t.nav.bundles, icon: Boxes, admin: false },
    { href: '/admin/coupons', label: t.nav.coupons, icon: Tag, admin: true },
    { href: '/admin/files', label: t.nav.files, icon: FileStack, admin: false },
    { href: '/admin/analytics', label: t.nav.analytics, icon: BarChart3, admin: true },
    { href: '/admin/content', label: t.nav.content, icon: Newspaper, admin: false },
    { href: '/admin/settings', label: t.nav.settings, icon: Settings, admin: true },
    { href: '/admin/audit', label: t.nav.audit, icon: ScrollText, admin: true },
  ].filter((item) => isAdmin || !item.admin);

  const nav = (
    <nav aria-label={t.title} className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? 'page' : undefined}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:text-fg"
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-line bg-surface/50 lg:flex lg:flex-col">
        <div className="sticky top-0 flex h-dvh flex-col gap-6 overflow-y-auto p-4">
          <Link href="/admin" className="flex items-center gap-2.5 px-2 pt-2">
            <LogoMark size={28} />
            <span className="text-sm font-semibold text-fg">{t.title}</span>
          </Link>
          {nav}
          <div className="mt-auto border-t border-line px-2 pt-4 text-xs text-fg-subtle">
            <p className="truncate">{email}</p>
            <Link href="/" className="mt-2 inline-flex items-center gap-1.5 text-fg-muted hover:text-fg">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {t.backToStore}
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <LogoMark size={26} />
          <span className="text-sm font-semibold text-fg">{t.title}</span>
        </Link>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={t.title} className="rounded-full p-2 text-fg-muted hover:bg-surface-2">
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>
      {open && <div className="border-b border-line p-3 lg:hidden">{nav}</div>}

      <main id="main" className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
