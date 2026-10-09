'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useI18n } from '@/i18n/client';
import { pick } from '@/i18n/config';
import type { CategoryTone, ProductImage, ProductType } from '@/types';
import { ProductPreview } from './ProductPreview';

/**
 * Real product images when uploaded; otherwise the labelled structure schematic.
 */
export function ProductGallery({
  images,
  productType,
  tone,
  title,
}: {
  images: ProductImage[];
  productType: ProductType;
  tone: CategoryTone;
  title: string;
}) {
  const { t, locale } = useI18n();
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-line">
        <ProductPreview productType={productType} tone={tone} label={t.product.previewSchematic} size="hero" />
        <span className="absolute right-3 top-3 rounded-full border border-line bg-surface/85 px-3 py-1 text-[11px] text-fg-muted backdrop-blur">
          {t.product.previewUnavailable}
        </span>
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-line bg-surface-2">
        <Image
          src={current.url}
          alt={pick(current.alt, locale) || title}
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar relative flex gap-2 overflow-x-auto" role="tablist" aria-label={title}>
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-line aria-selected:border-accent"
            >
              <Image src={image.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
