# Vektor Lab

Marketplace of professional digital products — financial models, Notion workspaces, playbooks and
presentation kits — at **[vektorlab.uz](https://vektorlab.uz)**.

Contact: hello@vektorlab.uz · +998 88 666 61 55

---

## What is in this repository

| Area | State |
| --- | --- |
| Storefront (home, catalog, product pages, categories, collections, search, cart, wishlist, legal & content pages) | Works with no configuration (catalog-only mode) |
| RU / EN interface (UZ prepared), dark / light / neon themes, 3D hero with fallbacks | Works |
| Accounts (sign-up, sign-in, password reset), library, licenses, download history | Needs Supabase |
| Checkout, orders, server-side pricing and coupons, payment webhooks, fulfilment | Needs Supabase + Stripe (or the sandbox provider for testing) |
| Secure file delivery (private bucket, ownership check, 60 s signed URLs, limits, logging) | Needs Supabase + uploaded product files |
| Verified-purchase reviews with moderation | Needs Supabase |
| Admin CMS (products, files, images, orders, refunds, payments, customers, reviews, taxonomy, bundles, coupons, analytics, blog, settings, audit log) | Needs Supabase + a staff account |
| Order confirmation emails | Needs Resend |

Without any environment variables the site runs in **catalog-only mode**: everything public works,
and accounts / checkout show an honest "not available yet" state with the contact details. Nothing is
simulated: there are no demo orders, fake reviews, fake ratings, placeholder discounts or fake payment
success screens.

## Stack

- **Next.js 16** (App Router, Turbopack, `proxy.ts`), **React 19**, **TypeScript** (strict)
- **Tailwind CSS 4** design tokens (`src/app/globals.css`)
- **Supabase**: Auth, Postgres with Row Level Security, private Storage
- **Stripe Checkout** via REST (no SDK), behind a `PaymentProvider` interface
- **three.js** for the hero scene (loaded on demand, with reduced-motion, low-power and no-WebGL fallbacks)
- **zod** for server-side validation, **Resend** for transactional email
- Tests: `node:test` (unit), **Playwright** (end-to-end), SQL assertions (RLS)

## Getting started

Requires Node.js 22.6 or newer.

```bash
npm install
npm run dev          # http://localhost:3000 — catalog-only mode
```

To enable accounts and checkout, copy `.env.example` to `.env.local` and fill in the values described
below. Every variable is optional and documented in `.env.example`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build, serve |
| `npm run lint` · `npm run typecheck` | ESLint · `tsc --noEmit` |
| `npm test` | Unit tests (pricing & coupons, webhook signatures, redirects, search, i18n parity, brand/claims guard) |
| `npm run test:e2e` | Builds, starts and runs the Playwright suite against the production server |
| `npm run db:test` | Applies the schema to a **disposable** Postgres (`DATABASE_URL`) and runs the RLS / fulfilment tests |
| `npm run db:seed:generate` | Regenerates `supabase/seed.sql` from `src/data` |

## Project structure

```
src/
  app/
    (store)/              storefront; (auth), (account) and (content) route groups
    admin/                admin CMS (server-side role checks on every page and action)
    api/                  download, search, events, newsletter, webhooks/stripe
    auth/callback/        email confirmation, password recovery, OAuth
    og/products/[slug]/   Open Graph images
  components/             ui, layout, products, catalog, cart, checkout, account, admin, three, home
  content/                home, legal and page copy (RU/EN)
  data/                   seed catalog: products, categories, collections, formats, goals, licenses
  i18n/                   config, dictionaries (ru is the source of truth), server/client helpers
  lib/
    auth/                 roles, session guards, safe redirects
    catalog/              repository (static or Supabase), filtering, typo-tolerant search
    orders/               server-authoritative pricing, coupons, order service, fulfilment
    payments/             PaymentProvider interface, Stripe, dev sandbox, signature verification
    supabase/             server, browser, admin (service role, server-only) and proxy clients
    seo/ email/ validation/ config/ …
  proxy.ts                session refresh + redirect for /account, /library, /admin
supabase/
  migrations/             schema, RLS policies, functions, storage buckets
  seed.sql                catalog seed (generated)
  tests/                  RLS and fulfilment assertions for a local Postgres
tests/
  unit/                   node:test suites
  e2e/                    Playwright: storefront, security, responsive (320–1920 px)
  e2e/full/               full purchase lifecycle + Stripe webhook against a real backend
```

## Supabase setup

1. **Create a project** at [supabase.com](https://supabase.com) and copy the project URL, the
   publishable (anon) key and the secret (service-role) key into `.env.local`.
2. **Apply the schema** — either `supabase db push` with the Supabase CLI, or paste
   `supabase/migrations/20261009000000_vektor_lab_schema.sql` into the SQL editor. It creates all
   tables, RLS policies, the `fulfil_order` / `mark_order_refunded` functions and the storage buckets
   `product-media` (public) and `product-files` (**private**).
3. **Seed the catalog** by running `supabase/seed.sql` (8 products, categories, collections).
4. **Auth settings** (Authentication → URL configuration):
   - Site URL: `https://vektorlab.uz`
   - Redirect URLs: `https://vektorlab.uz/auth/callback` (add your preview / local URLs too)
5. **Email templates** (recommended, works across devices):
   - Confirm signup: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/library`
   - Reset password: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`

   The default `{{ .ConfirmationURL }}` templates also work (PKCE `code` flow) when the link is opened
   in the same browser. Configure custom SMTP — Supabase's built-in sender is heavily rate limited.
6. **First administrator.** Register normally on the site, then in the SQL editor:

   ```sql
   update public.profiles set role = 'super_admin' where email = 'hello@vektorlab.uz';
   ```

   Roles are `buyer`, `creator`, `editor`, `admin`, `super_admin`. Users cannot change their own role
   (a trigger and column privileges prevent it); `super_admin` can manage roles under Admin → Customers.
7. **Google sign-in** (optional): enable the provider in Supabase, then set
   `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`.

## Payments

Checkout is enabled only when a provider is configured. Prices, discounts and totals are always
computed on the server from the database; the browser only sends product IDs and a coupon code.
An order becomes `paid` only through a verified provider event, never from the success page.

**Stripe**

1. Set `STRIPE_SECRET_KEY`.
2. Add a webhook endpoint `https://vektorlab.uz/api/webhooks/stripe` with the events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`,
   and set its signing secret as `STRIPE_WEBHOOK_SECRET`.

Webhooks are verified (HMAC-SHA256, 5-minute tolerance), deduplicated by event ID, checked against the
order's amount and currency, and fulfilled atomically by `fulfil_order`. Refunds issued from the admin
or from Stripe revoke access.

> Stripe accepts merchants only in supported countries. If the selling entity is not eligible, add a
> local provider (for example Payme or Click) by implementing `PaymentProvider` in
> `src/lib/payments/` — order creation, webhooks and fulfilment are provider-agnostic.

**Sandbox (development only).** `PAYMENTS_SANDBOX_ENABLED=true` adds a "test payment" option. It is
ignored on the production deployment, marks orders `is_test`, and test orders are excluded from
revenue.

## Product files

Upload deliverables in **Admin → Products → (product) → Files**. Files go straight from the browser to
the private bucket through a one-time signed upload URL. Buyers download through `/api/download`, which
requires a session, verifies an unrevoked entitlement for that file's product, applies per-minute and
daily limits, logs the attempt and redirects to a signed URL valid for 60 seconds. Notion templates
and other external deliverables can be added as links; they are shown only to owners.

Until files are uploaded, owners see an honest "files are being prepared" notice in their library.

## Security model

- Service-role key is imported only by `server-only` modules; the browser uses the publishable key and
  RLS enforces access to every table.
- Server actions and route handlers re-check the session and role; admin pages return 404 to non-staff.
- Zod validation of server-side input; in-memory rate limits on sign-in/sign-up, password changes, checkout,
  reviews, downloads, search, events and newsletter sign-ups.
- CSP, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, COOP; HSTS and
  `upgrade-insecure-requests` on HTTPS deployments.
- Post-login redirects accept same-origin paths only. Admin changes are written to the audit log.

The in-memory rate limiter is per server instance. For multi-region or high-traffic deployments, back
it with a shared store (for example Upstash Redis) in `src/lib/rate-limit.ts`.

## Testing

```bash
npm run lint && npm run typecheck && npm test

# Playwright against a production build in catalog-only mode
npm run test:e2e

# Full purchase lifecycle against a configured backend (local `supabase start` or a disposable
# staging project — never production). The app must run with the sandbox provider enabled.
E2E_FULL=1 E2E_BASE_URL=http://127.0.0.1:3000 \
E2E_SUPABASE_URL=… E2E_SUPABASE_PUBLISHABLE_KEY=… E2E_SUPABASE_SECRET_KEY=… \
E2E_STRIPE_WEBHOOK_SECRET=… \
npx playwright test --project=full

# RLS / fulfilment SQL tests on a throwaway Postgres database
DATABASE_URL=postgres://localhost:5432/vektor_rls_test npm run db:test
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use a preinstalled Chromium.

## Deployment (Vercel)

1. Import the repository; framework preset **Next.js**, Node.js 22.
2. Add the environment variables from `.env.example` (at least the Supabase ones, plus Stripe when ready).
   `NEXT_PUBLIC_*` values are inlined at build time — redeploy after changing them.
3. Point `vektorlab.uz` at the project and set `NEXT_PUBLIC_SITE_URL=https://vektorlab.uz`.
4. Register the Stripe webhook and the Supabase redirect URLs for the production domain.

## Launch checklist

These depend on decisions or accounts outside the code:

- [ ] Supabase project created, migration and seed applied, first `super_admin` assigned
- [ ] Payment provider account approved and webhook registered (or a local provider implemented)
- [ ] Real product files and Notion links uploaded for each product; product images added if desired
- [ ] Prices and currency confirmed for each product (seed prices are in RUB)
- [ ] Email: Resend domain verified (`EMAIL_FROM`) and custom SMTP set for Supabase Auth emails
- [ ] Legal texts (terms, privacy, refunds, licenses) reviewed by a lawyer for the selling entity
- [ ] Analytics left off or enabled deliberately (`NEXT_PUBLIC_FEATURE_ANALYTICS`)
