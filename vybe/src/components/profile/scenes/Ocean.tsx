import { CoverSvg, Layer, range } from './shared';

/** Beneath the surface: sun shafts, caustic shimmer, reef silhouettes and a distant whale. */
export function OceanScene() {
  return (
    <>
      <Layer depth={0.03} style={{ background: 'linear-gradient(180deg, #1aa6c7 0%, #0b6b94 18%, #0a3f68 45%, #04203d 72%, #020b18 100%)' }} />
      <Layer depth={0.06}>
        <div
          className="scene-anim scene-gradient-anim absolute inset-x-0 top-0 h-[22%] opacity-60"
          style={{ backgroundImage: 'radial-gradient(ellipse 60px 14px at 30% 40%, rgb(255 255 255 / 0.45), transparent), radial-gradient(ellipse 80px 12px at 70% 60%, rgb(255 255 255 / 0.35), transparent), radial-gradient(ellipse 50px 10px at 50% 20%, rgb(255 255 255 / 0.4), transparent)', backgroundSize: '220px 90px', filter: 'blur(2px)', maskImage: 'linear-gradient(180deg, #000, transparent)' }}
        />
      </Layer>
      <Layer depth={0.12}>
        {range(6).map((i) => (
          <div
            key={i}
            className="scene-anim scene-sway absolute top-[-8%] h-[95%]"
            style={{ left: `${12 + i * 14}%`, width: `${4 + (i % 3) * 3}%`, background: 'linear-gradient(180deg, rgb(200 250 255 / 0.32), rgb(160 230 255 / 0.06) 65%, transparent)', transform: `skewX(${-12 + i * 5}deg)`, filter: 'blur(10px)', animationDelay: `${-i * 2.3}s` }}
          />
        ))}
      </Layer>
      <Layer depth={0.2}>
        <div className="scene-anim scene-swim absolute top-[34%] w-[26vmin] opacity-25" style={{ filter: 'blur(1.5px)' }}>
          <svg viewBox="0 0 300 100" aria-hidden>
            <path d="M10 55 C60 20 160 18 230 40 C250 30 270 15 292 12 C282 32 280 48 292 70 C268 66 250 58 232 52 C170 78 70 82 10 55 Z M60 62 C70 80 90 88 100 80" fill="#9fe7ff" />
          </svg>
        </div>
      </Layer>
      <Layer depth={0.4}>
        <CoverSvg align="xMidYMax">
          <g fill="#021428">
            <path d="M0 900 L0 720 C40 690 60 640 90 650 C110 600 150 610 160 660 C200 630 230 680 250 700 C280 660 330 680 360 740 C400 720 430 760 460 800 L520 900 Z" />
            <path d="M1600 900 L1600 700 C1560 680 1540 630 1500 650 C1480 600 1440 610 1430 670 C1390 640 1360 690 1340 710 C1300 680 1260 700 1240 760 C1200 740 1170 780 1140 820 L1080 900 Z" />
          </g>
          <g stroke="#063052" strokeWidth="6" strokeLinecap="round" fill="none" opacity={0.9}>
            <path d="M120 720 C110 660 140 620 130 570" className="scene-anim scene-sway" />
            <path d="M1470 700 C1480 640 1450 600 1465 550" className="scene-anim scene-sway" style={{ animationDelay: '-5s' }} />
          </g>
        </CoverSvg>
      </Layer>
      <Layer depth={0} style={{ background: 'radial-gradient(ellipse at 50% 35%, transparent 35%, rgb(1 8 18 / 0.55) 100%)' }} />
    </>
  );
}
