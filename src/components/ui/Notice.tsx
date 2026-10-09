import type { ReactNode } from 'react';
import { CircleAlert, Info, CircleCheck, TriangleAlert } from 'lucide-react';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const styles: Record<Tone, { box: string; icon: ReactNode }> = {
  info: { box: 'border-line-strong bg-surface-2', icon: <Info className="h-4 w-4 text-accent" aria-hidden /> },
  success: { box: 'border-success/30 bg-success-soft', icon: <CircleCheck className="h-4 w-4 text-success" aria-hidden /> },
  warning: { box: 'border-warning/30 bg-warning-soft', icon: <TriangleAlert className="h-4 w-4 text-warning" aria-hidden /> },
  danger: { box: 'border-danger/30 bg-danger-soft', icon: <CircleAlert className="h-4 w-4 text-danger" aria-hidden /> },
};

export function Notice({
  tone = 'info',
  title,
  children,
  action,
  role,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  role?: 'status' | 'alert';
}) {
  const style = styles[tone];
  return (
    <div role={role} className={`flex gap-3 rounded-xl border p-4 text-sm ${style.box}`}>
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-fg">{title}</p>}
        {children && <div className={`leading-relaxed text-fg-muted ${title ? 'mt-1' : ''}`}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
