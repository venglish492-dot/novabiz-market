import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  body,
  action,
  className = '',
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center ${className}`}>
      {icon && (
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface-2 text-fg-muted">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold tracking-tight text-fg">{title}</h2>
      {body && <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
