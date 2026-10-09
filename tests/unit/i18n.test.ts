import { test } from 'node:test';
import assert from 'node:assert/strict';
import ru from '../../src/i18n/dictionaries/ru.ts';
import en from '../../src/i18n/dictionaries/en.ts';
import { plural } from '../../src/i18n/plural.ts';
import { interpolate, pick } from '../../src/i18n/config.ts';

function shape(value: unknown, path = ''): string[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) => shape(child, path ? `${path}.${key}` : key));
  }
  return [path];
}

test('RU and EN dictionaries have identical keys and no empty strings', () => {
  assert.deepEqual(shape(en).sort(), shape(ru).sort());
  for (const [name, dict] of [['ru', ru], ['en', en]] as const) {
    const empties = shape(dict).filter((path) => path.split('.').reduce<unknown>((v, k) => (v as Record<string, unknown>)[k], dict) === '');
    assert.deepEqual(empties, [], name);
  }
});

test('Russian plural forms', () => {
  const forms = { one: '{count} товар', few: '{count} товара', many: '{count} товаров', other: '{count} товара' };
  assert.equal(plural(forms, 1, 'ru'), '1 товар');
  assert.equal(plural(forms, 3, 'ru'), '3 товара');
  assert.equal(plural(forms, 5, 'ru'), '5 товаров');
  assert.equal(plural(forms, 21, 'ru'), '21 товар');
  assert.equal(plural(forms, 11, 'ru'), '11 товаров');
});

test('pick falls back to another locale and interpolate fills placeholders', () => {
  assert.equal(pick({ ru: 'Привет' }, 'en'), 'Привет');
  assert.equal(interpolate('{a} + {b}', { a: 1, b: 'two' }), '1 + two');
});
