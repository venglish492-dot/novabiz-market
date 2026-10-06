'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TRANSLATIONS } from '../data/translations';

export type Language = 'ru' | 'en';

type TranslationKey = keyof typeof TRANSLATIONS.ru;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');

  useEffect(() => {
    const savedLang = localStorage.getItem('novabiz-lang') as Language;
    if (savedLang && (savedLang === 'ru' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('novabiz-lang', lang);
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === 'ru' ? 'en' : 'ru';
    setLanguage(nextLang);
  };

  const t = (key: TranslationKey): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && key in langDict) {
      return langDict[key];
    }
    return TRANSLATIONS.ru[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
