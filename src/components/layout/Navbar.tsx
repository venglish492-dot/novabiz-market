'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Sun, 
  Moon, 
  Zap, 
  Languages, 
  LayoutDashboard, 
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  Download
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { 
    cartCount, 
    setIsCartOpen, 
    setIsDashboardOpen, 
    setIsAdminOpen, 
    userRole, 
    toggleUserRole,
    orders
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-[var(--border-color)] bg-[var(--bg-main)]/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-[var(--bg-main)] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-400 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                NOVABIZ
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO 2025
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)] tracking-wider uppercase font-medium">
              Digital Assets Autopilot
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#catalog"
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            {t('catalog')}
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            {t('about')}
          </a>
          <a
            href="#reviews"
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            {t('reviews')}
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            {t('faq')}
          </a>
        </nav>

        {/* Right Action Icons & Toggles */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            title={`Switch to ${language === 'ru' ? 'English' : 'Русский'}`}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500 text-xs font-semibold flex items-center gap-1.5 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <Languages className="w-4 h-4 text-cyan-400" />
            <span className="uppercase">{language}</span>
          </button>

          {/* 3-Way Theme Switcher (Dark -> Neon -> Light) */}
          <button
            onClick={toggleTheme}
            title={`Theme: ${theme}. Click to switch`}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500 text-xs font-semibold flex items-center gap-1.5 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
            {theme === 'neon' && <Zap className="w-4 h-4 text-cyan-300 animate-pulse" />}
            {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
            <span className="hidden lg:inline capitalize">
              {theme === 'dark' ? t('themeDark') : theme === 'neon' ? t('themeNeon') : t('themeLight')}
            </span>
          </button>

          {/* Buyer Purchases / Dashboard */}
          <button
            onClick={() => setIsDashboardOpen(true)}
            className="relative p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500 text-xs font-semibold flex items-center gap-1.5 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]"
            title={t('myPurchases')}
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">{t('myPurchases')}</span>
            {orders.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Admin Dashboard Trigger */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title={t('admin')}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">{t('admin')}</span>
          </button>

          {/* Cart Trigger Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all"
            aria-label="Open Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{t('cart')}</span>
            {cartCount > 0 && (
              <span className="bg-white text-indigo-900 font-bold text-xs px-2 py-0.5 rounded-full animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-4 space-y-3">
          <a
            href="#catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            {t('catalog')}
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            {t('about')}
          </a>
          <a
            href="#reviews"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            {t('reviews')}
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            {t('faq')}
          </a>
          <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Режим роли: {userRole}</span>
            <button
              onClick={toggleUserRole}
              className="text-xs text-indigo-400 font-medium underline"
            >
              Сменить роль ({userRole === 'buyer' ? 'на Админа' : 'на Покупателя'})
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
