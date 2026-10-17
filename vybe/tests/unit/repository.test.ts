/**
 * Persistence tests against a real (embedded) Postgres: drafts round-trip,
 * publishing hides private files and hidden items, and child rows can't be
 * hijacked across profiles.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { openDatabase, type Database } from '../../src/lib/db/core.ts';
import { publishProfile, readDocument, writeDocument } from '../../src/features/profiles/repository.ts';
import { validateDocument, type ProfileDocument } from '../../src/features/profiles/document.ts';

let db: Database;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vybe-test-'));

// Embedded PGlite by default; set TEST_DATABASE_URL to run against a real Postgres.
const url = process.env.TEST_DATABASE_URL ?? '';
const run = randomUUID().slice(0, 8);

before(async () => {
  db = await openDatabase({ url, dataDir: dir });
});
after(async () => {
  await db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

async function makeProfile(base: string) {
  const name = `${base}-${run}`;
  const [user] = await db.query<{ id: string }>(`insert into users (email, password_hash) values ($1, 'x') returning id`, [`${name}@example.com`]);
  const [profile] = await db.query<{ id: string }>('insert into profiles (user_id, username) values ($1, $2) returning id', [user.id, name]);
  return { userId: user.id, profileId: profile.id };
}

async function asset(userId: string, visibility: string) {
  const id = randomUUID();
  await db.query(
    `insert into assets (id, user_id, kind, mime, ext, size_bytes, filename, storage_key, visibility, sha256) values ($1, $2, 'image', 'image/webp', 'webp', 10, 'a.webp', $3, $4, 'x')`,
    [id, userId, `${userId}/${id}.webp`, visibility],
  );
  return id;
}

function doc(input: Record<string, unknown>): ProfileDocument {
  const result = validateDocument({ profile: {}, theme: {}, seo: {}, links: [], tabs: [], widgets: [], badges: [], tracks: [], ...input });
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.doc;
}

test('migrations are idempotent', async () => {
  const again = await openDatabase({ url, dataDir: path.join(dir, 'second') });
  const rows = await again.query('select name from schema_migrations');
  assert.ok(rows.length >= 1);
  await again.close();
});

test('draft documents round-trip, including order', async () => {
  const { profileId } = await makeProfile('roundtrip');
  const links = ['https://a.example', 'https://b.example', 'https://c.example'].map((url) => ({ id: randomUUID(), platform: 'website', url }));
  const input = doc({ profile: { displayName: 'Round Trip' }, links, theme: { layout: 'bento' } });
  await db.tx((q) => writeDocument(q, profileId, input));
  const read = await readDocument(db, profileId);
  assert.equal(read?.doc.profile.displayName, 'Round Trip');
  assert.equal(read?.doc.theme.layout, 'bento');
  assert.deepEqual(read?.doc.links.map((l) => l.url), ['https://a.example/', 'https://b.example/', 'https://c.example/']);

  // Reorder + delete
  const reordered = doc({ links: [links[2], links[0]] });
  await db.tx((q) => writeDocument(q, profileId, reordered));
  const after = await readDocument(db, profileId);
  assert.deepEqual(after?.doc.links.map((l) => l.id), [links[2].id, links[0].id]);
});

test('publishing excludes private assets and hidden items', async () => {
  const { userId, profileId } = await makeProfile('publisher');
  const publicAvatar = await asset(userId, 'unlisted');
  const privateBanner = await asset(userId, 'private');
  const input = doc({
    profile: { avatarAssetId: publicAvatar, bannerAssetId: privateBanner },
    links: [
      { id: randomUUID(), platform: 'website', url: 'https://shown.example', visible: true },
      { id: randomUUID(), platform: 'website', url: 'https://hidden.example', visible: false },
    ],
  });
  await db.tx((q) => writeDocument(q, profileId, input));
  const snapshot = await publishProfile(db, profileId);
  assert.ok(snapshot);
  assert.ok(snapshot!.assets[publicAvatar]);
  assert.equal(snapshot!.assets[privateBanner], undefined);
  assert.equal(snapshot!.doc.links.length, 1);
  const json = JSON.stringify(snapshot);
  assert.ok(!json.includes('storage_key') && !json.includes(`${userId}/`), 'no storage keys in public data');
  assert.ok(!json.includes('@example.com'), 'no email in public data');
});

test('another user’s assets are never resolved into a snapshot', async () => {
  const a = await makeProfile('owner-a');
  const b = await makeProfile('owner-b');
  const foreign = await asset(a.userId, 'public');
  await db.tx((q) => writeDocument(q, b.profileId, doc({ profile: { avatarAssetId: foreign } })));
  const snapshot = await publishProfile(db, b.profileId);
  assert.equal(snapshot!.assets[foreign], undefined);
});

test('child rows cannot be taken over by reusing ids across profiles', async () => {
  const a = await makeProfile('victim');
  const b = await makeProfile('attacker');
  const id = randomUUID();
  await db.tx((q) => writeDocument(q, a.profileId, doc({ links: [{ id, platform: 'website', url: 'https://victim.example' }] })));
  await db.tx((q) => writeDocument(q, b.profileId, doc({ links: [{ id, platform: 'website', url: 'https://attacker.example' }] })));
  const victim = await readDocument(db, a.profileId);
  assert.equal(victim?.doc.links[0].url, 'https://victim.example/');
  const attacker = await readDocument(db, b.profileId);
  assert.equal(attacker?.doc.links.length, 0);
});

test('usernames are unique case-insensitively', async () => {
  await makeProfile('unique');
  const [other] = await db.query<{ id: string }>(`insert into users (email, password_hash) values ($1, 'x') returning id`, [`other-${run}@example.com`]);
  // Same name, different case, different user: must hit the lower(username) unique index.
  await assert.rejects(() => db.query('insert into profiles (user_id, username) values ($1, $2)', [other.id, `UNIQUE-${run}`]), /unique|duplicate/i);
});
