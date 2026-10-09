import type { Category, FormatId, GoalId, LicenseTier } from '../../types/index.ts';
import { FORMATS } from '../../data/formats.ts';
import { GOALS } from '../../data/goals.ts';
import { SORT_KEYS, type CatalogFilters, type SortKey } from './queries.ts';

/** Untrusted URL search params → validated catalog state. Unknown values are ignored. */
export type RawParams = Record<string, string | string[] | undefined>;

export interface CatalogState {
  query: string;
  filters: CatalogFilters;
  sort: SortKey;
}

const LICENSE_TIERS: LicenseTier[] = ['personal', 'commercial', 'team', 'extended'];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function all(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : value.split(',')).map((v) => v.trim()).filter(Boolean);
}

function price(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseCatalogParams(params: RawParams, categories: Category[]): CatalogState {
  const category = first(params.category);
  const goal = first(params.goal);
  const license = first(params.license);
  const sort = first(params.sort);
  const formats = all(params.format).filter((f): f is FormatId => Object.hasOwn(FORMATS, f));

  return {
    query: (first(params.q) ?? '').slice(0, 100),
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : 'recommended',
    filters: {
      category: category && categories.some((c) => c.id === category || c.slug === category) ? category : undefined,
      formats: formats.length ? [...new Set(formats)] : undefined,
      software: first(params.software)?.slice(0, 60) || undefined,
      goal: GOALS.some((g) => g.id === goal) ? (goal as GoalId) : undefined,
      license: LICENSE_TIERS.includes(license as LicenseTier) ? (license as LicenseTier) : undefined,
      minPrice: price(first(params.min)),
      maxPrice: price(first(params.max)),
    },
  };
}

export function activeFilterCount(filters: CatalogFilters): number {
  return (
    (filters.category ? 1 : 0) +
    (filters.formats?.length ?? 0) +
    (filters.software ? 1 : 0) +
    (filters.goal ? 1 : 0) +
    (filters.license ? 1 : 0) +
    (filters.minPrice !== undefined ? 1 : 0) +
    (filters.maxPrice !== undefined ? 1 : 0)
  );
}
