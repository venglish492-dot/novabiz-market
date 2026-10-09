/**
 * Vektor Lab mark: the laboratory flask from the original identity, reduced
 * to a single precise outline, with the "V" and its ascending vector arrow.
 */
export function LogoMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" className="fill-surface-2 stroke-line-strong" />
      <path
        d="M13 6.5h6M14 6.8v5.4l-5.6 10.1A1.6 1.6 0 0 0 9.8 24.7h12.4a1.6 1.6 0 0 0 1.4-2.4L18 12.2V6.8"
        className="stroke-fg-subtle"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.6 14.6 16 22l2.1-3.6" className="stroke-fg" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.1 18.4 23.6 9.2" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M20.1 8.9h3.7v3.7" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = '', size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="text-[13px] leading-none tracking-[0.2em] text-fg">
        <span className="font-semibold">VEKTOR</span> <span className="font-normal text-fg-muted">LAB</span>
      </span>
    </span>
  );
}
