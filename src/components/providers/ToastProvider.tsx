'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Check, CircleAlert, X } from 'lucide-react';
import { useI18n } from '@/i18n/client';

interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
  action?: { label: string; href: string };
}

type ToastInput = Omit<Toast, 'id' | 'tone'> & { tone?: Toast['tone'] };

const ToastContext = createContext<(toast: ToastInput) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const show = useCallback(
    (input: ToastInput) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((list) => [...list.slice(-2), { id, tone: input.tone ?? 'success', message: input.message, action: input.action }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm animate-scale-in items-center gap-3 rounded-xl border border-line-strong bg-surface-2 py-3 pl-4 pr-2 text-sm text-fg shadow-lg"
          >
            {toast.tone === 'error' ? (
              <CircleAlert className="h-4 w-4 shrink-0 text-danger" aria-hidden />
            ) : (
              <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
            )}
            <span className="min-w-0 flex-1">{toast.message}</span>
            {toast.action && (
              <Link href={toast.action.href} className="shrink-0 rounded-md px-2 py-1 font-medium text-accent hover:bg-accent-soft">
                {toast.action.label}
              </Link>
            )}
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-md p-1.5 text-fg-subtle hover:bg-surface-3 hover:text-fg"
              aria-label={t.toast.dismiss}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
