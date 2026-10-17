import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sniff, safeFilename } from '../../src/features/uploads/sniff.ts';
import { youtubeId, spotifyPath, discordInviteCode, vimeoId } from '../../src/features/widgets/embeds.ts';

const bytes = (...parts: (string | number[])[]) => {
  const out: number[] = [];
  for (const p of parts) out.push(...(typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p));
  while (out.length < 16) out.push(0);
  return new Uint8Array(out);
};

test('file types come from magic bytes', () => {
  assert.equal(sniff(bytes([0x89], 'PNG', [0x0d, 0x0a, 0x1a, 0x0a]))?.mime, 'image/png');
  assert.equal(sniff(bytes([0xff, 0xd8, 0xff, 0xe0]))?.mime, 'image/jpeg');
  assert.equal(sniff(bytes('RIFF', [0, 0, 0, 0], 'WEBP'))?.mime, 'image/webp');
  assert.equal(sniff(bytes([0, 0, 0, 0x18], 'ftypisom'))?.kind, 'video');
  assert.equal(sniff(bytes([0, 0, 0, 0x18], 'ftypisom'), 'audio')?.kind, 'audio');
  assert.equal(sniff(bytes('OggS'))?.mime, 'audio/ogg');
  assert.equal(sniff(bytes('ID3'))?.mime, 'audio/mpeg');
  assert.equal(sniff(bytes('wOF2'))?.mime, 'font/woff2');
});

test('scriptable and unknown formats are rejected', () => {
  assert.equal(sniff(bytes('<svg xmlns="http://www.w3.org/2000/svg">')), null);
  assert.equal(sniff(bytes('<!DOCTYPE html><script>')), null);
  assert.equal(sniff(bytes('%PDF-1.7')), null);
  assert.equal(sniff(bytes('MZ')), null);
  assert.equal(sniff(new Uint8Array(4)), null);
});

test('filenames are sanitised', () => {
  assert.equal(safeFilename('../../etc/passwd', 'x'), 'passwd');
  assert.equal(safeFilename('C:\\Users\\me\\photo.png', 'x'), 'photo.png');
  assert.equal(safeFilename('<script>.png', 'x'), 'script.png');
  assert.equal(safeFilename('..', 'fallback'), 'fallback');
});

test('embed parsers accept official URLs only', () => {
  assert.equal(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://youtu.be/dQw4w9WgXcQ?t=3'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://evil.com/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(spotifyPath('https://open.spotify.com/intl-de/track/4uLU6hMCjMI75M1A2tKUQC'), 'track/4uLU6hMCjMI75M1A2tKUQC');
  assert.equal(spotifyPath('https://open.spotify.com.evil.com/track/4uLU6hMCjMI75M1A2tKUQC'), null);
  assert.equal(discordInviteCode('https://discord.gg/abc123'), 'abc123');
  assert.equal(discordInviteCode('https://discord.com/invite/abc123'), 'abc123');
  assert.equal(vimeoId('https://vimeo.com/123456789'), '123456789');
});
