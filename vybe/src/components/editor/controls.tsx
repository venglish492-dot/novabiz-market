'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, GripVertical, RotateCcw, Trash2 } from 'lucide-react';
import { BADGE_ICON_KEYS } from '@/features/badges/icons';
import { BadgeIcon } from '@/features/badges/BadgeIcon';
import { FONTS, FONT_CATEGORY_LABELS, fontFamily, type FontCategory } from '@/features/themes/fonts';

export function Section({ title, description, onReset, children, id }: { title: string; description?: string; onReset?: () => void; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="card scroll-mt-24 p-5 sm:p-6" aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id={id ? `${id}-title` : undefined} className="font-display text-base font-semibold">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {onReset && (
          <button type="button" onClick={onReset} className="btn btn-ghost btn-sm shrink-0 !min-h-8 text-xs" title="Reset this section to defaults">
            <RotateCcw className="size-3.5" aria-hidden /> Reset
          </button>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid gap-5 ${cols === 3 ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2'}`}>{children}</div>;
}

export function Slider({ label, value, min, max, step = 1, onChange, format, hint }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string; hint?: string }) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-xs tabular-nums text-muted">
          {format ? format(value) : value}
        </output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" style={{ '--fill': `${pct}%` } as React.CSSProperties} />
      {hint && <p className="hint mt-0.5">{hint}</p>}
    </div>
  );
}

export const pct = (v: number) => `${Math.round(v * 100)}%`;
export const px = (v: number) => `${v}px`;

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);
  const shown = focused ? text : value;
  const valid = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(shown);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input type="color" value={value.slice(0, 7)} onChange={(e) => onChange(e.target.value)} className="size-10 shrink-0" aria-label={`${label} colour picker`} />
        <input
          id={id}
          value={shown}
          onFocus={() => {
            setText(value);
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setText(e.target.value);
            if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(e.target.value)) onChange(e.target.value.toLowerCase());
          }}
          className="input !min-h-10 font-mono text-sm"
          aria-invalid={!valid}
          spellCheck={false}
          maxLength={9}
        />
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {description && <p className="hint mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-white/15'}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={id}>
      <p id={id} className="mb-1.5 text-sm font-medium">
        {label}
      </p>
      <div className="flex flex-wrap gap-1 rounded-2xl border border-line bg-white/[0.03] p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`min-h-9 flex-1 rounded-xl px-3 text-sm font-medium transition-colors ${value === option.value ? 'bg-primary/25 text-text shadow-[inset_0_0_0_1px_rgb(182_92_255/0.5)]' : 'text-muted hover:text-text'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SelectField<T extends string>({ label, value, options, onChange, hint }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (v: T) => void; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="input">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="hint mt-1">{hint}</p>}
    </div>
  );
}

export function TextField({ label, value, onChange, max, placeholder, error, hint, multiline, type = 'text', mono, onBlur }: { label: string; value: string; onChange: (v: string) => void; max?: number; placeholder?: string; error?: string; hint?: string; multiline?: boolean; type?: string; mono?: boolean; onBlur?: () => void }) {
  const id = useId();
  const common = {
    id,
    value,
    placeholder,
    maxLength: max,
    onBlur,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
    className: `input ${mono ? 'font-mono text-sm' : ''}`,
  };
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {max && <span className={`font-mono text-[11px] tabular-nums ${value.length > max * 0.9 ? 'text-warning' : 'text-faint'}`}>{`${value.length}/${max}`}</span>}
      </div>
      {multiline ? <textarea {...common} onChange={(e) => onChange(e.target.value)} rows={3} /> : <input {...common} type={type} onChange={(e) => onChange(e.target.value)} />}
      {error ? (
        <p id={`${id}-error`} className="field-error mt-1" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="hint mt-1">{hint}</p>
      )}
    </div>
  );
}

const CATEGORY_ORDER: FontCategory[] = ['sans', 'serif', 'mono', 'display', 'gothic', 'pixel', 'script'];

export function FontSelect({ label, value, onChange, hasCustom }: { label: string; value: string; onChange: (v: string) => void; hasCustom: boolean }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input" style={{ fontFamily: fontFamily(value) }}>
        {CATEGORY_ORDER.map((category) => (
          <optgroup key={category} label={FONT_CATEGORY_LABELS[category]}>
            {FONTS.filter((f) => f.category === category).map((font) => (
              <option key={font.key} value={font.key}>
                {font.label}
              </option>
            ))}
          </optgroup>
        ))}
        <optgroup label="Uploaded">
          <option value="custom" disabled={!hasCustom}>
            {hasCustom ? 'My uploaded font' : 'My uploaded font (upload one below)'}
          </option>
        </optgroup>
      </select>
      <p className="mt-1.5 truncate text-lg" style={{ fontFamily: fontFamily(value) }} aria-hidden>
        The quick brown fox — 0123
      </p>
    </div>
  );
}

export function IconPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={id}>
      <p id={id} className="mb-1.5 text-sm font-medium">
        {label}
      </p>
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
        {BADGE_ICON_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            aria-label={key}
            title={key}
            onClick={() => onChange(key)}
            className={`flex aspect-square items-center justify-center rounded-lg border transition-colors ${value === key ? 'border-primary bg-primary/20 text-text' : 'border-transparent text-muted hover:bg-white/5 hover:text-text'}`}
          >
            <BadgeIcon name={key} size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Reorderable list: drag handles for pointer users plus Move up / Move down
 * buttons that work with keyboards and screen readers.
 */
export function SortableList<T extends { id: string }>({ items, onChange, render, label, onRemove }: { items: T[]; onChange: (items: T[]) => void; render: (item: T, index: number) => ReactNode; label: (item: T) => string; onRemove: (item: T) => void }) {
  const [dragging, setDragging] = useState<string | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => {
            setDragging(item.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={() => setDragging(null)}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragging || dragging === item.id) return;
            const from = items.findIndex((i) => i.id === dragging);
            move(from, index);
          }}
          className={`rounded-2xl border bg-white/[0.025] p-4 transition-opacity ${dragging === item.id ? 'border-primary/60 opacity-60' : 'border-line'}`}
        >
          <div className="mb-3 flex items-center gap-2">
            <GripVertical className="size-4 shrink-0 cursor-grab text-faint" aria-hidden />
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{label(item)}</p>
            <button type="button" className="btn btn-ghost btn-icon !size-8 !min-h-8" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={`Move ${label(item)} up`}>
              <ChevronUp className="size-4" />
            </button>
            <button type="button" className="btn btn-ghost btn-icon !size-8 !min-h-8" onClick={() => move(index, index + 1)} disabled={index === items.length - 1} aria-label={`Move ${label(item)} down`}>
              <ChevronDown className="size-4" />
            </button>
            <button type="button" className="btn btn-ghost btn-icon !size-8 !min-h-8 hover:!text-rose-300" onClick={() => onRemove(item)} aria-label={`Remove ${label(item)}`}>
              <Trash2 className="size-4" />
            </button>
          </div>
          {render(item, index)}
        </li>
      ))}
    </ul>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</p>;
}
