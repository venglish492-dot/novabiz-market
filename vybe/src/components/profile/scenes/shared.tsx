import type { CSSProperties, ReactNode } from 'react';

export type SceneProps = { animate: boolean };

/** A parallax layer: `depth` 0 (fixed) … 1 (moves most with the pointer). */
export function Layer({ depth, children, className = '', style }: { depth: number; children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`scene-layer ${className}`} style={{ '--depth': depth, ...style } as CSSProperties} aria-hidden>
      {children}
    </div>
  );
}

/** Full-bleed SVG that covers its layer like `background-size: cover`. */
export function CoverSvg({ children, viewBox = '0 0 1600 900', align = 'xMidYMid' }: { children: ReactNode; viewBox?: string; align?: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox={viewBox} preserveAspectRatio={`${align} slice`} aria-hidden>
      {children}
    </svg>
  );
}

/** A jagged, tiered pine silhouette. */
export function pinePath(x: number, baseY: number, height: number, width: number, tiers = 6): string {
  const top = baseY - height;
  const parts = [`M${x - width * 0.04} ${baseY} L${x - width * 0.04} ${baseY - height * 0.12} L${x + width * 0.04} ${baseY - height * 0.12} L${x + width * 0.04} ${baseY} Z`];
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers;
    const tierTop = top + height * t0 * 0.82;
    const tierBottom = top + height * (0.22 + t0 * 0.72);
    const half = (width / 2) * (0.25 + 0.75 * ((i + 1) / tiers));
    parts.push(
      `M${x} ${tierTop} L${x - half * 0.55} ${(tierTop + tierBottom) / 2} L${x - half * 0.42} ${(tierTop + tierBottom) / 2} L${x - half} ${tierBottom} L${x + half} ${tierBottom} L${x + half * 0.42} ${(tierTop + tierBottom) / 2} L${x + half * 0.55} ${(tierTop + tierBottom) / 2} Z`,
    );
  }
  return parts.join(' ');
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}
