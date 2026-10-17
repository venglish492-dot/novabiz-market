import { CoverSvg, Layer } from './shared';

/** Blue-hour glaciers under aurora ribbons. Snow comes from the effects canvas. */
export function GlacierScene() {
  return (
    <>
      <Layer depth={0.03} style={{ background: 'linear-gradient(180deg, #06142a 0%, #0f2f57 45%, #4f7fa8 72%, #9cc4de 100%)' }} />
      <Layer depth={0.08}>
        <div className="scene-anim scene-aurora absolute left-[-10%] top-[6%] h-[22%] w-[120%]" style={{ background: 'linear-gradient(90deg, transparent, rgb(124 247 212 / 0.55), rgb(96 165 250 / 0.45), rgb(167 139 250 / 0.35), transparent)', borderRadius: '50%', filter: 'blur(28px)' }} />
        <div className="scene-anim scene-aurora absolute left-[-5%] top-[18%] h-[14%] w-[110%]" style={{ background: 'linear-gradient(90deg, transparent, rgb(167 243 208 / 0.4), rgb(125 211 252 / 0.35), transparent)', borderRadius: '50%', filter: 'blur(26px)', animationDelay: '-9s' }} />
      </Layer>
      <Layer depth={0.16}>
        <CoverSvg>
          <path d="M0 640 L180 470 L300 560 L460 400 L620 560 L800 470 L980 560 L1140 410 L1300 540 L1450 440 L1600 560 L1600 700 L0 700 Z" fill="#a9cde6" opacity={0.55} />
          <rect x="772" y="430" width="8" height="140" fill="#eaf7ff" opacity={0.85} />
          <circle cx="776" cy="425" r="10" fill="#ffffff" style={{ filter: 'blur(4px)' }} className="scene-anim scene-breathe" />
        </CoverSvg>
      </Layer>
      <Layer depth={0.3}>
        <CoverSvg>
          <defs>
            <linearGradient id="gl-ice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f2fbff" />
              <stop offset="1" stopColor="#7fb2d4" />
            </linearGradient>
            <linearGradient id="gl-shade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#5d8fb8" />
              <stop offset="1" stopColor="#9fd0ea" />
            </linearGradient>
          </defs>
          <path d="M0 900 L0 300 L120 200 L260 420 L330 360 L460 620 L520 900 Z" fill="url(#gl-ice)" />
          <path d="M120 200 L190 470 L120 900 L0 900 L0 300 Z" fill="url(#gl-shade)" opacity={0.7} />
          <path d="M1600 900 L1600 260 L1470 180 L1340 400 L1280 360 L1140 620 L1080 900 Z" fill="url(#gl-ice)" />
          <path d="M1470 180 L1420 460 L1500 900 L1600 900 L1600 260 Z" fill="url(#gl-shade)" opacity={0.7} />
        </CoverSvg>
      </Layer>
      <Layer depth={0.45}>
        <div className="absolute inset-x-0 bottom-0 h-[18%]" style={{ background: 'linear-gradient(180deg, rgb(200 230 250 / 0.75), rgb(120 170 210 / 0.9))' }} />
        <div className="absolute inset-x-[25%] bottom-[4%] h-[8%] rounded-full" style={{ background: 'radial-gradient(ellipse, rgb(255 255 255 / 0.45), transparent 70%)', filter: 'blur(10px)' }} />
      </Layer>
      <Layer depth={0} style={{ background: 'linear-gradient(180deg, rgb(4 14 30 / 0.35), transparent 40%, rgb(4 14 30 / 0.25))' }} />
    </>
  );
}
