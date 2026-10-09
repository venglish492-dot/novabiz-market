import type { ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'outline';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-fg-muted',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  outline: 'border border-line-strong text-fg-muted',
};

export function Badge({ tone = 'neutral', className = '', children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
