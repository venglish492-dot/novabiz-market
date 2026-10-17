import { useMemo } from 'react';
import { seeded } from '@/lib/client/hooks';
import { CoverSvg, Layer, range } from './shared';

/** Deep-space violet nebula: slow-turning gas clouds over two star depths. */
export function NebulaScene() {
  const stars = useMemo(() => {
    const r = seeded(7);
    return {
      far: range(260).map(() => ({ x: r() * 1600, y: r() * 900, s: 0.4 + r() * 0.9, o: 0.3 + r() * 0.6 })),
      near: range(45).map(() => ({ x: r() * 1600, y: r() * 900, s: 0.9 + r() * 1.6, d: r() * 5 })),
    };
  }, []);
  const clouds = [
    { x: '8%', y: '20%', w: '62vmax', c: 'rgb(150 60 255 / 0.75)' },
    { x: '58%', y: '8%', w: '55vmax', c: 'rgb(255 80 200 / 0.55)' },
    { x: '60%', y: '62%', w: '60vmax', c: 'rgb(80 90 255 / 0.6)' },
    { x: '-6%', y: '68%', w: '48vmax', c: 'rgb(200 70 255 / 0.58)' },
    { x: '35%', y: '40%', w: '30vmax', c: 'rgb(255 170 240 / 0.14)' },
  ];
  return (
    <>
      <Layer depth={0.03} style={{ background: 'radial-gradient(ellipse at 50% 50%, #170733 0%, #0a0318 55%, #04010a 100%)' }} />
      <Layer depth={0.08}>
        <CoverSvg>
          {stars.far.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#f3e8ff" opacity={s.o} />
          ))}
        </CoverSvg>
      </Layer>
      <Layer depth={0.18}>
        <div className="scene-anim scene-rotate absolute left-1/2 top-1/2 size-[170vmax] -translate-x-1/2 -translate-y-1/2" style={{ mixBlendMode: 'screen' }}>
          {clouds.map((c, i) => (
            <div key={i} className="absolute rounded-full" style={{ left: c.x, top: c.y, width: c.w, height: c.w, background: `radial-gradient(circle, ${c.c}, transparent 65%)`, filter: 'blur(40px)' }} />
          ))}
        </div>
        <div className="absolute right-[12%] top-[14%] h-[9vmin] w-[22vmin] rotate-[-24deg] rounded-full" style={{ background: 'radial-gradient(ellipse, rgb(255 240 255 / 0.85), rgb(220 160 255 / 0.35) 30%, transparent 70%)', filter: 'blur(3px)' }} />
      </Layer>
      <Layer depth={0.3}>
        <CoverSvg>
          {stars.near.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" className="scene-anim scene-twinkle" style={{ animationDelay: `${-s.d}s`, transformOrigin: `${s.x}px ${s.y}px` }} />
          ))}
        </CoverSvg>
      </Layer>
      <Layer depth={0} style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgb(4 1 10 / 0.6) 100%)' }} />
    </>
  );
}
