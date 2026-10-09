/**
 * Static, dependency-free rendering of the Vektor Core: stacked layers around
 * a vector beam. Shown while WebGL loads, and permanently when WebGL is
 * unavailable. Pure CSS — no JavaScript required.
 */
export function SceneFallback({ className = '' }: { className?: string }) {
  const layers = Array.from({ length: 9 }, (_, i) => i);
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex items-center justify-center [perspective:1100px] ${className}`}
    >
      <div className="relative h-[70%] w-[70%] [transform-style:preserve-3d] [transform:rotateX(58deg)_rotateZ(-32deg)]">
        {layers.map((i) => (
          <div
            key={i}
            className="absolute inset-0 m-auto h-[48%] w-[62%] rounded-[14px] border bg-[color-mix(in_oklab,var(--three-ink)_6%,transparent)]"
            style={{
              borderColor: i === 5 ? 'var(--three-secondary)' : 'color-mix(in oklab, var(--three-primary) 45%, transparent)',
              transform: `translateZ(${(i - 4) * 26}px) rotateZ(${i * 11}deg)`,
            }}
          />
        ))}
      </div>
      <div className="absolute left-1/2 top-[12%] h-[76%] w-px -translate-x-1/2 bg-gradient-to-t from-transparent via-[var(--three-primary)] to-transparent opacity-70" />
      <div className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color-mix(in_oklab,var(--three-ink)_14%,transparent)] [transform:rotateX(70deg)]" />
    </div>
  );
}
