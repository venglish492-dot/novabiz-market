'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/providers/CommerceProvider';

/** Re-fetches the server-rendered order status while payment confirmation is pending. */
export function AutoRefresh({ intervalMs = 3000, maxAttempts = 40 }: { intervalMs?: number; maxAttempts?: number }) {
  const router = useRouter();
  const attempts = useRef(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      attempts.current += 1;
      if (attempts.current > maxAttempts) {
        window.clearInterval(timer);
        return;
      }
      router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [router, intervalMs, maxAttempts]);
  return null;
}

/**
 * After a verified payment: remove purchased items from the local cart and
 * play a short, subtle celebration (skipped with reduced motion).
 */
export function PaidEffects({ productIds }: { productIds: string[] }) {
  const cart = useCart();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !cart.hydrated) return;
    done.current = true;
    productIds.forEach((id) => {
      if (cart.has(id)) cart.remove(id);
    });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    void import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 70,
        spread: 70,
        startVelocity: 32,
        origin: { y: 0.35 },
        colors: ['#8b9cff', '#62d6e8', '#eef0f5'],
        disableForReducedMotion: true,
      });
    });
  }, [cart, productIds]);

  return null;
}
