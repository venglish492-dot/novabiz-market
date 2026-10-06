'use client';

import React, { useState } from 'react';
import { 
  X, 
  Star, 
  CheckCircle, 
  FileCheck, 
  ShieldCheck, 
  ExternalLink, 
  ShoppingBag, 
  Check, 
  Sparkles,
  Download,
  Send
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';

export default function ProductDetailModal() {
  const { language, t } = useLanguage();
  const { 
    selectedProductForModal, 
    setSelectedProductForModal, 
    addToCart, 
    cartItems, 
    addProductReview 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'reviews' | 'license'>('overview');
  
  // New review form state
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRole, setReviewRole] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!selectedProductForModal) return null;

  const product = selectedProductForModal;
  const isInCart = cartItems.some(item => item.product.id === product.id);

  const title = product.title[language] || product.title.ru;
  const fullDesc = product.fullDescription[language] || product.fullDescription.ru;
  const features = product.features[language] || product.features.ru;
  const includedFiles = product.includedFiles[language] || product.includedFiles.ru;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) return;

    addProductReview(product.id, {
      author: reviewAuthor,
      role: reviewRole || 'Предприниматель',
      rating: reviewRating,
      comment: reviewComment,
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'
    });

    setReviewSubmitted(true);
    setReviewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl glass-panel rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="p-6 border-b border-[var(--border-color)] flex items-start justify-between gap-4 bg-[var(--bg-card)]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {product.fileDetails.format}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-medium">
                {product.fileDetails.version}
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 ml-2">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{product.rating}</span>
                <span className="text-[var(--text-muted)]">({product.reviewsCount} {t('reviewsWord')})</span>
              </div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] leading-tight">
              {title}
            </h2>
          </div>

          <button
            onClick={() => setSelectedProductForModal(null)}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-main)]/50 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {t('overviewTab')}
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'files'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {t('whatInsideTab')} ({includedFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {t('reviewsTab')} ({product.reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('license')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'license'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {t('guaranteeTab')}
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Описание актива
                </h4>
                <p className="text-base text-[var(--text-main)] leading-relaxed">
                  {fullDesc}
                </p>
              </div>

              {/* Key Features */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  Ключевые преимущества & Возможности
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/40 flex items-start gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-[var(--text-main)] leading-snug">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specifications Card */}
              <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                <h4 className="text-sm font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  {t('digitalSpecs')}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] block">{t('formatLabel')}</span>
                    <span className="font-bold text-[var(--text-main)] text-sm">{product.fileDetails.format}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">{t('sizeLabel')}</span>
                    <span className="font-bold text-[var(--text-main)] text-sm">{product.fileDetails.size}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">{t('versionLabel')}</span>
                    <span className="font-bold text-[var(--text-main)] text-sm">{product.fileDetails.version}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">{t('updatedLabel')}</span>
                    <span className="font-bold text-[var(--text-main)] text-sm">{product.fileDetails.lastUpdated}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INCLUDED FILES */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-muted)]">
                Сразу после подтверждения оплаты вам будут доступны для скачивания следующие файлы:
              </p>
              <div className="space-y-2.5">
                {includedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-main)] font-mono">
                        {file}
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Готов к выдаче
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Existing Reviews */}
              <div className="space-y-4">
                {product.reviews.map(rev => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)]/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={rev.avatar}
                          alt={rev.author}
                          className="w-10 h-10 rounded-full object-cover border border-indigo-500/30"
                        />
                        <div>
                          <span className="text-sm font-bold text-[var(--text-main)] block">
                            {rev.author}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {rev.role} {rev.company && `• ${rev.company}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-[var(--text-main)] italic pt-1 leading-relaxed">
                      "{rev.comment}"
                    </p>

                    <div className="text-[11px] text-[var(--text-muted)] pt-1 flex items-center gap-2">
                      <span>{rev.date}</span>
                      {rev.verified && (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          Проверенная покупка
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Review Form */}
              <div className="pt-6 border-t border-[var(--border-color)]">
                <h4 className="text-base font-bold text-[var(--text-main)] mb-3">
                  {t('writeReview')}
                </h4>
                {reviewSubmitted ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Спасибо! Ваш отзыв опубликован.
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Ваше имя"
                        value={reviewAuthor}
                        onChange={e => setReviewAuthor(e.target.value)}
                        required
                        className="px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Должность / Проект"
                        value={reviewRole}
                        onChange={e => setReviewRole(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs text-[var(--text-muted)]">Оценка:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button
                            type="button"
                            key={val}
                            onClick={() => setReviewRating(val)}
                            className="p-1 text-amber-400 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                val <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      placeholder={t('leaveReviewPlaceholder')}
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 resize-none"
                    />

                    <button
                      type="submit"
                      className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {t('submitReview')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: GUARANTEE & LICENSE */}
          {activeTab === 'license' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
                  <ShieldCheck className="w-5 h-5" />
                  Коммерческая лицензия (Single-User Unlimited Business)
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Покупая этот продукт, вы получаете бессрочное право использовать его в неограниченном числе коммерческих проектов вашей компании или клиентских проектах агентства. Перепродажа исходных шаблонов в открытом виде запрещена.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                  <Download className="w-5 h-5" />
                  Гарантия мгновенной доставки за 0.4 сек
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Наша платформа работает на полностью автономных облачных серверах. Как только банковский или крипто-шлюз подтверждает транзакцию, для вас генерируется персональный криптографический токен скачивания и отправляется копия на email.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Sticky Footer Bar with Price and CTA */}
        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-[var(--text-main)]">
              {product.price.toLocaleString('ru-RU')} {product.currency}
            </span>
            <span className="text-sm line-through text-[var(--text-muted)]">
              {product.originalPrice.toLocaleString('ru-RU')} {product.currency}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {product.notionDemoUrl && (
              <a
                href={product.notionDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-cyan-400 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Демо Notion</span>
              </a>
            )}

            <button
              onClick={() => addToCart(product)}
              className={`py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg flex-1 sm:flex-initial ${
                isInCart
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/30 active:scale-95'
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('inCart')}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t('addToCart')}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
