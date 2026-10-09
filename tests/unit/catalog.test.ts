import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../../src/data/products.ts';
import { CATEGORIES } from '../../src/data/categories.ts';
import { COLLECTIONS } from '../../src/data/collections.ts';
import { FORMATS } from '../../src/data/formats.ts';
import { GOALS } from '../../src/data/goals.ts';
import { applyFilters, productBadges, sortProducts, hasRatings, productsInCategory } from '../../src/lib/catalog/queries.ts';
import { parseCatalogParams, activeFilterCount } from '../../src/lib/catalog/params.ts';
import { searchProducts } from '../../src/lib/catalog/search.ts';

test('seed catalog is internally consistent', () => {
  const ids = new Set(PRODUCTS.map((p) => p.id));
  const slugs = new Set(PRODUCTS.map((p) => p.slug));
  assert.equal(ids.size, PRODUCTS.length, 'unique ids');
  assert.equal(slugs.size, PRODUCTS.length, 'unique slugs');
  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  for (const p of PRODUCTS) {
    assert.match(p.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(categoryIds.has(p.categoryId), `${p.slug} category`);
    p.secondaryCategoryIds.forEach((id) => assert.ok(categoryIds.has(id), `${p.slug} secondary ${id}`));
    p.formats.forEach((f) => assert.ok(f in FORMATS, `${p.slug} format ${f}`));
    p.goals.forEach((g) => assert.ok(GOALS.some((goal) => goal.id === g), `${p.slug} goal ${g}`));
    p.bundleProductIds.forEach((id) => assert.ok(ids.has(id), `${p.slug} bundle item`));
    assert.ok(p.price.amount > 0, `${p.slug} price`);
    assert.ok(p.title.ru && p.title.en, `${p.slug} bilingual title`);
  }
  for (const collection of COLLECTIONS) collection.productIds.forEach((id) => assert.ok(ids.has(id), `${collection.slug} item`));
  for (const category of CATEGORIES) if (category.parentId) assert.ok(categoryIds.has(category.parentId), category.id);
});

test('seed catalog carries no invented social proof or fake discounts', () => {
  for (const p of PRODUCTS) {
    assert.equal(p.rating, null, `${p.slug} must not ship a fabricated rating`);
    assert.equal(p.compareAtAmount, null, `${p.slug} must not ship a fake "was" price`);
    assert.equal(p.previewUrl, null, `${p.slug} must not link a placeholder preview`);
  }
  assert.equal(hasRatings(PRODUCTS), false);
});

test('badges come from real dates and configuration only', () => {
  const product = { ...PRODUCTS[0], isFeatured: false, publishedAt: '2026-01-01T00:00:00Z', lastUpdated: '2026-01-01' };
  assert.deepEqual(productBadges(product, new Date('2026-10-09')), []);
  assert.deepEqual(productBadges({ ...product, lastUpdated: '2026-10-01' }, new Date('2026-10-09')), ['updated']);
  assert.deepEqual(productBadges({ ...product, publishedAt: '2026-10-05T00:00:00Z', isFeatured: true }, new Date('2026-10-09')), ['new', 'featured']);
});

test('URL params are validated; junk is ignored', () => {
  const state = parseCatalogParams(
    { category: 'not-real', format: 'excel,evil,constructor,excel', goal: 'nope', license: 'root', sort: 'drop table', min: '-5', max: 'abc', q: 'x'.repeat(500) },
    CATEGORIES,
  );
  assert.equal(state.filters.category, undefined);
  assert.deepEqual(state.filters.formats, ['excel']);
  assert.equal(state.filters.goal, undefined);
  assert.equal(state.filters.license, undefined);
  assert.equal(state.sort, 'recommended');
  assert.equal(state.filters.minPrice, undefined);
  assert.equal(state.filters.maxPrice, undefined);
  assert.equal(state.query.length, 100);
  assert.equal(activeFilterCount(state.filters), 1);
});

test('category filter includes child categories', () => {
  const root = CATEGORIES.find((c) => !c.parentId && productsInCategory(PRODUCTS, CATEGORIES, c.id).length > 0)!;
  const filtered = applyFilters(PRODUCTS, CATEGORIES, { category: root.id });
  assert.ok(filtered.length > 0);
  assert.deepEqual(new Set(filtered.map((p) => p.id)), new Set(productsInCategory(PRODUCTS, CATEGORIES, root.id).map((p) => p.id)));
});

test('price filters and sorting behave', () => {
  const cheap = applyFilters(PRODUCTS, CATEGORIES, { maxPrice: 2000 });
  assert.ok(cheap.every((p) => p.price.amount <= 2000));
  const asc = sortProducts(PRODUCTS, 'price-asc').map((p) => p.price.amount);
  assert.deepEqual(asc, [...asc].sort((x, y) => x - y));
  const recommended = sortProducts(PRODUCTS, 'recommended');
  const firstNonFeatured = recommended.findIndex((p) => !p.isFeatured);
  assert.ok(recommended.slice(firstNonFeatured).every((p) => !p.isFeatured), 'featured first');
});

test('search tolerates typos, transliteration and both languages', () => {
  const slugs = (q: string) => searchProducts(PRODUCTS, CATEGORIES, q).map((p) => p.slug);
  assert.ok(slugs('финансовая модель').includes('saas-unit-economics-financial-model'));
  assert.ok(slugs('finacial model').includes('saas-unit-economics-financial-model'));
  assert.ok(slugs('ноушн').includes('startup-os-notion-workspace'));
  assert.ok(slugs('notion').includes('startup-os-notion-workspace'));
  assert.ok(slugs('pitch deck').includes('venture-pitch-deck-kit'));
  assert.ok(slugs('onbording').length > 0);
  assert.deepEqual(slugs('zzzzqqqq'), []);
});
