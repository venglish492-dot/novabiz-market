import { CoverSvg, Layer } from './shared';

const SHARDS = [
  'M0 900 L0 380 L120 250 L210 520 L260 900 Z',
  'M150 900 L230 430 L300 180 L380 470 L420 900 Z',
  'M330 900 L400 600 L470 520 L520 900 Z',
  'M1600 900 L1600 330 L1480 210 L1400 500 L1350 900 Z',
  'M1450 900 L1360 420 L1290 160 L1210 470 L1180 900 Z',
  'M1270 900 L1200 610 L1130 540 L1080 900 Z',
];
const VEINS = [
  'M120 250 L170 400 L210 520 L230 700',
  'M300 180 L330 330 L380 470 L400 700',
  'M1480 210 L1440 360 L1400 500 L1390 720',
  'M1290 160 L1260 320 L1210 470 L1200 690',
  'M470 520 L490 700',
  'M1130 540 L1110 720',
];

/** Black volcanic glass with slow violet light pulsing through its fractures. */
export function ObsidianScene() {
  return (
    <>
      <Layer depth={0.03} style={{ background: 'radial-gradient(ellipse at 50% 85%, #2a1145 0%, #0d0516 45%, #030104 100%)' }} />
      <Layer depth={0.1}>
        <div className="scene-anim scene-breathe absolute inset-x-[20%] top-[55%] h-[30%] rounded-full" style={{ background: 'radial-gradient(ellipse, rgb(160 80 255 / 0.35), transparent 70%)', filter: 'blur(30px)' }} />
      </Layer>
      <Layer depth={0.35}>
        <CoverSvg>
          <defs>
            <linearGradient id="ob-shard" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1d1229" />
              <stop offset="0.45" stopColor="#08040d" />
              <stop offset="1" stopColor="#020103" />
            </linearGradient>
            <filter id="ob-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          {SHARDS.map((d, i) => (
            <path key={i} d={d} fill="url(#ob-shard)" stroke="rgb(200 160 255 / 0.25)" strokeWidth="1.2" />
          ))}
          <g stroke="#b65cff" strokeWidth="5" fill="none" filter="url(#ob-glow)" opacity={0.7}>
            {VEINS.map((d, i) => (
              <path key={i} d={d} className="scene-anim scene-pulse-vein" style={{ animationDelay: `${-i * 1.3}s` }} />
            ))}
          </g>
          <g stroke="#e9d5ff" strokeWidth="1.4" fill="none" opacity={0.85}>
            {VEINS.map((d, i) => (
              <path key={i} d={d} className="scene-anim scene-pulse-vein" style={{ animationDelay: `${-i * 1.3}s` }} />
            ))}
          </g>
          <rect x="0" y="860" width="1600" height="40" fill="#020103" />
        </CoverSvg>
      </Layer>
      <Layer depth={0.55} style={{ background: 'linear-gradient(180deg, transparent 80%, rgb(182 92 255 / 0.08) 92%, transparent)' }} />
    </>
  );
}
