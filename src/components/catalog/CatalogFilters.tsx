'use client';

import { useId, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { pick, type LocalizedText } from '@/i18n/config';
import { FORMATS } from '@/data/formats';
import { LICENSES } from '@/data/licenses';
import { GOALS } from '@/data/goals';
import type { FormatId, GoalId, LicenseTier } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useCatalogNav } from './CatalogShell';

export interface FacetData {
  categories: Array<{ id: string; name: LocalizedText; count: number }>;
  formats: Array<{ id: FormatId; count: number }>;
  software: Array<{ name: string; count: number }>;
  goals: Array<{ id: GoalId; count: number }>;
  licenses: Array<{ id: LicenseTier; count: number }>;
  currency: string | null;
}

export interface FilterState {
  category?: string;
  formats?: FormatId[];
  software?: string;
  goal?: GoalId;
  license?: LicenseTier;
  minPrice?: number;
  maxPrice?: number;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="border-b border-line py-5 first:pt-0 last:border-b-0">
      <p id={id} className="t-eyebrow mb-3">
        {title}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function Option({
  type,
  name,
  checked,
  onChange,
  label,
  count,
}: {
  type: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg has-[:checked]:text-fg">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-[var(--accent)]"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === 'number' && <span className="text-xs tabular-nums text-fg-subtle">{count}</span>}
    </label>
  );
}

function FilterControls({ facets, state, hideCategory }: { facets: FacetData; state: FilterState; hideCategory?: boolean }) {
  const { t, locale } = useI18n();
  const { update } = useCatalogNav();
  const [min, setMin] = useState(state.minPrice?.toString() ?? '');
  const [max, setMax] = useState(state.maxPrice?.toString() ?? '');

  const toggleFormat = (format: FormatId) => {
    const current = new Set(state.formats ?? []);
    if (current.has(format)) current.delete(format);
    else current.add(format);
    update({ format: [...current] });
  };

  return (
    <div>
      {!hideCategory && facets.categories.length > 0 && (
        <Group title={t.catalog.category}>
          <Option type="radio" name="category" checked={!state.category} onChange={() => update({ category: null })} label={t.catalog.allCategories} />
          {facets.categories.map((category) => (
            <Option
              key={category.id}
              type="radio"
              name="category"
              checked={state.category === category.id}
              onChange={() => update({ category: category.id })}
              label={pick(category.name, locale)}
              count={category.count}
            />
          ))}
        </Group>
      )}

      {facets.formats.length > 0 && (
        <Group title={t.catalog.format}>
          {facets.formats.map((format) => (
            <Option
              key={format.id}
              type="checkbox"
              name="format"
              checked={Boolean(state.formats?.includes(format.id))}
              onChange={() => toggleFormat(format.id)}
              label={FORMATS[format.id].label}
              count={format.count}
            />
          ))}
        </Group>
      )}

      {facets.goals.length > 0 && (
        <Group title={t.catalog.goal}>
          <Option type="radio" name="goal" checked={!state.goal} onChange={() => update({ goal: null })} label={t.catalog.any} />
          {facets.goals.map((goal) => {
            const definition = GOALS.find((g) => g.id === goal.id);
            return (
              <Option
                key={goal.id}
                type="radio"
                name="goal"
                checked={state.goal === goal.id}
                onChange={() => update({ goal: goal.id })}
                label={definition ? pick(definition.title, locale) : goal.id}
                count={goal.count}
              />
            );
          })}
        </Group>
      )}

      {facets.software.length > 1 && (
        <Group title={t.catalog.software}>
          <Option type="radio" name="software" checked={!state.software} onChange={() => update({ software: null })} label={t.catalog.any} />
          {facets.software.map((software) => (
            <Option
              key={software.name}
              type="radio"
              name="software"
              checked={state.software === software.name}
              onChange={() => update({ software: software.name })}
              label={software.name}
              count={software.count}
            />
          ))}
        </Group>
      )}

      {facets.licenses.length > 1 && (
        <Group title={t.catalog.license}>
          <Option type="radio" name="license" checked={!state.license} onChange={() => update({ license: null })} label={t.catalog.any} />
          {facets.licenses.map((license) => (
            <Option
              key={license.id}
              type="radio"
              name="license"
              checked={state.license === license.id}
              onChange={() => update({ license: license.id })}
              label={pick(LICENSES[license.id].name, locale)}
              count={license.count}
            />
          ))}
        </Group>
      )}

      <Group title={facets.currency ? `${t.catalog.price}, ${facets.currency}` : t.catalog.price}>
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            update({ min: min.trim() || null, max: max.trim() || null });
          }}
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-fg-subtle">
            {t.catalog.minPrice}
            <input
              inputMode="numeric"
              value={min}
              onChange={(event) => setMin(event.target.value.replace(/[^\d]/g, ''))}
              className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-sm text-fg outline-none focus:border-accent"
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-fg-subtle">
            {t.catalog.maxPrice}
            <input
              inputMode="numeric"
              value={max}
              onChange={(event) => setMax(event.target.value.replace(/[^\d]/g, ''))}
              className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-sm text-fg outline-none focus:border-accent"
            />
          </label>
          <Button type="submit" variant="secondary" size="sm" className="!h-9 !rounded-lg">
            OK
          </Button>
        </form>
      </Group>
    </div>
  );
}

