'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Eye, Heart, Library, ShoppingBag } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { interpolate, pick } from '@/i18n/config';
import { buttonClasses, type ButtonSize, type ButtonVariant } from '@/components/ui/Button';
import { useCart, useWishlist } from '@/components/providers/CommerceProvider';
import { useUI } from '@/components/providers/UIProvider';
import { useToast } from '@/components/providers/ToastProvider';
import type { ProductSummary } from '@/lib/catalog/summary';

export function AddToCartButton({
  product,
  variant = 'primary',
  size = 'sm',
  className = '',
  openDrawer = false,
  fullLabel = true,
}: {
  product: ProductSummary;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  openDrawer?: boolean;
  fullLabel?: boolean;
}) {
  const { t, locale } = useI18n();
  const cart = useCart();
  const toast = useToast();
  const [justAdded, setJustAdded] = useState(false);

  if (cart.owned(product.id)) {
    return (
      <Link href="/library" className={buttonClasses({ variant: 'secondary', size, className })}>
        <Library className="h-4 w-4" aria-hidden />
        {fullLabel ? t.product.openLibrary : <span className="sr-only">{t.product.openLibrary}</span>}
      </Link>
    );
  }

  const inCart = cart.has(product.id);

  const onClick = () => {
    if (inCart) {
      cart.open();
      return;
    }
    cart.add(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
    if (openDrawer) cart.open();
    else
      toast({
        message: interpolate(t.cart.addedToast, { title: pick(product.title, locale) }),
        action: { label: t.cart.viewCart, href: '/cart' },
      });
  };

  const label = justAdded ? t.product.added : inCart ? t.product.inCart : t.product.addToCart;

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonClasses({ variant: inCart && !justAdded ? 'secondary' : variant, size, className })}
      aria-label={fullLabel ? undefined : `${label}: ${pick(product.title, locale)}`}
    >
      {justAdded || inCart ? (
        <Check className={`h-4 w-4 ${justAdded ? 'animate-pop' : ''}`} aria-hidden />
      ) : (
        <ShoppingBag className="h-4 w-4" aria-hidden />
      )}
      {fullLabel && <span>{label}</span>}
    </button>
  );
}

export function WishlistButton({ product, className = '' }: { product: ProductSummary; className?: string }) {
  const { t } = useI18n();
  const wishlist = useWishlist();
  const toast = useToast();
  const saved = wishlist.has(product.id);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t.product.wishlistRemove : t.product.wishlistAdd}
      title={saved ? t.product.wishlistRemove : t.product.wishlistAdd}
      onClick={() => {
        const nowSaved = wishlist.toggle(product);
        toast({ message: nowSaved ? t.wishlist.added : t.wishlist.removed, tone: 'info' });
      }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface/80 text-fg-muted backdrop-blur transition-colors hover:border-line-strong hover:text-fg ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition-transform duration-300 ${saved ? 'scale-110 fill-danger text-danger' : ''}`}
        aria-hidden
      />
    </button>
  );
}

export function QuickViewButton({ product, className = '' }: { product: ProductSummary; className?: string }) {
  const { t, locale } = useI18n();
  const { openQuickView } = useUI();
  return (
    <button
      type="button"
      onClick={() => openQuickView(product)}
      aria-label={`${t.product.quickView}: ${pick(product.title, locale)}`}
      title={t.product.quickView}
      className={buttonClasses({ variant: 'ghost', size: 'icon-sm', className })}
    >
      <Eye className="h-4 w-4" aria-hidden />
    </button>
  );
}
