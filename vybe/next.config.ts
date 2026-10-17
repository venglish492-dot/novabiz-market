import path from 'node:path';
import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const httpsSite = !isDev && (process.env.NEXT_PUBLIC_SITE_URL || '').startsWith('https://');

/**
 * Content Security Policy. Inline scripts are needed for the framework's
 * hydration payload. Frames are limited to the official embed origins used by
 * profile widgets; media and images are served from this origin only.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? ' ws://localhost:* ws://127.0.0.1:*' : ''}`,
  'frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://open.spotify.com',
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  ...(httpsSite ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(httpsSite ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Native / WASM packages loaded at runtime from node_modules.
  serverExternalPackages: ['@electric-sql/pglite', 'pg', 'sharp'],
  turbopack: { root: path.resolve(import.meta.dirname) },
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  outputFileTracingIncludes: {
    '/**': ['./db/migrations/**', './db/seed-assets/**'],
  },
  async rewrites() {
    // Public profiles live at /@username; the route itself is app/u/[username].
    return [{ source: '/@:username', destination: '/u/:username' }];
  },
  async redirects() {
    return [
      { source: '/legal', destination: '/terms', permanent: true },
      { source: '/settings', destination: '/dashboard/settings', permanent: false },
      { source: '/register', destination: '/signup', permanent: true },
    ];
  },
  async headers() {
    // Uploaded files set their own stricter, sandboxed CSP in the route handler.
    return [
      { source: '/((?!api/files/).*)', headers: securityHeaders },
      { source: '/api/files/:path*', headers: securityHeaders.filter((h) => h.key !== 'Content-Security-Policy') },
    ];
  },
};

export default nextConfig;
