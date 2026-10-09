import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/*
 * Regression guard for the brand reset and the truthfulness rules: no legacy
 * brand names, demo promo codes, invented security/uptime claims or unknown
 * contact details may reappear in shipped source.
 */
const ROOTS = ['src', 'supabase', 'scripts'];
const BANNED: Array<[RegExp, string]> = [
  [/novabiz/i, 'legacy brand'],
  [/vectorlab|vector lab/i, 'misspelled brand'],
  [/START2025|BIZVIP|FREEDEMO/, 'demo promo code'],
  [/AES-?256|PCI[- ]?DSS|99\.9+ ?%/i, 'unverified security/uptime claim'],
  [/24\/7|круглосуточн/i, 'unsupported support-hours claim'],
  [/notion\.so\/[a-z0-9-]+/i, 'hard-coded Notion link'],
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(tsx?|sql|css|json|md)$/.test(name) ? [path] : [];
  });
}

test('no banned brand names or fabricated claims in source', () => {
  const offenders: string[] = [];
  for (const file of ROOTS.flatMap(files)) {
    const text = readFileSync(file, 'utf8');
    for (const [pattern, label] of BANNED) if (pattern.test(text)) offenders.push(`${file}: ${label}`);
  }
  assert.deepEqual(offenders, []);
});

test('only the known contact email and phone are used', () => {
  const emails = new Set<string>();
  const phones = new Set<string>();
  for (const file of ['src'].flatMap(files)) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/[a-z0-9._%+-]+@vektorlab\.[a-z]+/gi)) emails.add(match[0].toLowerCase());
    for (const match of text.matchAll(/\+998[\d\s-]{9,}/g)) phones.add(match[0].replace(/\D/g, ''));
  }
  assert.deepEqual([...emails].sort(), ['hello@vektorlab.uz']);
  assert.deepEqual([...phones], ['998886666155']);
});
