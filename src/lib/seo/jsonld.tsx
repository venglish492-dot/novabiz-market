import { siteConfig } from '@/lib/config/site';
import { pick, type Locale } from '@/i18n/config';
import type { Product } from '@/types';

type JsonLdObject = Record<string, unknown>;

/** Render JSON-LD safely (`<` escaped to prevent script injection). */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export function organizationLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.svg`,
    email: siteConfig.email,
    telephone: siteConfig.phone.replace(/\s+/g, ''),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: siteConfig.email,
        telephone: siteConfig.phone.replace(/\s+/g, ''),
        availableLanguage: ['Russian', 'English'],
      },
    ],
  };
}

export function websiteLd(locale: Locale): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: locale,
    publisher: { '@id': `${siteConfig.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${siteConfig.url}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbLd(items: Array<{ name: string; path: string }>): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  };
}

/**
 * Product structured data with real fields only. Offers are included only when
 * the product can actually be purchased; ratings only when real reviews exist.
 */
export function productLd(product: Product, locale: Locale, options: { purchasable: boolean; imageUrl: string }): JsonLdObject {
  const data: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pick(product.title, locale),
    description: pick(product.shortDescription, locale),
    sku: product.slug,
    image: [options.imageUrl],
    url: `${siteConfig.url}/products/${product.slug}`,
    brand: { '@type': 'Brand', name: product.creator.name || siteConfig.name },
    category: product.tags.slice(0, 3).join(', '),
  };
  if (options.purchasable) {
    data.offers = {
      '@type': 'Offer',
      price: product.price.amount.toFixed(2),
      priceCurrency: product.price.currency,
      availability: 'https://schema.org/InStock',
      url: `${siteConfig.url}/products/${product.slug}`,
      seller: { '@id': `${siteConfig.url}/#organization` },
    };
  }
  if (product.rating && product.rating.count > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average.toFixed(2),
      reviewCount: product.rating.count,
    };
  }
  return data;
}
