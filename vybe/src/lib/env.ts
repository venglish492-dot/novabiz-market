import 'server-only';
import path from 'node:path';

function int(name: string, fallback: number, min: number, max: number): number {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.round(raw)));
}

const MB = 1024 * 1024;

/** Server-side configuration. Never import this file from a client component. */
export const env = {
  isProduction: process.env.NODE_ENV === 'production',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100').replace(/\/$/, ''),
  /** Postgres connection string. When empty, an embedded PGlite database is used. */
  databaseUrl: process.env.DATABASE_URL || '',
  /** Directory for the embedded database and the local storage adapter. */
  dataDir: path.resolve(/*turbopackIgnore: true*/ process.env.VYBE_DATA_DIR || '.data'),
  /** Secret mixed into privacy-preserving visitor hashes. Required in production. */
  analyticsSalt: process.env.VYBE_SECRET || 'dev-only-insecure-secret',
  seedDemo: process.env.VYBE_SEED_DEMO !== 'false',
  storage: {
    driver: (process.env.STORAGE_DRIVER === 'supabase' ? 'supabase' : 'local') as 'local' | 'supabase',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET || 'vybe-media',
  },
  upload: {
    imageMaxBytes: int('UPLOAD_IMAGE_MAX_MB', 15, 1, 100) * MB,
    videoMaxBytes: int('UPLOAD_VIDEO_MAX_MB', 80, 1, 500) * MB,
    audioMaxBytes: int('UPLOAD_AUDIO_MAX_MB', 20, 1, 200) * MB,
    fontMaxBytes: int('UPLOAD_FONT_MAX_MB', 4, 1, 20) * MB,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || '',
  },
} as const;

export function assertProductionSecrets() {
  if (env.isProduction && env.analyticsSalt === 'dev-only-insecure-secret') {
    throw new Error('VYBE_SECRET must be set in production.');
  }
}
