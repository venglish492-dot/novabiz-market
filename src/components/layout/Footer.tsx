'use client';

import React from 'react';
import { ShieldCheck, Heart, Terminal } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import VectorLabLogo from '../ui/VectorLabLogo';

export default function Footer() {
  const { t } = useLanguage();
  const { setIsAdminOpen, toggleUserRole, userRole } = useStore();

  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-main)]/90 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <VectorLabLogo size={42} />

            <p className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
              {t('footerDesc')}
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('allSystemsOperational')}</span>
            </div>
          </div>

          {/* Catalog Categories Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
              Направления
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-muted)]">
              <li><a href="#catalog" className="hover:text-cyan-400 transition-colors">Финансовые модели SaaS & E-com</a></li>
              <li><a href="#catalog" className="hover:text-cyan-400 transition-colors">Операционные системы Notion</a></li>
              <li><a href="#catalog" className="hover:text-cyan-400 transition-colors">Калькуляторы маркетплейсов WB/Ozon</a></li>
              <li><a href="#catalog" className="hover:text-cyan-400 transition-colors">B2B Скрипты и Outreach базы</a></li>
              <li><a href="#catalog" className="hover:text-cyan-400 transition-colors">Венчурные питч-деки 120+ слайдов</a></li>
            </ul>
          </div>

          {/* Platform & System */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
              Инфраструктура
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-muted)]">
              <li>
                <button 
                  onClick={() => setIsAdminOpen(true)}
                  className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  Панель администратора
                </button>
              </li>
              <li>
                <button
                  onClick={toggleUserRole}
                  className="hover:text-purple-400 transition-colors"
                >
                  Переключить роль (Текущая: {userRole})
                </button>
              </li>
              <li><a href="#features" className="hover:text-cyan-400 transition-colors">Шифрование токенов AES-256</a></li>
              <li><a href="#faq" className="hover:text-cyan-400 transition-colors">Политика автовыдачи и возврата</a></li>
              <li><a href="mailto:support@novabiz-assets.pro" className="hover:text-cyan-400 transition-colors">Служба поддержки 24/7</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} VectorLab Digital Asset Marketplace. {t('footerLegal')}</p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              PCI-DSS Level 1 & SSL Encrypted
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
