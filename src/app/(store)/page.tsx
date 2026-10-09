import { getI18n } from '@/i18n/server';
import { getCatalog } from '@/lib/catalog/repository';
import { categoryTree, countByCategory, sortProducts, availableFacets } from '@/lib/catalog/queries';
import { toProductSummary } from '@/lib/catalog/summary';
import { getApprovedReviews } from '@/lib/catalog/reviews';
import { features } from '@/lib/config/site';
import { getHomeContent } from '@/content/home';
import { Hero } from '@/components/home/Hero';
import {
  CategoryShowcase,
  CollectionsShowcase,
  FeaturedProduct,
  FinalCta,
  FormatsShowcase,
  GoalExplorer,
  HomeFaq,
  HowItWorks,
  ProductStrip,
  RecentReviews,
  ValueStrip,
  WhyVektor,
} from '@/components/home/HomeSections';
import { Newsletter } from '@/components/home/Newsletter';

export default async function HomePage() {
  const { locale, t } = await getI18n();
  const content = getHomeContent(locale);
  const { products, categories, collections } = await getCatalog();
  const reviews = await getApprovedReviews(undefined, 3);

  const counts = countByCategory(products, categories);
  const roots = categoryTree(categories);
  const populated = roots.filter((root) => (counts.get(root.id) ?? 0) > 0).map((root) => ({ ...root, count: counts.get(root.id) ?? 0 }));
  const roadmap = roots.filter((root) => (counts.get(root.id) ?? 0) === 0);

  const recommended = sortProducts(
    products.filter((p) => p.productType !== 'bundle'),
    'recommended',
  );
  const summaries = recommended.map((p) => toProductSummary(p, categories));
  const summaryById = new Map(summaries.map((s) => [s.id, s]));
  const featured = summaries.find((s) => s.badges.includes('featured')) ?? summaries[0];
  const facets = availableFacets(products);
  const productById = new Map(products.map((p) => [p.id, p]));

  return (
    <>
      <Hero
        t={t}
        locale={locale}
        categories={populated.map((c) => ({ slug: c.slug, name: c.name, count: c.count, tone: c.tone }))}
      />
      <ValueStrip content={content} />
      {featured && <FeaturedProduct t={t} locale={locale} content={content} product={featured} />}
      <CategoryShowcase t={t} locale={locale} content={content} categories={populated} roadmap={roadmap} />
      <GoalExplorer t={t} locale={locale} content={content} goalCounts={facets.goals} />
      <ProductStrip t={t} locale={locale} content={content} products={summaries.slice(0, 8)} />
      <FormatsShowcase t={t} locale={locale} content={content} formatCounts={facets.formats} />
      <WhyVektor content={content} />
      <HowItWorks content={content} />
      <CollectionsShowcase t={t} locale={locale} content={content} collections={collections} products={summaryById} />
      <RecentReviews t={t} locale={locale} content={content} reviews={reviews} products={productById} />
      <HomeFaq content={content} />
      <Newsletter enabled={features.newsletter} />
      <FinalCta content={content} />
    </>
  );
}
