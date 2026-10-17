import Link from 'next/link';
import { brand } from '@/config/brand';
import { Logo } from '@/components/ui/Logo';

const COLUMNS = [
  { title: 'Product', links: [['Create a page', '/signup'], ['Pricing', '/pricing'], ['Compare', '/compare'], ['Media hosting', '/media'], ['Changelog', '/changelog']] },
  { title: 'Explore', links: [['Discover', '/discover'], ['Leaderboard', '/leaderboard'], ['Demo: @nova', '/@nova'], ['Demo: @kairo', '/@kairo']] },
  { title: 'Support', links: [['Help center', '/help'], ['Contact', '/contact'], ['Community guidelines', '/guidelines']] },
  { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '/terms']] },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-black/30">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-sm text-muted">{brand.tagline}</p>
          <p className="text-xs text-faint">Every feature free. No premium tier.</p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-faint">{column.title}</h2>
            <ul className="space-y-2">
              {column.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted transition-colors hover:text-text">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. v{brand.version}
          </p>
          <p>Brand names and logos belong to their owners and are used only to label links.</p>
        </div>
      </div>
    </footer>
  );
}
