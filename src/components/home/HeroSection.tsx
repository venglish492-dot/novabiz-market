'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Zap, DownloadCloud, Sparkles, CheckCircle2 } from 'lucide-react';
import HeroScene3D from '../3d/HeroScene3D';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';

export default function HeroSection() {
  const { t } = useLanguage();
  const { products, addToCart } = useStore();

  const handleTestAutoDelivery = () => {
    // Select the first product, apply demo flow
    if (products.length > 0) {
      addToCart(products[0]);
    }
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-12 pb-20">
      {/* 3D Scene Interactive Canvas */}
      <HeroScene3D />

      {/* Subtle Background Glow Overlays */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        {/* Pulsing Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border-[var(--border-color)] mb-8 shadow-lg shadow-indigo-500/10 hover:scale-105 transition-transform duration-300">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs sm:text-sm font-semibold tracking-wide bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
            {t('heroBadge')}
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] max-w-5xl mb-6">
          <span className="block text-[var(--text-main)]">
            {t('heroTitlePart1')}
          </span>
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
            {t('heroTitlePart2')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-base sm:text-lg lg:text-xl text-[var(--text-muted)] font-normal leading-relaxed mb-10">
          {t('heroSubtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <a
            href="#catalog"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 text-white font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/30 hover:shadow-cyan-500/40 hover:scale-[1.03] active:scale-95 transition-all group"
          >
            <Sparkles className="w-5 h-5 text-cyan-300 group-hover:rotate-12 transition-transform" />
            <span>{t('heroCtaCatalog')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          <button
            onClick={handleTestAutoDelivery}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel glass-panel-hover border-[var(--border-color)] text-[var(--text-main)] font-semibold text-base flex items-center justify-center gap-2.5 active:scale-95 transition-all"
          >
            <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>{t('heroCtaDemo')}</span>
          </button>
        </div>

        {/* Quick Trust Micro-badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Лицензия для бизнеса</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Защищенный SSL эквайринг</span>
          </div>
          <div className="flex items-center gap-2">
            <DownloadCloud className="w-4 h-4 text-indigo-400" />
            <span>Скачивание в 1 клик</span>
          </div>
        </div>

      </div>
    </section>
  );
}
