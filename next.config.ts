import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

function supabaseOrigin(): URL | null {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
  } catch {
    return null;
  }
}

const supabase = supabaseOrigin();
const supabaseHttp = supabase ? supabase.origin : '';
const supabaseWs = supabase ? supabase.origin.replace(/^http/, 'ws') : '';

/**
 * Content Security Policy. Inline scripts are required by the framework's
 * hydration payload and the theme boot script; everything else is limited to
 * this origin and the configured Supabase project. Card payments happen on the
 * provider's own page (Stripe Checkout), reached by redirect.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseHttp}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseHttp} ${supabaseWs}${isDev ? ' ws://localhost:* ws://127.0.0.1:*' : ''}`.trim(),
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.stripe.com")' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: supabase
      ? [
          {
            protocol: supabase.protocol.replace(':', '') as 'http' | 'https',
            hostname: supabase.hostname,
            port: supabase.port || undefined,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
  // Fonts read from disk by the Open Graph image routes.
  outputFileTracingIncludes: {
    '/**': ['./assets/fonts/**'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
