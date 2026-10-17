'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Types, pauses, deletes and rotates through strings. Screen readers get the
 * full text once via aria-label; the animated characters are hidden from them.
 */
export function Typewriter({ strings, typeSpeed, deleteSpeed, pause, loop, cursor, animate }: { strings: string[]; typeSpeed: number; deleteSpeed: number; pause: number; loop: boolean; cursor: boolean; animate: boolean }) {
  const key = strings.join('\u0000');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by content, not array identity
  const list = useMemo(() => strings.filter((s) => s.trim()), [key]);
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!animate || !list.length) return;
    const current = list[index % list.length];
    let timeout: number;
    if (!deleting && text === current) {
      const last = index === list.length - 1;
      if (last && !loop) return; // finished: leave the final line on screen
      timeout = window.setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text === '') {
      timeout = window.setTimeout(() => {
        setDeleting(false);
        setIndex((i) => (i + 1) % list.length);
      }, 250);
    } else {
      timeout = window.setTimeout(
        () => setText(deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1)),
        deleting ? deleteSpeed : typeSpeed + (Math.random() * typeSpeed) / 3,
      );
    }
    return () => window.clearTimeout(timeout);
  }, [animate, list, index, text, deleting, typeSpeed, deleteSpeed, pause, loop]);

  if (!list.length) return null;
  const full = list.join(' · ');
  if (!animate) return <span>{list[0]}</span>;
  return (
    <span aria-label={full} role="text">
      <span aria-hidden>{text}</span>
      {cursor && (
        <span aria-hidden className="ml-0.5 inline-block w-[0.5ch] animate-[p-breathe_1s_steps(1)_infinite] text-[var(--p-accent)]">
          |
        </span>
      )}
    </span>
  );
}
