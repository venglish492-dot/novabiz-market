'use client';

import React from 'react';
import { DownloadCloud, Star, Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function StatsBanner() {
  const { t } = useLanguage();

  const stats = [
    {
      icon: DownloadCloud,
      value: t('statDownloads'),
      label: t('statDownloadsLabel'),
      color: 'from-blue-500 to-cyan-400'
    },
    {
      icon: Star,
      value: t('statSatisfaction'),
      label: t('statSatisfactionLabel'),
      color: 'from-amber-400 to-orange-500'
    },
    {
      icon: Clock,
      value: t('statDeliveryTime'),
      label: t('statDeliveryTimeLabel'),
      color: 'from-emerald-400 to-teal-500'
    },
    {
      icon: Sparkles,
      value: t('statSavedHours'),
      label: t('statSavedHoursLabel'),
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 mb-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${stat.color} p-[1px] mb-4 flex items-center justify-center shadow-lg`}
              >
                <div className="w-full h-full bg-[var(--bg-main)] rounded-[11px] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--text-main)] mb-1">
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
