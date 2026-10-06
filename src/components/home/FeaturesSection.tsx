'use client';

import React from 'react';
import { Zap, Award, ShieldAlert, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Zap,
      title: t('feat1Title'),
      desc: t('feat1Desc'),
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      icon: Award,
      title: t('feat2Title'),
      desc: t('feat2Desc'),
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: ShieldAlert,
      title: t('feat3Title'),
      desc: t('feat3Desc'),
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      icon: RefreshCw,
      title: t('feat4Title'),
      desc: t('feat4Desc'),
      gradient: 'from-emerald-500 to-teal-500'
    }
  ];

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-indigo-500/20">
            <Layers className="w-3.5 h-3.5" />
            Инфраструктура автопилота
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-main)] mb-4">
            Почему лидеры выбирают{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              VectorLab
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-muted)]">
            Мы превратили хаос операционных документов в кристально чистые, готовые к внедрению цифровые активы.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="glass-panel glass-panel-hover p-8 rounded-3xl flex flex-col justify-between relative group"
              >
                <div>
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${feat.gradient} p-[1px] mb-6 shadow-md`}
                  >
                    <div className="w-full h-full bg-[var(--bg-main)] rounded-[15px] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-3">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center gap-2 text-xs text-indigo-400 font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Проверено на практике</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
