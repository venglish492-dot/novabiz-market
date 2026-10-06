'use client';

import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Tag, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Percent
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';

export default function CartDrawer() {
  const { language, t } = useLanguage();
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cartItems, 
    removeFromCart, 
    clearCart, 
    subtotal, 
    discountAmount, 
    total, 
    appliedPromo, 
    applyPromoCode, 
    removePromoCode,
    setIsCheckoutOpen 
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const res = applyPromoCode(promoInput);
    if (res.success) {
      setPromoMessage({ text: res.message, isError: false });
      setPromoInput('');
    } else {
      setPromoMessage({ text: res.message, isError: true });
    }
  };

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="absolute inset-y-0 right-0 max-w-full flex pl-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-screen max-w-md glass-panel border-l border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col justify-between shadow-2xl">
          
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xl font-black text-[var(--text-main)]">
                {t('cartTitle')}
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                {cartItems.length}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-16 h-16 text-[var(--text-muted)] opacity-30 mx-auto mb-4" />
                <h4 className="text-base font-bold text-[var(--text-main)] mb-1">
                  {t('cartEmpty')}
                </h4>
                <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                  {t('cartEmptySubtitle')}
                </p>
              </div>
            ) : (
              cartItems.map(item => {
                const title = item.product.title[language] || item.product.title.ru;
                return (
                  <div
                    key={item.product.id}
                    className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {item.product.fileDetails.format}
                        </span>
                        <span className="text-xs text-emerald-400 font-medium">
                          Автовыдача 0.4с
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-main)] line-clamp-2 leading-tight">
                        {title}
                      </h4>
                      <div className="text-sm font-extrabold text-[var(--text-main)] pt-1">
                        {item.product.price.toLocaleString('ru-RU')} {item.product.currency}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                      title="Удалить из корзины"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
              
              {/* Promo Code Input */}
              <div>
                {appliedPromo ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs font-semibold text-emerald-400">
                    <div className="flex items-center gap-1.5">
                      <Percent className="w-4 h-4" />
                      <span>
                        Промокод {appliedPromo.code} (-{appliedPromo.discountPercent}%)
                      </span>
                    </div>
                    <button
                      onClick={removePromoCode}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Удалить
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Промокод (START2025 / FREEDEMO)"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] uppercase focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                    >
                      {t('applyPromo')}
                    </button>
                  </form>
                )}

                {promoMessage && (
                  <span
                    className={`block text-[11px] font-medium mt-1.5 ${
                      promoMessage.isError ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {promoMessage.text}
                  </span>
                )}
              </div>

              {/* Price Calculations */}
              <div className="space-y-1.5 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
                <div className="flex justify-between">
                  <span>{t('cartSubtotal')}</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {subtotal.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>{t('cartDiscount')}</span>
                    <span>-{discountAmount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-extrabold text-[var(--text-main)] pt-2 border-t border-[var(--border-color)]">
                  <span>{t('cartTotal')}</span>
                  <span className="text-lg bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    {total.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleOpenCheckout}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 hover:scale-[1.01] active:scale-95 transition-all"
              >
                <span>{t('checkoutBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  SSL Защищенный эквайринг
                </span>
                <button
                  onClick={clearCart}
                  className="hover:text-rose-400 transition-colors"
                >
                  {t('clearCart')}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
