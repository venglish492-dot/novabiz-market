import { ProductCardSkeleton } from '@/components/products/ProductCard';

export default function ProductsLoading() {
  return (
    <div className="container-page py-12" aria-busy="true">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-6 h-12 w-72" />
      <div className="mt-14 grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden flex-col gap-3 lg:flex">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton h-5 w-full" />
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
