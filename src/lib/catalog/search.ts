import type { Category, Product } from '../../types/index.ts';
import { FORMATS } from '../../data/formats.ts';
import { GOALS } from '../../data/goals.ts';

/*
 * Lightweight, typo-tolerant catalog search. Bilingual: every product is
 * indexed with both its Russian and English text, so a query in either
 * language finds it. Pure functions — usable on the server and in tests.
 */

const STOP_WORDS = new Set([
  'и', 'в', 'на', 'для', 'с', 'по', 'от', 'до', 'из', 'или', 'а', 'the', 'a', 'an', 'and', 'for', 'of', 'to', 'in', 'with', 'or',
]);

/** Query expansions for common spellings, abbreviations and transliterations. */
const SYNONYMS: Record<string, string[]> = {
  финмодель: ['финансовая', 'модель', 'financial', 'model'],
  финмодели: ['финансовая', 'модель', 'financial', 'model'],
  эксель: ['excel'],
  ексель: ['excel'],
  xlsx: ['excel'],
  xls: ['excel'],
  таблица: ['spreadsheet', 'excel', 'sheets'],
  таблицы: ['spreadsheet', 'excel', 'sheets'],
  ноушн: ['notion'],
  ноушен: ['notion'],
  нотион: ['notion'],
  пптх: ['powerpoint'],
  pptx: ['powerpoint'],
  ppt: ['powerpoint'],
  презентация: ['presentation', 'deck', 'slides'],
  презентации: ['presentation', 'deck', 'slides'],
  питч: ['pitch'],
  дек: ['deck'],
  питчдек: ['pitch', 'deck'],
  pitchdeck: ['pitch', 'deck'],
  срм: ['crm'],
  црм: ['crm'],
  вб: ['wildberries'],
  wb: ['wildberries'],
  озон: ['ozon'],
  hr: ['hiring', 'onboarding'],
  найм: ['hiring'],
  pm: ['product'],
  продакт: ['product'],
};

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, (match) => (match === '̆' ? match : ''))
    .normalize('NFC')
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}+#/.\s-]/gu, ' ')
    .replace(/[/.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/** Damerau–Levenshtein distance with an early exit above `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) d[i][0] = i;
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    let rowMin = Number.POSITIVE_INFINITY;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[rows - 1][cols - 1];
}

interface IndexedField {
  weight: number;
  tokens: string[];
}

export interface IndexedProduct {
  product: Product;
  fields: IndexedField[];
}

function textTokens(values: Array<string | undefined | null>): string[] {
  return values.flatMap((value) => (value ? tokenize(value) : []));
}

export function buildSearchIndex(products: Product[], categories: Category[]): IndexedProduct[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  return products.map((product) => {
    const categoryNames = [product.categoryId, ...product.secondaryCategoryIds]
      .map((id) => categoryById.get(id))
      .flatMap((c) => {
        if (!c) return [];
        const parent = c.parentId ? categoryById.get(c.parentId) : undefined;
        return [c.name.ru, c.name.en, parent?.name.ru, parent?.name.en];
      });
    const goalTitles = product.goals.flatMap((id) => {
      const goal = GOALS.find((g) => g.id === id);
      return goal ? [goal.title.ru, goal.title.en] : [];
    });
    return {
      product,
      fields: [
        { weight: 10, tokens: textTokens([product.title.ru, product.title.en]) },
        { weight: 6, tokens: textTokens(product.tags) },
        { weight: 5, tokens: textTokens([product.subtitle.ru, product.subtitle.en]) },
        { weight: 4, tokens: textTokens(categoryNames) },
        { weight: 4, tokens: textTokens(product.formats.flatMap((f) => [FORMATS[f].label, FORMATS[f].mark])) },
        { weight: 3, tokens: textTokens([...product.software, ...product.technologies, ...goalTitles]) },
        { weight: 2, tokens: textTokens([product.shortDescription.ru, product.shortDescription.en]) },
        {
          weight: 1.5,
          tokens: textTokens([
            ...product.useCases.ru,
            ...product.useCases.en,
            ...product.audience.ru,
            ...product.audience.en,
            ...product.features.ru,
            ...product.features.en,
          ]),
        },
        { weight: 1, tokens: textTokens([product.description.ru, product.description.en, ...product.includedItems.ru, ...product.includedItems.en]) },
      ],
    };
  });
}

function tokenMatchScore(queryToken: string, fieldToken: string): number {
  if (fieldToken === queryToken) return 1;
  if (queryToken.length >= 2 && fieldToken.startsWith(queryToken)) return 0.8;
  if (queryToken.length >= 4 && fieldToken.includes(queryToken)) return 0.5;
  if (queryToken.length >= 4) {
    const allowed = queryToken.length >= 8 ? 2 : 1;
    // Compare against the same-length prefix too, so "finan" ~ "financial".
    const candidate = fieldToken.length > queryToken.length + allowed ? fieldToken.slice(0, queryToken.length) : fieldToken;
    if (editDistance(queryToken, candidate, allowed) <= allowed) return 0.45;
  }
  return 0;
}

function expandQuery(tokens: string[]): string[][] {
  // Each query token becomes a group of alternatives; a group matches if any alternative does.
  return tokens.map((token) => [token, ...(SYNONYMS[token] ?? [])]);
}

export interface SearchHit {
  product: Product;
  score: number;
}

export function searchIndex(index: IndexedProduct[], query: string): SearchHit[] {
  const groups = expandQuery(tokenize(query));
  if (!groups.length) return [];

  const hits: SearchHit[] = [];
  for (const entry of index) {
    let total = 0;
    let matchedAll = true;
    for (const alternatives of groups) {
      let best = 0;
      for (const field of entry.fields) {
        for (const fieldToken of field.tokens) {
          for (const alternative of alternatives) {
            const score = tokenMatchScore(alternative, fieldToken) * field.weight;
            if (score > best) best = score;
          }
        }
      }
      if (best === 0) {
        matchedAll = false;
        break;
      }
      total += best;
    }
    if (matchedAll) hits.push({ product: entry.product, score: total });
  }
  return hits.sort((a, b) => b.score - a.score || a.product.sortOrder - b.product.sortOrder);
}

export function searchProducts(products: Product[], categories: Category[], query: string): Product[] {
  return searchIndex(buildSearchIndex(products, categories), query).map((hit) => hit.product);
}
