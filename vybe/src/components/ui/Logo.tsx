import Link from 'next/link';
import { brand } from '@/config/brand';

export function LogoMark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="vybe-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-primary)" />
          <stop offset="1" stopColor="var(--color-secondary)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#vybe-mark)" opacity="0.18" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="url(#vybe-mark)" strokeOpacity="0.7" />
      <path d="M8 9.5 L16 23 L24 9.5" fill="none" stroke="url(#vybe-mark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="9.5" r="1.8" fill="#fff" />
    </svg>
  );
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg font-display text-lg font-bold tracking-[0.18em]" aria-label={`${brand.name} home`}>
      <LogoMark />
      <span>{brand.name}</span>
    </Link>
  );
}
