'use client';

import React from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Layers, 
  BarChart3, 
  FileSpreadsheet, 
  FileText, 
  CheckSquare, 
  Rocket 
} from 'lucide-react';
import ProductCard from './ProductCard';
import { CategoryType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';

export default function CatalogSection() {
  const { language, t } = useLanguage();
  const { 
    products, 
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery,
    sortBy,
    setSortBy
  } = useStore();

  const categories: { id: CategoryType; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: t('all'), icon: Layers },
    { id: 'financial-models', label: t('financialModels'), icon: BarChart3 },
    { id: 'notion-templates', label: t('notionTemplates'), icon: FileText },
    { id: 'excel-sheets', label: t('excelSheets'), icon: FileSpreadsheet },
    { id: 'checklists-guides', label: t('checklistsGuides'), icon: CheckSquare },
    { id: 'startup-os', label: t('startupOs'), icon: Rocket }
  ];

  // Filtering
  const filteredProducts = products.filter(product => {
    // Category match
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }

    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleRu = product.title.ru.toLowerCase();
      const titleEn = product.title.en.toLowerCase();
      const descRu = product.shortDescription.ru.toLowerCase();
      const descEn = product.shortDescription.en.toLowerCase();
      const tags = product.tags.join(' ').toLowerCase();
      const format = product.fileDetails.format.toLowerCase();

      return (
        titleRu.includes(q) ||
        titleEn.includes(q) ||
        descRu.includes(q) ||
        descEn.includes(q) ||
        tags.includes(q) ||
        format.includes(q)
      );
    }

    return true;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    // Default 'popular'
    return b.reviewsCount - a.reviewsCount;
  });

  return (
    <section id="catalog" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-cyan-500/20">
              Витрина активов 2025
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-main)]">
              Каталог цифровых решений
            </h2>
            <p className="text-base text-[var(--text-muted)] mt-2">
              Выберите проверенный шаблон или модель и начните внедрение уже через 30 секунд.
            </p>
          </div>

          <div className="text-sm text-[var(--text-muted)] font-medium">
            {t('foundProducts')}{' '}
            <span className="font-bold text-[var(--text-main)]">
              {sortedProducts.length}
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                    : 'glass-panel text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-indigo-500/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl glass-panel text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <div className="relative flex items-center">
              <SlidersHorizontal className="absolute left-4 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full pl-11 pr-8 py-3.5 rounded-2xl glass-panel text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="popular" className="bg-slate-900 text-white">{t('sortPopular')}</option>
                <option value="rating" className="bg-slate-900 text-white">{t('sortRating')}</option>
                <option value="price-asc" className="bg-slate-900 text-white">{t('sortPriceAsc')}</option>
                <option value="price-desc" className="bg-slate-900 text-white">{t('sortPriceDesc')}</option>
              </select>
            </div>
          </div>

        </div>

        {/* Product Cards Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {sortedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass-panel rounded-3xl p-8 max-w-xl mx-auto">
            <Search className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">
              Ничего не найдено
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              {t('noProductsFound')}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
            >
              Сбросить фильтры
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
