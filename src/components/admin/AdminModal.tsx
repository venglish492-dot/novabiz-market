'use client';

import React, { useState } from 'react';
import { 
  X, 
  BarChart3, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  ShieldAlert, 
  Edit3, 
  Check, 
  Search, 
  Tag, 
  DownloadCloud, 
  Key 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { PROMO_CODES } from '../../data/products';

export default function AdminModal() {
  const { t } = useLanguage();
  const { 
    isAdminOpen, 
    setIsAdminOpen, 
    products, 
    orders, 
    updateProductPrice 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'products' | 'promos'>('analytics');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  if (!isAdminOpen) return null;

  // Analytics calculation
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const conversionRate = '4.9%';

  const handleStartEditPrice = (productId: string, currentPrice: number) => {
    setEditingPriceId(productId);
    setTempPrice(currentPrice);
  };

  const handleSavePrice = (productId: string) => {
    updateProductPrice(productId, tempPrice);
    setEditingPriceId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-5xl glass-panel rounded-3xl border border-indigo-500/30 overflow-hidden shadow-2xl my-8 bg-[var(--bg-main)] flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--text-main)]">
                {t('adminTitle')}
              </h3>
              <span className="text-xs text-[var(--text-muted)]">
                Управление каталогом, цены, онлайн-заказы и автовыдача
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsAdminOpen(false)}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-main)]/50 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'analytics'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Обзор метрик
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {t('recentOrders')} ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'products'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {t('productsManagement')} ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('promos')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'promos'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {t('promoManagement')} ({PROMO_CODES.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: ANALYTICS OVERVIEW */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <span className="text-xs text-[var(--text-muted)] block mb-1">
                    {t('revenueMetric')}
                  </span>
                  <div className="text-2xl font-black text-emerald-400">
                    {totalRevenue.toLocaleString('ru-RU')} ₽
                  </div>
                  <span className="text-[11px] text-emerald-400/80 font-medium">
                    +18.4% за последние 7 дней
                  </span>
                </div>

                <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <span className="text-xs text-[var(--text-muted)] block mb-1">
                    {t('ordersMetric')}
                  </span>
                  <div className="text-2xl font-black text-[var(--text-main)]">
                    {totalOrdersCount}
                  </div>
                  <span className="text-[11px] text-cyan-400 font-medium">
                    100% автовыдача 0.4 сек
                  </span>
                </div>

                <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <span className="text-xs text-[var(--text-muted)] block mb-1">
                    {t('conversionMetric')}
                  </span>
                  <div className="text-2xl font-black text-indigo-400">
                    {conversionRate}
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Бенчмарк цифровых товаров
                  </span>
                </div>

                <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <span className="text-xs text-[var(--text-muted)] block mb-1">
                    {t('avgOrderMetric')}
                  </span>
                  <div className="text-2xl font-black text-[var(--text-main)]">
                    {avgOrderValue.toLocaleString('ru-RU')} ₽
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Высокий LTV покупателей
                  </span>
                </div>
              </div>

              {/* Status Box */}
              <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-indigo-300">
                    Автопилот доставки файлов активен
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Платежные вебхуки, шифрование токенов и Cloudflare Edge CDN функционируют без ошибок.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 self-start sm:self-center">
                  99.99% Uptime
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: RECENT ORDERS */}
          {activeTab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold uppercase">
                    <th className="py-3 px-3">ID заказа</th>
                    <th className="py-3 px-3">Дата</th>
                    <th className="py-3 px-3">Покупатель</th>
                    <th className="py-3 px-3">Товары</th>
                    <th className="py-3 px-3">Сумма</th>
                    <th className="py-3 px-3">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-[var(--bg-card)] transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-indigo-400">
                        {order.id}
                      </td>
                      <td className="py-3.5 px-3 text-[var(--text-muted)]">
                        {order.date}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-[var(--text-main)] block">
                          {order.customerName}
                        </span>
                        <span className="text-[var(--text-muted)]">{order.customerEmail}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-[var(--text-main)] font-medium">
                          {order.items.map(i => i.title).join(', ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-[var(--text-main)]">
                        {order.total.toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-muted)]">
                Вы можете изменить стоимость любого продукта прямо здесь — изменения мгновенно отобразятся на витрине и в корзине.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold uppercase">
                      <th className="py-3 px-3">Продукт</th>
                      <th className="py-3 px-3">Формат</th>
                      <th className="py-3 px-3">Рейтинг</th>
                      <th className="py-3 px-3">Текущая цена</th>
                      <th className="py-3 px-3 text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-[var(--bg-card)] transition-colors">
                        <td className="py-3 px-3 font-bold text-[var(--text-main)] max-w-xs">
                          {p.title.ru}
                        </td>
                        <td className="py-3 px-3 text-indigo-400 font-semibold">
                          {p.fileDetails.format}
                        </td>
                        <td className="py-3 px-3 text-amber-400 font-bold">
                          ★ {p.rating} ({p.reviewsCount})
                        </td>
                        <td className="py-3 px-3">
                          {editingPriceId === p.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={tempPrice}
                                onChange={e => setTempPrice(Number(e.target.value))}
                                className="w-24 px-2 py-1 rounded-lg border border-indigo-500 bg-[var(--bg-main)] text-white text-xs"
                              />
                              <span className="text-xs">₽</span>
                            </div>
                          ) : (
                            <span className="font-extrabold text-[var(--text-main)] text-sm">
                              {p.price.toLocaleString('ru-RU')} ₽
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {editingPriceId === p.id ? (
                            <button
                              onClick={() => handleSavePrice(p.id)}
                              className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Сохранить
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartEditPrice(p.id, p.price)}
                              className="py-1 px-3 rounded-lg border border-[var(--border-color)] hover:border-indigo-500 text-[var(--text-muted)] hover:text-white text-xs font-semibold"
                            >
                              Изменить цену
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PROMO CODES */}
          {activeTab === 'promos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PROMO_CODES.map((promo, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        {promo.code}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        -{promo.discountPercent}%
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {promo.description.ru}
                    </p>
                    {promo.minAmount && (
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        Мин. сумма: {promo.minAmount} ₽
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
