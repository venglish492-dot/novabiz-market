'use client';

import React from 'react';
import { Star, DownloadCloud, Eye, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { language, t } = useLanguage();
  const { addToCart, cartItems, setSelectedProductForModal } = useStore();

  const isInCart = cartItems.some(item => item.product.id === product.id);

  const title = product.title[language] || product.title.ru;
  const description = product.shortDescription[language] || product.shortDescription.ru;
  const badgeText = product.badge ? product.badge[language] || product.badge.ru : null;

  return (
    <div className="glass-panel glass-panel-hover rounded-3xl overflow-hidden flex flex-col justify-between group transition-all duration-300">
      
      {/* Top Banner & Badges */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {product.fileDetails.format}
            </span>
            {badgeText && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                {badgeText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{product.rating}</span>
            <span className="text-[var(--text-muted)] font-normal">({product.reviewsCount})</span>
          </div>
        </div>

        {/* Product Title */}
        <h3 
          onClick={() => setSelectedProductForModal(product)}
          className="text-xl font-extrabold text-[var(--text-main)] mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2 cursor-pointer leading-tight"
        >
          {title}
        </h3>

        {/* Short Description */}
        <p className="text-sm text-[var(--text-muted)] line-clamp-3 leading-relaxed mb-4">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {product.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium text-[var(--text-muted)] bg-[var(--border-color)] px-2.5 py-0.5 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer: Price & Actions */}
      <div className="p-6 pt-4 border-t border-[var(--border-color)] bg-[var(--bg-main)]/30">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <span className="text-xs text-[var(--text-muted)] block">
              {t('instantAccess')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--text-main)] tracking-tight">
                {product.price.toLocaleString('ru-RU')} {product.currency}
              </span>
              <span className="text-xs line-through text-[var(--text-muted)]">
                {product.originalPrice.toLocaleString('ru-RU')} {product.currency}
              </span>
            </div>
          </div>

          <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
            <DownloadCloud className="w-3.5 h-3.5" />
            {product.fileDetails.size}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSelectedProductForModal(product)}
            className="w-full py-2.5 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-cyan-400 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center gap-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('quickView')}</span>
          </button>

          <button
            onClick={() => addToCart(product)}
            className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all ${
              isInCart
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/20 active:scale-95'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t('inCart')}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('addToCart')}</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
