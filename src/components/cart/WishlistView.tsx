'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { useWishlist } from '@/components/providers/CommerceProvider';
import { useSession } from '@/components/providers/SessionProvider';
import { ProductCard, ProductGrid, ProductCardSkeleton } from '@/components/products/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonClasses } from '@/components/ui/Button';

export function WishlistView() {
  const { t, locale } = useI18n();
  const wishlist = useWishlist();
  const { user, accountsEnabled } = useSession();

  if (!wishlist.hydrated) {
    return (
      <ProductGrid>
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </ProductGrid>
    );
  }

  return (
    <>
      {!user && accountsEnabled && wishlist.items.length > 0 && (
        <p className="mb-6 text-sm text-fg-muted">
          {t.wishlist.guestNote}{' '}
          <Link href="/login?next=/wishlist" className="text-accent hover:underline">
            {t.nav.signIn}
          </Link>
        </p>
      )}
      {wishlist.items.length ? (
        <ProductGrid>
          {wishlist.items.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} t={t} />
          ))}
        </ProductGrid>
      ) : (
        <EmptyState
          icon={<Heart className="h-5 w-5" />}
          title={t.wishlist.empty}
          body={t.wishlist.emptyBody}
          action={
            <Link href="/products" className={buttonClasses()}>
              {t.cart.browse}
            </Link>
          }
        />
      )}
    </>
  );
}
