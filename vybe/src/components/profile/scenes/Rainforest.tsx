import { useMemo } from 'react';
import { seeded } from '@/lib/client/hooks';
import { CoverSvg, Layer, pinePath, range } from './shared';

/** Nocturnal blue forest: three depths of pines, mist, moon shafts, glowing flowers. */
export function RainforestScene() {
  const art = useMemo(() => {
    const r = seeded(42);
    // Trees avoid the centre band so the profile card sits in open, misty space.
    const place = (count: number, minH: number, maxH: number, centreGap: number) =>
      range(count).map((i) => {
        let x = (i / (count - 1)) * 1700 - 50 + (r() - 0.5) * 60;
        const fromCentre = Math.abs(x - 800) / 800;
        const h = minH + r() * (maxH - minH);
        const shrink = fromCentre < centreGap ? 0.55 + fromCentre : 1;
        if (fromCentre < centreGap * 0.4) x += x < 800 ? -120 : 120;
        return { x, h: h * shrink, w: h * shrink * (0.32 + r() * 0.1) };
      });
    return {
      far: place(30, 240, 380, 0.25),
      mid: place(16, 380, 600, 0.38),
      near: [
        { x: -30, h: 1050, w: 430 },
        { x: 170, h: 880, w: 330 },
        { x: 1410, h: 920, w: 360 },
        { x: 1640, h: 1080, w: 450 },
      ],
      flowers: range(70).map(() => {
        const side = r() < 0.5 ? r() * 560 : 1040 + r() * 560;
        return { x: r() < 0.2 ? 560 + r() * 480 : side, y: 790 + r() * 105, s: 1.5 + r() * 3.5, d: r() * 4, hue: r() };
      }),
      lights: range(10).map(() => ({ x: 380 + r() * 840, y: 560 + r() * 60, s: 1 + r() * 2 })),
    };
  }, []);

  return (
    <>
      <Layer depth={0.04} style={{ background: 'linear-gradient(180deg, #01030a 0%, #061532 42%, #0b2552 62%, #071630 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 16%, rgb(170 205 255 / 0.35), transparent 22%), radial-gradient(ellipse at 50% 70%, rgb(80 140 255 / 0.18), transparent 55%)' }} />
        <div className="scene-anim scene-breathe absolute left-[66%] top-[8%] size-[16vmin] rounded-full" style={{ background: 'radial-gradient(circle, rgb(200 222 255 / 0.32), transparent 65%)' }} />
        <div className="absolute left-[calc(66%+5.5vmin)] top-[calc(8%+5.5vmin)] size-[5vmin] rounded-full" style={{ background: 'radial-gradient(circle at 40% 40%, #ffffff, #dbe8ff 60%, #b9cff5)', boxShadow: '0 0 30px 6px rgb(190 215 255 / 0.45)' }} />
      </Layer>

      {/* Moonlight shafts */}
      <Layer depth={0.08}>
        {range(3).map((i) => (
          <div
            key={i}
            className="scene-anim scene-sway absolute top-[-10%] h-[120%]"
            style={{
              left: `${48 + i * 9}%`,
              width: `${7 + i * 3}%`,
              background: 'linear-gradient(180deg, rgb(190 215 255 / 0.18), rgb(190 215 255 / 0.02) 70%, transparent)',
              transform: 'skewX(-18deg)',
              filter: 'blur(14px)',
              animationDelay: `${-i * 4}s`,
            }}
          />
        ))}
      </Layer>

      <Layer depth={0.12}>
        <CoverSvg>
          {art.lights.map((l, i) => (
            <circle key={i} cx={l.x} cy={l.y} r={l.s} fill="#ffd9a0" opacity={0.7} className="scene-anim scene-twinkle" style={{ animationDelay: `${-i * 0.7}s`, filter: 'blur(0.6px)' }} />
          ))}
          <g fill="#0e2349" opacity={0.9} style={{ filter: 'blur(1.2px)' }}>
            {art.far.map((t, i) => (
              <path key={i} d={pinePath(t.x, 700, t.h, t.w, 5)} />
            ))}
          </g>
        </CoverSvg>
      </Layer>

      <Layer depth={0.2}>
        <div className="scene-anim scene-fog slow" style={{ '--fog': 'rgb(120 160 235 / 0.22)' } as React.CSSProperties} />
      </Layer>

      <Layer depth={0.32}>
        <CoverSvg>
          <g fill="#0a1b3a">
            {art.mid.map((t, i) => (
              <path key={i} d={pinePath(t.x, 820, t.h, t.w, 7)} />
            ))}
          </g>
          <rect x="0" y="800" width="1600" height="100" fill="#06122a" />
        </CoverSvg>
      </Layer>

      <Layer depth={0.42}>
        <div className="scene-anim scene-fog" style={{ '--fog': 'rgb(130 170 250 / 0.2)' } as React.CSSProperties} />
      </Layer>

      <Layer depth={0.6}>
        <CoverSvg>
          <defs>
            <radialGradient id="rf-flower">
              <stop offset="0" stopColor="#e6fbff" />
              <stop offset="0.35" stopColor="#7fdcff" />
              <stop offset="1" stopColor="#3aa0ff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="rf-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#040d1f" stopOpacity="0" />
              <stop offset="0.4" stopColor="#030a18" />
              <stop offset="1" stopColor="#01040b" />
            </linearGradient>
          </defs>
          <rect x="0" y="760" width="1600" height="140" fill="url(#rf-ground)" />
          {art.flowers.map((f, i) => (
            <g key={i} className="scene-anim scene-twinkle" style={{ animationDelay: `${-f.d}s`, transformOrigin: `${f.x}px ${f.y}px`, transformBox: 'fill-box' }}>
              <circle cx={f.x} cy={f.y} r={f.s * 4} fill="url(#rf-flower)" opacity={0.55} />
              <circle cx={f.x} cy={f.y} r={f.s * 0.7} fill={f.hue > 0.7 ? '#b9f6ff' : '#e9fbff'} />
            </g>
          ))}
        </CoverSvg>
      </Layer>

      <Layer depth={0.85}>
        <CoverSvg>
          <g fill="#02060f">
            {art.near.map((t, i) => (
              <path key={i} d={pinePath(t.x, 930, t.h, t.w, 9)} />
            ))}
          </g>
        </CoverSvg>
      </Layer>
    </>
  );
}
