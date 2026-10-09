import type { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';

/** Consistent per-page metadata: title, description, canonical URL, OG and Twitter cards. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  type = 'website',
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
}): Metadata {
  const url = `${siteConfig.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: siteConfig.name,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
