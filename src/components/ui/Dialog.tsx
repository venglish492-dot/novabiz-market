'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

type Variant = 'center' | 'sheet-right' | 'sheet-top' | 'palette';

const panelStyles: Record<Variant, string> = {
  center:
    'relative mx-auto my-4 w-[calc(100%-2rem)] max-w-3xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-line-strong bg-surface shadow-lg animate-scale-in sm:my-10 sm:max-h-[calc(100dvh-5rem)]',
  'sheet-right':
    'ml-auto flex h-dvh w-full max-w-[440px] flex-col border-l border-line-strong bg-surface shadow-lg animate-slide-in-right',
  'sheet-top':
    'flex max-h-dvh w-full flex-col overflow-y-auto border-b border-line-strong bg-surface shadow-lg animate-fade-in',
  palette:
    'relative mx-auto mt-[10vh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-lg animate-scale-in',
};

/**
 * Accessible modal built on the native <dialog> element: the rest of the page
 * becomes inert (focus trap), Escape closes it, clicking the backdrop closes
 * it, body scroll is locked and focus returns to the trigger on close.
 */
export function Dialog({
  open,
  onClose,
  label,
  labelledBy,
  variant = 'center',
  className = '',
  children,
}: {
  open: boolean;
  onClose: () => void;
  label?: string;
  labelledBy?: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const fallbackId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      if (scrollbar > 0) document.documentElement.style.paddingRight = `${scrollbar}px`;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClosed = () => {
      document.documentElement.style.overflow = '';
      document.documentElement.style.paddingRight = '';
      returnFocus.current?.focus?.({ preventScroll: true });
    };
    dialog.addEventListener('close', onClosed);
    return () => {
      dialog.removeEventListener('close', onClosed);
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      id={fallbackId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-fg backdrop:bg-overlay backdrop:backdrop-blur-sm open:flex open:flex-col"
    >
      {open && (
        <div
          className={`${panelStyles[variant]} ${className}`}
          onClick={(event) => {
            // Clicks inside the panel never count as backdrop clicks.
            event.stopPropagation();
          }}
        >
          {children}
        </div>
      )}
    </dialog>
  );
}
