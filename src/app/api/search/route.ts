import type { NextRequest } from 'next/server';
import { getCatalog, searchCatalog } from '@/lib/catalog/repository';
import { normalizeText } from '@/lib/catalog/search';
import { formatMoney } from '@/lib/format';
import { getLocale } from '@/i18n/server';
import { pick } from '@/i18n/config';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { FORMATS } from '@/data/formats';

/** Command-palette search. Returns a compact, localized result list. */
export async function GET(request: NextRequest) {
  const limiter = rateLimit(`search:${await clientKey()}`, 120, 60_000);
  if (!limiter.ok) return Response.json({ error: 'rate_limited' }, { status: 429 });

  const query = (request.nextUrl.searchParams.get('q') ?? '').slice(0, 100);
  const locale = await getLocale();
  const { categories } = await getCatalog();
  const products = query.trim() ? await searchCatalog(query) : [];
  const normalized = normalizeText(query);

  const matchingCategories = normalized
    ? categories
        .filter((c) => normalizeText(`${c.name.ru} ${c.name.en}`).includes(normalized))
        .slice(0, 4)
        .map((c) => ({ slug: c.slug, name: pick(c.name, locale) }))
    : [];

  return Response.json(
    {
      products: products.slice(0, 8).map((p) => ({
        slug: p.slug,
        title: pick(p.title, locale),
        subtitle: pick(p.subtitle, locale),
        price: formatMoney(p.price.amount, p.price.currency, locale),
        formats: p.formats.slice(0, 3).map((f) => FORMATS[f].mark),
      })),
      categories: matchingCategories,
      total: products.length,
    },
    { headers: { 'Cache-Control': 'private, max-age=30' } },
  );
}
