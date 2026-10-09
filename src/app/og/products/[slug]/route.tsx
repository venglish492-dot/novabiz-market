import { renderOgImage } from '@/lib/seo/og';
import { getProductBySlug, getCatalog } from '@/lib/catalog/repository';
import { formatMoney } from '@/lib/format';
import { FORMATS } from '@/data/formats';

/**
 * Social preview image for a product, rendered from real catalog data in the
 * default locale. Stable URL (/og/products/<slug>) used by page metadata and
 * Product structured data.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return new Response('Not found', { status: 404 });
  const { categories } = await getCatalog();
  const category = categories.find((c) => c.id === product.categoryId);
  const image = await renderOgImage({
    eyebrow: category?.name.ru ?? 'Vektor Lab',
    title: product.title.ru,
    subtitle: product.subtitle.ru,
    meta: `${product.formats.map((f) => FORMATS[f].mark).join(' · ')}  —  ${formatMoney(product.price.amount, product.price.currency, 'ru')}`,
  });
  image.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  return image;
}
