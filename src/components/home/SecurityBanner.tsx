'use client';

import React from 'react';
import { ShieldCheck, Key, Lock, FileCheck2, Cpu } from 'lucide-react';

export default function SecurityBanner() {
  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-indigo-500/20 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
            <div className="lg:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider border border-indigo-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Архитектура безопасности & Защита от пиратства
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-[var(--text-main)] tracking-tight">
                Криптографическая защита файлов и бессрочные лицензии
              </h3>
              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                Каждый сгенерированный архив подписывается уникальным SHA-256 токеном покупателя с водяным знаком. Ссылки защищены временными ограничениями и защитой от перехвата IP-адресов. Вы получаете 100% юридически чистый актив с бессрочной лицензией.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[var(--bg-main)]/60 border border-[var(--border-color)] flex items-center gap-3">
                <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">Шифрование ссылок AES-256</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Одноразовые токены для безопасной выдачи</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-main)]/60 border border-[var(--border-color)] flex items-center gap-3">
                <Key className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">Генерация лицензионного ключа</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Официальное право коммерческого использования</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-main)]/60 border border-[var(--border-color)] flex items-center gap-3">
                <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">Edge CDN Автопилот</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Мгновенный отклик серверов в любой точке мира</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
