import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/admin', '/api/', '/login', '/signup', '/forgot-password', '/reset-password', '/u/'] }],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
