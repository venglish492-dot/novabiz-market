import type { CSSProperties } from 'react';
import type { CategoryTone, ProductType } from '@/types';

/**
 * Structured, product-type-specific schematic shown when real preview images
 * are not available yet. It illustrates the *kind* of deliverable (sheet,
 * workspace, deck, document…) and is always labelled as a schematic — it never
 * pretends to be a screenshot.
 */

type Kind = 'sheet' | 'workspace' | 'slides' | 'document' | 'interface' | 'code' | 'modules';

function kindFor(type: ProductType): Kind {
  switch (type) {
    case 'spreadsheet':
      return 'sheet';
    case 'notion-template':
      return 'workspace';
    case 'presentation':
      return 'slides';
    case 'playbook':
    case 'guide':
    case 'prompt-pack':
      return 'document';
    case 'ui-kit':
    case 'design-system':
    case 'icons':
    case 'illustrations':
      return 'interface';
    case 'code':
    case 'workflow':
      return 'code';
    default:
      return 'modules';
  }
}

const line = 'rounded-full bg-[color-mix(in_oklab,var(--fg)_14%,transparent)]';
const faint = 'rounded-full bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]';
const toneFill = 'bg-[var(--tone)]';
const cellFill = 'bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]';
const toneSoft = 'bg-[color-mix(in_oklab,var(--tone)_22%,transparent)]';

function Sheet() {
  const bars = [38, 52, 46, 64, 58, 76, 70, 88];
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex h-5 items-center gap-1 border-b border-line px-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${faint}`} />
        ))}
      </div>
      <div className="grid flex-1 grid-cols-[1.4fr_1fr] gap-2 p-2">
        <div className="grid grid-cols-4 gap-[3px]" style={{ gridTemplateRows: 'repeat(10, minmax(0, 1fr))' }}>
          {Array.from({ length: 40 }, (_, i) => (
            <span key={i} className={`min-h-[5px] rounded-[2px] ${i < 4 ? toneSoft : i % 7 === 3 ? toneSoft : cellFill}`} />
          ))}
        </div>
        <div className="flex items-end gap-[3px] rounded-md border border-line p-1.5">
          {bars.map((h, i) => (
            <span key={i} className={`flex-1 rounded-t-[2px] ${i === bars.length - 1 ? toneFill : toneSoft}`} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="flex h-5 items-center gap-1.5 border-t border-line px-2">
        {[18, 14, 20, 12].map((w, i) => (
          <span key={i} className={`h-1.5 ${i === 0 ? toneFill : faint} rounded-full`} style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

function Workspace() {
  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex w-[28%] flex-col gap-1.5 border-r border-line p-2">
        <span className={`h-2 w-3/4 ${line}`} />
        {[70, 56, 64, 48, 60, 52].map((w, i) => (
          <span key={i} className={`h-1.5 ${i === 1 ? toneFill : faint}`} style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <span className={`h-2.5 w-1/2 ${line}`} />
        <span className={`h-1.5 w-3/4 ${faint}`} />
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          {[3, 2, 4].map((cards, col) => (
            <div key={col} className="flex flex-col gap-1 rounded-md border border-line p-1">
              <span className={`h-1.5 w-1/2 ${col === 0 ? toneFill : line}`} />
              {Array.from({ length: cards }, (_, i) => (
                <span key={i} className={`h-3 rounded-[3px] ${i === 0 && col === 1 ? toneSoft : faint}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slides() {
  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-lg border border-line bg-surface p-3">
        <div className="flex flex-col gap-1.5">
          <span className={`h-1.5 w-10 ${toneFill}`} />
          <span className={`h-3 w-3/5 ${line}`} />
          <span className={`h-3 w-2/5 ${line}`} />
        </div>
        <div className="flex items-end gap-1.5">
          {[30, 48, 40, 66, 84].map((h, i) => (
            <span key={i} className={`w-3 rounded-t-[2px] ${i === 4 ? toneFill : toneSoft}`} style={{ height: h * 0.4 }} />
          ))}
          <span className="ml-auto h-10 w-10 rounded-full border-[5px] border-[color-mix(in_oklab,var(--tone)_35%,transparent)] border-t-[var(--tone)]" />
        </div>
      </div>
      <div className="grid h-[22%] grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`rounded-md border ${i === 0 ? 'border-[var(--tone)]' : 'border-line'} bg-surface`} />
        ))}
      </div>
    </div>
  );
}

