import { Layer } from './shared';

/** A seamless charcoal backdrop under one soft spotlight. Intentionally quiet. */
export function StudioScene() {
  return (
    <>
      <Layer depth={0.02} style={{ background: 'linear-gradient(180deg, #121212 0%, #1b1a19 55%, #0e0e0e 100%)' }} />
      <Layer depth={0.05}>
        <div className="scene-anim scene-breathe absolute left-1/2 top-[-20%] h-[95%] w-[70%] -translate-x-1/2" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgb(255 248 236 / 0.2), rgb(255 248 236 / 0.06) 40%, transparent 70%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-[38%]" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgb(255 248 236 / 0.07), transparent 65%), linear-gradient(180deg, transparent, rgb(0 0 0 / 0.5))' }} />
      </Layer>
    </>
  );
}
