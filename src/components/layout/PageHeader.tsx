import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { JsonLd, breadcrumbLd } from '@/lib/seo/jsonld';

export interface Crumb {
  name: string;
  href: string;
}

export function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <>
      <nav aria-label={label}>
        <ol className="flex flex-wrap items-center gap-1 text-[13px] text-fg-subtle">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="text-fg-muted">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.href} className="transition-colors hover:text-fg">
                    {item.name}
                  </Link>
                )}
                {!last && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(items.map((item) => ({ name: item.name, path: item.href })))} />
    </>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs,
  crumbLabel,
  children,
  aside,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  crumbLabel?: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-line">
      <div aria-hidden className="hairline-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(60%_100%_at_20%_0%,black,transparent)]" />
      <div className="container-page relative pb-10 pt-10 lg:pb-14 lg:pt-14">
        {crumbs && crumbs.length > 1 && <Breadcrumbs items={crumbs} label={crumbLabel ?? 'Breadcrumb'} />}
        <div className={`flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between ${crumbs && crumbs.length > 1 ? 'mt-8' : ''}`}>
          <div className="max-w-3xl">
            {eyebrow && <p className="t-eyebrow mb-4">{eyebrow}</p>}
            <h1 className="t-h1 text-balance text-fg">{title}</h1>
            {description && <p className="t-lead mt-4 max-w-2xl text-pretty">{description}</p>}
          </div>
          {aside}
        </div>
        {children}
      </div>
    </header>
  );
}
