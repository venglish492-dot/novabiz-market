import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: 'Digital products for people who build — Vektor Lab.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07080a',
    theme_color: '#07080a',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
