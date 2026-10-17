# Verification results

Run on 2026-10-17 in the build container (Node 22.22, Chromium 140 via Playwright, PostgreSQL 16).

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | 0 problems |
| Types | `npm run typecheck` | 0 errors |
| Production build | `npm run build` | Succeeds, no warnings; no database access at build time |
| Unit + persistence (embedded Postgres) | `npm test` | 34 / 34 passed |
| Persistence on PostgreSQL 16 | `TEST_DATABASE_URL=postgres://… node --test --experimental-strip-types tests/unit/repository.test.ts` | 6 / 6 passed |
| Migrations + demo seed on PostgreSQL 16 | `DATABASE_URL=… npm run db:seed` | 8 demo profiles created and published |
| End-to-end (production build, fresh DB) | `npm run test:e2e` | 23 / 23 passed |

## What the end-to-end suite covers

- Homepage claim → availability check → sign-up → dashboard
- Profile edits autosave; a `javascript:` link is refused and blocks saving; handles expand to URLs
- Layout switch, publish, reload persistence, public page shows saved data and correct link targets
- Public HTML never contains the creator’s email
- Duplicate (case-insensitive) usernames rejected; sign-out, wrong password (email kept), sign-in
- Widgets + tabs appear on the published page and tab switching works
- Upload of a real PNG succeeds; an HTML file renamed `.png` is rejected; private files 404 for others
- Anonymous dashboard/admin access redirects to sign-in; non-admins can’t open moderation
- Upload API rejects anonymous (401) and cross-site (403) requests
- Unknown files/profiles 404; path traversal attempts 404; served files have `nosniff` + sandbox CSP
- Security headers (CSP, frame-ancestors, X-Frame-Options) on pages
- Unique view counting: owner visits excluded, repeat visits by one visitor counted once
- All eight demo layouts render with no page errors; music never autoplays
- Reduced motion disables animation and the intro; the cinematic intro is skippable and remembered
- No horizontal overflow at 360, 390, 768, 1440 and 1920 px on key pages
- Canonical URL, Open Graph image, sitemap and robots rules

## Not tested here (needs external services or credentials)

- Supabase Storage adapter against a real project
- Password-reset email delivery through Resend (the reset flow itself works; links are shown on screen in development)
- Edge-provided country analytics (needs a host that sets a country header)
- Video poster generation without ffmpeg (falls back to no poster)
- Real-device testing on iOS/Android browsers (layouts were checked at phone widths in Chromium)
