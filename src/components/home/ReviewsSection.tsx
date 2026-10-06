'use client';

import React from 'react';
import { Star, CheckCircle, MessageSquareQuote } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ReviewsSection() {
  const { t } = useLanguage();

  const reviews = [
    {
      author: 'Михаил Резников',
      role: 'CEO & Founder',
      company: 'CloudPulse B2B',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      rating: 5,
      date: '14 февраля 2025',
      comment: 'С финмоделью SaaS мы подняли Seed-раунд на $300k. Фонды особенно оценили прозрачный когортный анализ и логику удержания. Сэкономили как минимум 2 недели работы финдиректора.'
    },
    {
      author: 'Артем Дронов',
      role: 'COO',
      company: 'Veloce Media',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      rating: 5,
      date: '5 марта 2025',
      comment: 'Перевели всю распределенную команду из 16 человек в Notion Startup OS. Скорость координации выросла кардинально: теперь каждый сотрудник в реальном времени видит свои OKR и спринты.'
    },
    {
      author: 'Елена Кузнецова',
      role: 'Founder',
      company: 'Nordic Home Shop',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
      rating: 5,
      date: '19 февраля 2025',
      comment: 'Таблица юнит-экономики для Wildberries и Ozon спасла нас от кассового разрыва. Наконец-то увидели скрытые расходы по логистике и подняли маржинальность на 8.4%.'
    }
  ];

  return (
    <section id="reviews" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-amber-500/20">
            <MessageSquareQuote className="w-3.5 h-3.5" />
            Реальный опыт внедрения
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-main)] mb-4">
            Что говорят фаундеры и топ-менеджеры
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-muted)]">
            Более 14,000 предпринимателей масштабируют свои проекты с нашими цифровыми активами.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="glass-panel glass-panel-hover p-8 rounded-3xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-[var(--text-main)] leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.avatar}
                    alt={rev.author}
                    className="w-11 h-11 rounded-full object-cover border border-indigo-500/30"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-main)]">
                      {rev.author}
                    </h4>
                    <span className="text-xs text-[var(--text-muted)]">
                      {rev.role} • {rev.company}
                    </span>
                  </div>
                </div>

                <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
