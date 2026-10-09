/**
 * Public, non-secret configuration. Safe to import from client components.
 * `NEXT_PUBLIC_*` variables must be referenced literally so Next.js can inline them.
 */

export const siteConfig = {
  name: 'Vektor Lab',
  legalName: 'Vektor Lab',
  domain: 'vektorlab.uz',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://vektorlab.uz').replace(/\/$/, ''),
  email: 'hello@vektorlab.uz',
  phone: '+998 88 666 61 55',
  phoneHref: 'tel:+998886666155',
} as const;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const publicSupabase = {
  url: supabaseUrl,
  publishableKey: supabasePublishableKey,
  configured: Boolean(supabaseUrl && supabasePublishableKey),
} as const;

function flag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

/** Feature flags. Each defaults to the honest state of the current system. */
export const features = {
  /** Verified-purchase reviews. Requires Supabase. */
  reviews: flag(process.env.NEXT_PUBLIC_FEATURE_REVIEWS, true) && publicSupabase.configured,
  /** First-party product analytics events stored in Supabase. Off by default. */
  analytics: flag(process.env.NEXT_PUBLIC_FEATURE_ANALYTICS, false) && publicSupabase.configured,
  /** Newsletter subscription stored in Supabase. */
  newsletter: flag(process.env.NEXT_PUBLIC_FEATURE_NEWSLETTER, true) && publicSupabase.configured,
  /** Third-party creator marketplace (architecture prepared, not launched). */
  creators: flag(process.env.NEXT_PUBLIC_FEATURE_CREATORS, false),
  /** Membership / subscriptions (architecture prepared, not launched). */
  subscriptions: flag(process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS, false),
} as const;
