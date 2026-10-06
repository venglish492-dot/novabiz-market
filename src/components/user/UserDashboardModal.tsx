'use client';

import React, { useState } from 'react';
import { 
  X, 
  DownloadCloud, 
  Key, 
  User, 
  Package, 
  ShieldCheck, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';

export default function UserDashboardModal() {
  const { t } = useLanguage();
  const { 
    isDashboardOpen, 
    setIsDashboardOpen, 
    orders, 
    userRole, 
    toggleUserRole,
    setIsAdminOpen 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'purchases' | 'licenses' | 'profile'>('purchases');

  if (!isDashboardOpen) return null;

  const handleDownloadFile = (fileName: string, title: string, orderId: string) => {
    const content = `=====================================================
NOVABIZ ASSETS REDOWNLOAD ARCHIVE
=====================================================
Order ID: ${orderId}
Product Title: ${title}
File Asset: ${fileName}
License: Verified Single-User Commercial License
Status: Active
Server Cluster: Cloud Edge EU-Central
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.replace('.zip', '') + '_Verified.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl glass-panel rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl my-8 bg-[var(--bg-main)] flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--text-main)]">
                {t('dashboardTitle')}
              </h3>
              <span className="text-xs text-[var(--text-muted)]">
                Личный кабинет покупателя • Доступ к приобретенным архивам
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsDashboardOpen(false)}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-card)]/50 px-6 gap-2">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'purchases'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t('purchasesTab')}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-[10px]">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('licenses')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'licenses'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{t('licensesTab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('profileTab')}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: PURCHASES */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-[var(--text-muted)] opacity-30 mx-auto mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">{t('noPurchasesYet')}</p>
                </div>
              ) : (
                orders.map(order => (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--text-main)]">
                          {order.id}
                        </span>
                        <span className="text-[var(--text-muted)]">• {order.date}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {order.status === 'paid' ? 'Оплачено' : 'В обработке'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-main)]/50"
                        >
                          <div>
                            <span className="text-[10px] uppercase font-bold text-indigo-400 block">
                              {item.format}
                            </span>
                            <span className="text-sm font-bold text-[var(--text-main)]">
                              {item.title}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDownloadFile(item.sampleFileName, item.title, order.id)}
                            className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all self-start sm:self-center"
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>{t('downloadAgain')}</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
                      <span>Сумма заказа: <strong className="text-[var(--text-main)]">{order.total} ₽</strong></span>
                      <span className="text-[11px] font-mono text-indigo-400">Токен: {order.downloadToken.substring(0, 16)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: LICENSES */}
          {activeTab === 'licenses' && (
            <div className="space-y-3">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-purple-400 block font-bold">
                      NB-{order.id.replace('ORD-', '')}-{order.downloadToken.substring(9, 15).toUpperCase()}-PRO
                    </span>
                    <span className="text-xs text-[var(--text-main)] font-semibold block">
                      Single-User Unlimited Commercial License
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Выдана для {order.customerEmail} • Заказ {order.id}
                    </span>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold self-start sm:self-center">
                    Активна бессрочно
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[var(--text-muted)] block">{t('roleLabel')}</span>
                    <span className="text-base font-black text-[var(--text-main)] capitalize">
                      {userRole === 'admin' ? 'Администратор платформы' : 'Покупатель / Фаундер'}
                    </span>
                  </div>

                  <button
                    onClick={toggleUserRole}
                    className="py-2 px-3.5 rounded-xl border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{userRole === 'admin' ? t('switchRoleToBuyer') : t('switchRoleToAdmin')}</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Система автопилота:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Онлайн
                  </span>
                </div>
              </div>

              {userRole === 'admin' && (
                <div className="p-5 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 space-y-3">
                  <h4 className="text-sm font-bold text-indigo-300">
                    Режим Администратора активен
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Вы можете управлять ценами товаров, просматривать глобальную аналитику и заказы в специальной панели.
                  </p>
                  <button
                    onClick={() => {
                      setIsDashboardOpen(false);
                      setIsAdminOpen(true);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                  >
                    Открыть Панель управления маркетплейсом
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
