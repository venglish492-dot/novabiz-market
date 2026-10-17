# Deployment

## Minimum production configuration

1. **Database** — set `DATABASE_URL` to PostgreSQL 14+ (Supabase, Neon, RDS…). Migrations run on
   first connection; to run them as a release step instead, set `VYBE_AUTO_MIGRATE=false` and run
   `npm run db:migrate`. The embedded PGlite mode suits a single long-running server only
   (one process may open its data directory).
2. **Secret** — `VYBE_SECRET` (long random string). It salts visitor hashes.
3. **Origin** — `NEXT_PUBLIC_SITE_URL=https://your-domain`. HTTPS enables secure cookies, HSTS and
   `upgrade-insecure-requests`.
4. **Storage** — on serverless or multi-instance hosting use `STORAGE_DRIVER=supabase` with a
   **private** bucket, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-only). Local disk
   storage needs a persistent volume at `VYBE_DATA_DIR`.
5. **Email** — `RESEND_API_KEY` and a verified `EMAIL_FROM` for password resets.
6. **Demo content** — set `VYBE_SEED_DEMO=false` if you don’t want the eight demo profiles.
7. **Admin** — `npm run admin:grant -- you@example.com` after signing up.

```bash
npm ci
npm run build
npm start            # or: next start -p $PORT
```

## Platform notes

- **Vercel / serverless**: use Postgres + Supabase Storage. Edge country headers
  (`x-vercel-ip-country`) are picked up automatically for coarse analytics. ffmpeg isn’t available,
  so uploaded videos won’t get server-side posters (they still play).
- **Docker / VM**: install `ffmpeg` for video posters and durations. Mount a volume for
  `VYBE_DATA_DIR` if you use local storage or PGlite.
- Behind a proxy, make sure `X-Forwarded-For` and `Host` are forwarded (rate limiting and origin
  checks rely on them).

## Before a public launch

- Have the privacy policy, terms and guidelines (`src/content/legal.ts`) reviewed by counsel.
- Decide on a support email (`src/config/brand.ts`) and moderation staffing.
- Optionally connect a malware scanner to the upload pipeline (`src/features/uploads/process.ts`
  is the hook point); none is configured.
- Generate the background loops described in `docs/higgsfield-asset-package.md` and fill
  `src/features/backgrounds/manifest.ts`.
- Rate limits are stored in Postgres; for very high traffic, move them to Redis behind the same
  interface (`src/lib/security/rate-limit.ts`).
