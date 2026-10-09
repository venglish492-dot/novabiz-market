import { FORMATS } from '@/data/formats';
import type { FormatId } from '@/types';

/** Typographic format label — no emoji, no third-party logos. */
export function FormatChip({ format, showLabel = false }: { format: FormatId; showLabel?: boolean }) {
  const definition = FORMATS[format];
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-1.5 text-[10.5px] text-fg-muted"
      title={definition.label}
    >
      <span className="t-mono font-medium tracking-wider text-fg">{definition.mark}</span>
      {showLabel && <span className="pr-0.5">{definition.label}</span>}
      {!showLabel && <span className="sr-only">{definition.label}</span>}
    </span>
  );
}

export function FormatList({ formats, max = 4, showLabel = false }: { formats: FormatId[]; max?: number; showLabel?: boolean }) {
  const shown = formats.slice(0, max);
  const rest = formats.length - shown.length;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {shown.map((format) => (
        <FormatChip key={format} format={format} showLabel={showLabel} />
      ))}
      {rest > 0 && <span className="text-[11px] text-fg-subtle">+{rest}</span>}
    </span>
  );
}
