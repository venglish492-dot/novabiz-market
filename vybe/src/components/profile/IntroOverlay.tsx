'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { safeLocalStorage } from '@/lib/client/hooks';

/**
 * Two intro styles:
 *  - cinematic: a ~2s fade from black with the name resolving; skippable, and
 *    shown once per profile per visitor (remembered in localStorage).
 *  - enter: a "click to enter" gate. The click is a real user gesture, so it
 *    may start music when the creator enabled "play on enter".
 */
export function IntroOverlay({ mode, text, name, profileId, motion, onEnter }: { mode: 'cinematic' | 'enter'; text: string; name: string; profileId: string; motion: boolean; onEnter: () => void }) {
  const key = `vybe:intro:${profileId}`;
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Whether this visitor already saw the cinematic intro (false during SSR).
  const seen = useSyncExternalStore(noopSubscribe, () => Boolean(safeLocalStorage()?.getItem(key)), () => false);
  const skip = mode === 'cinematic' && (seen || !motion);
  const visible = !dismissed && !skip;

  useEffect(() => {
    if (mode !== 'cinematic' || skip) return;
    const t = window.setTimeout(() => dismiss(), 2300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  function dismiss() {
    if (mode === 'cinematic') {
      try {
        safeLocalStorage()?.setItem(key, '1');
      } catch {}
    }
    setLeaving(true);
    window.setTimeout(() => setDismissed(true), motion ? 700 : 0);
  }

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || (mode === 'enter' && (event.key === 'Enter' || event.key === ' '))) {
        event.preventDefault();
        if (mode === 'enter') onEnter();
        dismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  if (mode === 'enter') {
    return (
      <button
        type="button"
        autoFocus
        onClick={() => {
          onEnter();
          dismiss();
        }}
        className={`absolute inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80 backdrop-blur-xl transition-opacity duration-700 ${leaving ? 'opacity-0' : 'opacity-100'}`}
        aria-label={`${text} — open ${name}'s profile`}
      >
        <span className="font-mono text-sm uppercase tracking-[0.3em] text-white/85 [animation:p-intro-text_1.2s_ease-out_both]">{text}</span>
      </button>
    );
  }

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-700 ${leaving ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-white/50 [animation:p-fade_1s_0.2s_ease-out_both]">entering</p>
        <p className="mt-3 text-2xl font-semibold text-white [animation:p-intro-text_1.4s_0.3s_ease-out_both]">{name}</p>
      </div>
      <button type="button" onClick={dismiss} className="absolute bottom-6 right-6 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/75 hover:text-white">
        Skip intro
      </button>
    </div>
  );
}

const noopSubscribe = () => () => {};
