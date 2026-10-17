# VYBE

**Your identity. Your atmosphere. Your entire digital world — in one link.**

VYBE is a cinematic link-in-bio platform. Creators claim `/@username`, pick one of eight
layouts and eight animated scenes, tune every visual detail in a live editor, add links,
widgets, music and media, publish, and watch privacy-friendly analytics. **Every feature is
free** — there is no premium tier, no locked control and no checkout.

> VYBE lives in this `vybe/` directory as a self-contained Next.js app. The repository root
> still contains the earlier *Vektor Lab* marketplace, untouched.

## Quick start

Requires Node.js 22.6+.

```bash
cd vybe
npm install
npm run dev            # http://localhost:3100
```

No configuration is needed: an embedded PostgreSQL (PGlite) database is created in `.data/`,
migrations run automatically, and eight clearly-labelled demo profiles are seeded
(`/@nova`, `/@kairo`, `/@selene`, `/@mira`, `/@atlas`, `/@echo`, `/@byte`, `/@marina` — one per layout).
Uploaded files are stored in `.data/uploads/`.

Open the site with `http://localhost:3100` (not `127.0.0.1`: Next.js blocks dev-only
resources for other origins unless `allowedDevOrigins` is set).

Create an account at `/signup`. To use the moderation page, make yourself an admin:

```bash
npm run admin:grant -- you@example.com
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop (port 3100), build, serve |
| `npm run lint` · `npm run typecheck` | ESLint · `tsc --noEmit` |
| `npm test` | Unit + persistence tests (`node:test`; uses an embedded Postgres, or `TEST_DATABASE_URL`) |
| `npm run test:e2e` | Builds, starts on :3200 with a fresh database, runs the Playwright suite |
| `npm run db:migrate` | Apply pending migrations (`DATABASE_URL` or embedded DB) |
| `npm run db:seed` | Create the demo profiles (idempotent) |
| `npm run admin:grant -- <email>` | Give an existing account the admin role |
| `npm run icons:generate` | Regenerate the brand-icon subset from `simple-icons` |

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions), **React 19**, **TypeScript** (strict)
- **Tailwind CSS 4** with design tokens (`src/app/globals.css`), brand values in `src/config/brand.ts`
- **Motion** for UI transitions (tabs, counters), CSS for lightweight animation,
  **three.js** (loaded on demand) for the particle-universe scene, Canvas 2D for rain/particles/cursor effects
- **PostgreSQL** via `pg` (any provider) or **PGlite** (embedded) — one SQL dialect, migrations in `db/migrations`
- Own session auth (scrypt hashes, HTTP-only cookies, hashed session tokens) — no third-party auth required
- **zod** for every input, **sharp** for image processing, optional **ffmpeg** for video posters
- Storage adapters: local disk or Supabase Storage (private bucket)
- Tests: `node:test` (unit + database), **Playwright** (end-to-end)

## Where things are

```
db/migrations/           SQL schema (users, sessions, profiles, links, widgets, tabs, badges,
                         audio_tracks, assets, aliases, presets, analytics, reports, rate limits…)
db/seed-assets/          original demo artwork (SVG) and synthesised demo music (OGG)
src/app/(site)/          marketing pages: home, pricing, compare, discover, leaderboard, media, help…
src/app/(auth)/          login, signup, forgot/reset password
src/app/dashboard/       the creator studio (16 sections)
src/app/u/[username]/    public profiles (served at /@username)
src/app/api/             uploads, file serving (Range support), analytics beacon, username check
src/app/actions/         server actions (auth, profile, media, reports, moderation)
src/components/profile/  the renderer: ProfileView, 8 layouts, 8 scenes, widgets, audio, effects
src/components/editor/   editor state (autosave/undo/publish), shell, controls, sections
src/features/            domain logic: themes, profiles, uploads, analytics, socials, widgets, badges
src/lib/                 db, auth, security, storage, env, logger
docs/                    research audit, architecture, deployment, Higgsfield asset package, test results
```

See [`docs/architecture.md`](docs/architecture.md) for how the pieces fit together.

## Environment

Everything is optional locally. See [`.env.example`](.env.example) for descriptions.
For production you must at least set `VYBE_SECRET`, `NEXT_PUBLIC_SITE_URL` and (recommended)
`DATABASE_URL`. Details in [`docs/deployment.md`](docs/deployment.md).

## Honest status

| Area | State |
| --- | --- |
| Accounts, profiles, editor, publishing, uploads, analytics, discovery, moderation | Working end to end (verified by the e2e suite) |
| Database | Verified on embedded PGlite and on PostgreSQL 16 |
| Supabase Storage adapter | Implemented against the documented REST API; **not exercised** in this environment (no credentials) |
| Password-reset email | Sends through Resend when configured; in development the link is shown on screen; in production without Resend the form says email isn’t configured |
| Background video footage | **Not generated** — Higgsfield was connected but refused generation on the account’s plan. Scenes are procedural; prompts and empty asset slots are ready (`docs/higgsfield-asset-package.md`) |
| OAuth sign-in, live Discord/Spotify presence | Not implemented (would need provider credentials). No placeholder buttons are shown |
| Legal pages | Plain-language drafts that match the software’s behaviour; need legal review before launch |
| guns.lol research | The site was unreachable from this environment; the audit is built from search snippets and the supplied screenshots, with sources marked (`docs/research-audit.md`) |
