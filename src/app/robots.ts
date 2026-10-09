import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';

/** Private application areas are excluded from crawling. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/account',
          '/library',
          '/checkout',
          '/cart',
          '/wishlist',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/auth/',
          '/api/',
          '/search',
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
