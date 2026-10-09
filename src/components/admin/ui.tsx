import type { ReactNode } from 'react';

export function AdminPage({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-fg-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-fg-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-fg">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}

export function Table({ children, minWidth = 720 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="relative overflow-x-auto rounded-2xl border border-line">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th scope="col" className={`bg-surface px-4 py-3 text-xs font-medium text-fg-subtle ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`border-t border-line px-4 py-3 align-top ${className}`}>{children}</td>;
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="border-t border-line px-4 py-10 text-center text-sm text-fg-subtle">
        {label}
      </td>
    </tr>
  );
}

export function Panel({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export const inputClass =
  'h-10 w-full rounded-lg border border-line-strong bg-surface-2 px-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-accent';
export const textareaClass =
  'w-full rounded-lg border border-line-strong bg-surface-2 px-3 py-2.5 text-sm leading-relaxed text-fg outline-none placeholder:text-fg-subtle focus:border-accent';
export const labelClass = 'flex flex-col gap-1.5 text-sm text-fg';
