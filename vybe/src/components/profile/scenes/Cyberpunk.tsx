import { useMemo } from 'react';
import { seeded } from '@/lib/client/hooks';
import { CoverSvg, Layer, range } from './shared';

type Building = { x: number; w: number; h: number; windows: { x: number; y: number; c: string; f: boolean }[] };

function skyline(seed: number, count: number, minH: number, maxH: number, baseY: number, litChance: number, gap: number): Building[] {
  const r = seeded(seed);
  const out: Building[] = [];
  let x = -40;
  for (let i = 0; i < count && x < 1640; i++) {
    const w = 60 + r() * 110;
    const centre = Math.abs(x + w / 2 - 800) / 800;
    const h = (minH + r() * (maxH - minH)) * (centre < gap ? 0.5 + centre : 1);
    const windows: Building['windows'] = [];
    for (let wy = baseY - h + 14; wy < baseY - 10; wy += 14) {
      for (let wx = x + 8; wx < x + w - 8; wx += 12) {
        if (r() < litChance) windows.push({ x: wx, y: wy, c: r() < 0.7 ? '#ffd9a8' : r() < 0.5 ? '#ff4fb8' : '#4ff2ff', f: r() < 0.06 });
      }
    }
    out.push({ x, w, h, windows });
    x += w + 2 + r() * 10;
  }
  return out;
}

/** Neon city at night in the rain: three skyline depths, signs, haze and wet reflections. */
export function CyberpunkScene() {
  const art = useMemo(
    () => ({
      far: skyline(3, 40, 200, 420, 640, 0.05, 0.1),
      mid: skyline(9, 24, 300, 620, 700, 0.09, 0.3),
      signs: range(9).map((i) => {
        const r = seeded(100 + i);
        const left = i < 5;
        return { x: left ? 40 + r() * 360 : 1160 + r() * 380, y: 160 + r() * 420, w: 18 + r() * 26, h: 70 + r() * 140, c: r() < 0.5 ? '#ff2a9d' : '#00e5ff', d: r() * 6 };
      }),
    }),
    [],
  );
  return (
    <>
      <Layer depth={0.03} style={{ background: 'linear-gradient(180deg, #05010c 0%, #140527 45%, #3a0b44 66%, #1a0626 78%, #07020f 100%)' }}>
        <div className="absolute inset-x-0 top-[48%] h-[30%]" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgb(255 42 157 / 0.35), transparent 65%)', filter: 'blur(20px)' }} />
      </Layer>
      <Layer depth={0.12}>
        <CoverSvg>
          <g fill="#1a0b2e" opacity={0.95}>
            {art.far.map((b, i) => (
              <rect key={i} x={b.x} y={640 - b.h} width={b.w} height={b.h} />
            ))}
          </g>
          {art.far.flatMap((b) => b.windows.map((w, j) => <rect key={`${b.x}-${j}`} x={w.x} y={w.y} width="4" height="5" fill={w.c} opacity={0.55} />))}
        </CoverSvg>
      </Layer>
      <Layer depth={0.22}>
        <div className="scene-anim scene-fog slow" style={{ '--fog': 'rgb(255 70 180 / 0.22)' } as React.CSSProperties} />
      </Layer>
      <Layer depth={0.35}>
        <CoverSvg>
          <g fill="#0b0414">
            {art.mid.map((b, i) => (
              <rect key={i} x={b.x} y={700 - b.h} width={b.w} height={b.h} />
            ))}
          </g>
          {art.mid.flatMap((b) =>
            b.windows.map((w, j) => (
              <rect key={`${b.x}-${j}`} x={w.x} y={w.y} width="5" height="6" fill={w.c} opacity={0.8} className={w.f ? 'scene-anim scene-flicker' : undefined} />
            )),
          )}
          {art.signs.map((s, i) => (
            <g key={i} className="scene-anim scene-flicker" style={{ animationDelay: `${-s.d}s` }}>
              <rect x={s.x - 6} y={s.y - 6} width={s.w + 12} height={s.h + 12} fill={s.c} opacity={0.25} style={{ filter: 'blur(10px)' }} />
              <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="3" fill="none" stroke={s.c} strokeWidth="3" />
              {range(Math.floor(s.h / 22)).map((k) => (
                <rect key={k} x={s.x + 5} y={s.y + 8 + k * 22} width={s.w - 10} height="9" rx="2" fill={s.c} opacity={0.85} />
              ))}
            </g>
          ))}
        </CoverSvg>
      </Layer>
      {/* Wet street reflection */}
      <Layer depth={0.5}>
        <div className="absolute inset-x-0 bottom-0 h-[24%]" style={{ background: 'linear-gradient(180deg, #0b0414 0%, #12061f 30%, #05010a 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-[22%] opacity-70" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 22px, rgb(255 42 157 / 0.18) 22px 24px, transparent 24px 60px, rgb(0 229 255 / 0.14) 60px 61px, transparent 61px 90px)', filter: 'blur(3px)', maskImage: 'linear-gradient(180deg, #000, transparent)' }} />
      </Layer>
      <Layer depth={0.6}>
        <div className="scene-anim scene-fog" style={{ '--fog': 'rgb(0 200 255 / 0.12)' } as React.CSSProperties} />
      </Layer>
    </>
  );
}
