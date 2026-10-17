'use client';

import { useEffect, type RefObject } from 'react';

/** Subtle 3D tilt toward the pointer. Writes CSS variables; no React state. */
export function useTilt(ref: RefObject<HTMLElement | null>, enabled: boolean, strength = 5) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || !window.matchMedia('(pointer: fine)').matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--tilt-x', `${(-y * strength).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${(x * strength).toFixed(2)}deg`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', reset);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', reset);
      cancelAnimationFrame(frame);
    };
  }, [ref, enabled, strength]);
}