function DocumentPages() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-y-2 left-[16%] right-[6%] rotate-[4deg] rounded-lg border border-line bg-surface-2" />
      <div className="absolute inset-y-1 left-[10%] right-[12%] rotate-[1.5deg] rounded-lg border border-line bg-surface-2" />
      <div className="absolute inset-y-0 left-[4%] right-[18%] flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-3">
        <span className={`h-1.5 w-8 ${toneFill}`} />
        <span className={`h-2.5 w-2/3 ${line}`} />
        {[92, 86, 90, 70].map((w, i) => (
          <span key={i} className={`h-1.5 ${faint}`} style={{ width: `${w}%` }} />
        ))}
        <span className={`mt-1 h-2 w-1/2 ${line}`} />
        {[88, 80, 64].map((w, i) => (
          <span key={i} className={`h-1.5 ${faint}`} style={{ width: `${w}%` }} />
        ))}
        <div className={`mt-auto h-6 rounded-md ${toneSoft}`} />
      </div>
    </div>
  );
}

function Interface() {
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-1.5">
      <span className={`col-span-2 rounded-lg ${toneSoft}`} />
      <span className="rounded-lg border border-line bg-surface" />
      <span className="rounded-lg border border-line bg-surface" />
      <span className={`flex items-center justify-center rounded-lg ${toneFill}`}>
        <span className="h-1.5 w-1/2 rounded-full bg-[var(--bg)]/70" />
      </span>
      <span className="rounded-lg border border-line bg-surface" />
      <span className="col-span-3 rounded-lg border border-line bg-surface" />
    </div>
  );
}

function Code() {
  const rows: Array<[number, number, boolean]> = [
    [8, 30, false],
    [14, 46, true],
    [14, 38, false],
    [20, 52, false],
    [20, 28, true],
    [14, 34, false],
    [8, 18, false],
  ];
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex h-5 items-center gap-1 border-b border-line px-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${faint}`} />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        {rows.map(([indent, width, accent], i) => (
          <span key={i} className={`h-1.5 ${accent ? toneFill : faint}`} style={{ marginLeft: indent, width: `${width}%` }} />
        ))}
      </div>
    </div>
  );
}

function Modules() {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`rounded-lg border border-line ${i === 0 ? toneSoft : 'bg-surface'}`} />
      ))}
    </div>
  );
}

const visuals: Record<Kind, () => React.JSX.Element> = {
  sheet: Sheet,
  workspace: Workspace,
  slides: Slides,
  document: DocumentPages,
  interface: Interface,
  code: Code,
  modules: Modules,
};

export function ProductPreview({
  productType,
  tone,
  label,
  size = 'card',
  className = '',
}: {
  productType: ProductType;
  tone: CategoryTone;
  /** Accessible label + visible caption, e.g. "Product structure schematic". */
  label: string;
  size?: 'card' | 'hero';
  className?: string;
}) {
  const Visual = visuals[kindFor(productType)];
  const style = { '--tone': `var(--tone-${tone})` } as CSSProperties;
  return (
    <div
      role="img"
      aria-label={label}
      style={style}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-surface-2 ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 [background:radial-gradient(120%_80%_at_0%_0%,color-mix(in_oklab,var(--tone)_12%,transparent),transparent_60%)]"
      />
      <div aria-hidden className="hairline-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(80%_70%_at_50%_45%,black,transparent)]" />
      <div className={`relative ${size === 'hero' ? 'h-[68%] w-[72%]' : 'h-[64%] w-[72%]'} transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]`}>
        <Visual />
      </div>
      <span className="t-mono absolute bottom-2.5 left-3 text-[9.5px] uppercase tracking-[0.14em] text-fg-subtle">{label}</span>
    </div>
  );
}
