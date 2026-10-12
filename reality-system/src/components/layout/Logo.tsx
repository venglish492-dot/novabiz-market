/** The original REALITY SYSTEM emblem: nested rotated hexagons around a core. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label="REALITY SYSTEM emblem">
      <defs>
        <linearGradient id="rs-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--rs-accent)" />
          <stop offset="1" stopColor="var(--rs-accent2)" />
        </linearGradient>
      </defs>
      <polygon points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5" fill="none" stroke="url(#rs-logo-g)" strokeWidth="2.5" />
      <polygon points="32,13 48,22 48,42 32,51 16,42 16,22" fill="none" stroke="var(--rs-accent)" strokeOpacity="0.45" strokeWidth="1.2" transform="rotate(30 32 32)" />
      <path d="M32 20 L42 32 L32 44 L22 32 Z" fill="url(#rs-logo-g)" fillOpacity="0.85" />
      <circle cx="32" cy="32" r="3.2" fill="#fff" />
    </svg>
  )
}
