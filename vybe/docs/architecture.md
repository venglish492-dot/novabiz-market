# Architecture

## Request flow

```
Browser ──► Next.js (App Router)
             ├─ Server Components  ── read via services ──► src/lib/db (pg | PGlite)
             ├─ Server Actions     ── auth → validate (zod) → services → db
             ├─ Route handlers     ── uploads, files (Range), analytics beacon, username, OG images
             └─ Client components  ── editor state, renderer, effects (canvas / three.js)
```

The database is never exposed to browsers. Every read and write goes through server code that
derives the user from the session cookie; there are no client-supplied user or profile ids in
mutations. Because of that, Postgres row-level security isn’t used — authorization lives in the
service layer and is covered by tests (`tests/unit/repository.test.ts`, `tests/e2e/security.spec.ts`).

## Data model (db/migrations/0001_init.sql)

- `users`, `sessions` (sha256 of the cookie token), `password_resets`, `user_preferences`
- `profiles` — one per user: identity fields, `theme` (jsonb), `seo` (jsonb), visibility,
  `revision` (optimistic concurrency), `published_snapshot` (jsonb), counters and moderation flags
- Relational children: `links` (socials + custom buttons), `tabs`, `widgets` (typed `config`
  jsonb), `badges`, `audio_tracks`
- `assets` (uploads; `storage_key` is internal), `profile_aliases`, `theme_presets`
- `analytics_events`, `view_dedup` (two-day visitor hashes), `reports`, `contact_messages`, `rate_limits`

## Draft and publish

The editor writes the **draft** into the relational tables (autosave, ~0.9 s debounce,
validated on the client and again on the server, `revision` check to detect edits from another
tab). **Publish** freezes a public view into `profiles.published_snapshot`: hidden links,
widgets and badges are dropped, and asset ids are resolved to URLs **only** for the owner’s
non-private files. The public page reads that one row, so a profile view is a single indexed
lookup, and drafts or private files can never leak.

## Theme engine

`src/features/themes/schema.ts` defines every visual setting. Each field has its own fallback
and clamp, so `parseTheme()` never throws: missing, out-of-range or malicious values become
defaults. Colours must be hex, fonts and effects come from allow-lists, and asset references must
be UUIDs. That is what lets `theme-vars.ts` turn a theme into CSS custom properties safely.
`THEME_VERSION` + `migrateTheme()` handle future shape changes.

## Renderer

`ProfileView` renders the public page, the editor preview and the homepage showcase, so creators
see exactly what visitors get. Layouts use **container queries**, which makes the editor’s
phone/tablet/desktop previews faithful without iframes.

Background stack (bottom → top): scene (procedural SVG/CSS, three.js for particles, or generated
footage from the manifest) or image/video/gradient/solid → tint → darkening → fog → canvas rain
and particles → vignette → grain. Pointer parallax and card tilt write CSS variables directly
(no React re-renders); canvases cap the device pixel ratio, scale particle counts by area, and
pause off-screen or in background tabs. `prefers-reduced-motion` and the creator’s “animate” toggle
switch everything to still frames.

Audio uses one `AudioStore` per profile (external store + `useSyncExternalStore`), so progress
updates re-render only the progress bar. Playback starts only from user gestures.

## Uploads

`POST /api/uploads` → same-origin check → session → rate limit → size limits → magic-byte type
detection (client MIME ignored, SVG/HTML/PDF rejected) → images re-encoded to WebP with sharp
(EXIF/GPS stripped, pixel-bomb limits) → optional ffprobe/ffmpeg metadata and poster → storage
adapter with random keys → `assets` row. `GET /api/files/[id]` enforces visibility, supports
HTTP Range, and responds with `nosniff`, a sandboxing CSP and a safe `Content-Disposition`.

## Analytics

`navigator.sendBeacon` → `/api/track` (always 204). Bots and the owner are skipped. A view counts
once per visitor per profile per UTC day using `sha256(secret, day, ip, user-agent, profile)`,
stored for two days. Events keep only device class, referrer host and an edge-provided country
code (none if the visitor sends GPC/DNT). Clicks are accepted only for link/widget ids present in
the published snapshot. Dashboard numbers come from SQL over these events.

## Security summary

Hashed passwords (scrypt), hashed session tokens, HTTP-only `SameSite=Lax` cookies, Server Action
origin checks plus a manual origin check on route handlers, database-backed rate limits (login,
sign-up, reset, uploads, saves, reports, contact, username checks), strict CSP with allow-listed
embed frames, URL allow-list (`https`, `http`, `mailto`), no user HTML anywhere, click-to-load
third-party embeds, private-file isolation, account deletion that removes stored files.
