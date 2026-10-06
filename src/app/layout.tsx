import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';
import { StoreProvider } from '../context/StoreContext';
import CartDrawer from '../components/cart/CartDrawer';
import CheckoutModal from '../components/checkout/CheckoutModal';
import InstantDeliveryModal from '../components/checkout/InstantDeliveryModal';
import ProductDetailModal from '../components/catalog/ProductDetailModal';
import UserDashboardModal from '../components/user/UserDashboardModal';
import AdminModal from '../components/admin/AdminModal';

export const metadata: Metadata = {
  title: 'VectorLab — Лаборатория цифровых бизнес-активов и моделей',
  description: 'Автономная платформа цифровых бизнес-активов VectorLab: проверенные финансовые модели, шаблоны Notion, калькуляторы Excel и чек-листы с мгновенной автовыдачей за 0.4 сек.',
  keywords: [
    'VectorLab',
    'Notion шаблоны для бизнеса',
    'Финансовая модель SaaS Excel',
    'Калькулятор Wildberries Ozon юнит экономика',
    'B2B скрипты продаж',
    'Startup OS Notion',
    'Венчурный питч дек'
  ],
  authors: [{ name: 'VectorLab' }],
  openGraph: {
    title: 'VectorLab — Премиальные цифровые активы для роста бизнеса',
    description: 'Готовые финансовые модели, Notion OS и шаблоны с автоматической выдачей сразу после оплаты.',
    type: 'website'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-theme="dark" className="theme-dark scroll-smooth">
      <body className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] antialiased selection:bg-indigo-500 selection:text-white">
        <ThemeProvider>
          <LanguageProvider>
            <StoreProvider>
              {children}
              
              {/* Global Modals & Drawers */}
              <CartDrawer />
              <CheckoutModal />
              <InstantDeliveryModal />
              <ProductDetailModal />
              <UserDashboardModal />
              <AdminModal />
            </StoreProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