export function CatalogFilters({
  facets,
  state,
  activeCount,
  hideCategory = false,
}: {
  facets: FacetData;
  state: FilterState;
  activeCount: number;
  hideCategory?: boolean;
}) {
  const { t } = useI18n();
  const { reset, params } = useCatalogNav();
  const [open, setOpen] = useState(false);
  // Remount controls when the URL changes so local inputs reflect the new state.
  const stateKey = params.toString();

  return (
    <>
      <div className="hidden lg:block">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-medium text-fg">{t.catalog.filters}</p>
          {activeCount > 0 && (
            <button type="button" onClick={() => reset()} className="text-xs text-fg-subtle underline-offset-4 hover:text-fg hover:underline">
              {t.catalog.clearFilters}
            </button>
          )}
        </div>
        <FilterControls key={stateKey} facets={facets} state={state} hideCategory={hideCategory} />
      </div>

      <div className="lg:hidden">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)} aria-expanded={open}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {t.catalog.filters}
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] text-primary-fg">{activeCount}</span>
          )}
        </Button>
        <Dialog open={open} onClose={() => setOpen(false)} label={t.catalog.filters} variant="sheet-right">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
            <p className="text-base font-semibold text-fg">{t.catalog.filters}</p>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label={t.common.close}>
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <FilterControls key={stateKey} facets={facets} state={state} hideCategory={hideCategory} />
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            <Button variant="secondary" onClick={() => reset()}>
              {t.catalog.clearFilters}
            </Button>
            <Button onClick={() => setOpen(false)}>{t.catalog.showResults}</Button>
          </div>
        </Dialog>
      </div>
    </>
  );
}

export function SortSelect({ value, showRating }: { value: string; showRating: boolean }) {
  const { t } = useI18n();
  const { update } = useCatalogNav();
  return (
    <label className="flex items-center gap-2 text-sm text-fg-muted">
      <span className="hidden sm:inline">{t.catalog.sort}</span>
      <select
        value={value}
        onChange={(event) => update({ sort: event.target.value === 'recommended' ? null : event.target.value })}
        className="h-9 rounded-full border border-line bg-surface px-3 pr-8 text-sm text-fg outline-none focus:border-accent"
      >
        <option value="recommended">{t.catalog.sortRecommended}</option>
        <option value="newest">{t.catalog.sortNewest}</option>
        <option value="price-asc">{t.catalog.sortPriceAsc}</option>
        <option value="price-desc">{t.catalog.sortPriceDesc}</option>
        {showRating && <option value="rating">{t.catalog.sortRating}</option>}
      </select>
    </label>
  );
}
