import 'server-only';
import { publicSupabase, siteConfig } from './site';

/**
 * Server-only configuration. Never import this module from a client component:
 * it reads secrets. The `server-only` import makes such a mistake a build error.
 */

const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isProductionDeployment =
  process.env.VERCEL_ENV === 'production' ||
  (process.env.NODE_ENV === 'production' && siteConfig.url === `https://${siteConfig.domain}`);

export const serverConfig = {
  supabase: {
    url: publicSupabase.url,
    secretKey,
    /** Server-side privileged access is available. */
    adminConfigured: Boolean(publicSupabase.url && secretKey),
  },
  storage: {
    filesBucket: process.env.STORAGE_BUCKET_FILES || 'product-files',
    mediaBucket: process.env.STORAGE_BUCKET_MEDIA || 'product-media',
    /** Lifetime of signed download URLs. Kept short: the URL is used immediately. */
    downloadUrlTtlSeconds: clampInt(process.env.DOWNLOAD_URL_TTL_SECONDS, 60, 10, 600),
    /** Maximum successful downloads per user per product per 24 hours. */
    dailyDownloadLimit: clampInt(process.env.DOWNLOAD_DAILY_LIMIT, 20, 1, 500),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    get configured() {
      return Boolean(this.secretKey && this.webhookSecret);
    },
  },
  sandbox: {
    /**
     * Test-only payment provider. It can never be enabled on the production
     * deployment, and every order it creates is flagged `is_test`.
     */
    enabled: process.env.PAYMENTS_SANDBOX_ENABLED === 'true' && !isProductionDeployment,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || '',
    get configured() {
      return Boolean(this.resendApiKey && this.from);
    },
  },
  isProductionDeployment,
} as const;

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
