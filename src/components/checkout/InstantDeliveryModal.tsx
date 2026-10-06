'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Clock, 
  Key,
  FolderArchive
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';

export default function InstantDeliveryModal() {
  const { t } = useLanguage();
  const { 
    isDeliveryOpen, 
    setIsDeliveryOpen, 
    lastCreatedOrder, 
    setIsDashboardOpen,
    getDownloadUrlForProduct 
  } = useStore();

  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (isDeliveryOpen) {
      // Launch colorful celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isDeliveryOpen]);

  if (!isDeliveryOpen || !lastCreatedOrder) return null;

  const order = lastCreatedOrder;
  const licenseKey = `NB-${order.id.replace('ORD-', '')}-${order.downloadToken.substring(9, 15).toUpperCase()}-PRO`;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleTriggerMockDownload = (fileName: string, title: string) => {
    // Generate real downloadable digital manifest file in browser
    const content = `=====================================================
NOVABIZ ASSETS DIGITAL LICENSE & PRODUCT MANIFEST
=====================================================

Order Number: ${order.id}
Customer: ${order.customerName} (${order.customerEmail})
Purchase Date: ${order.date}
License Key: ${licenseKey}
Product: ${title}
File Asset: ${fileName}

-----------------------------------------------------
ACCESS INSTRUCTIONS:
-----------------------------------------------------
1. Notion Templates:
   Click "Duplicate" in top right corner of the workspace.
   Workspace Live Link: https://notion.so/novabiz-template-duplicate-hub

2. Excel & Google Sheets:
   Formulas and macros are unlocked for your team.
   File format: Open in Microsoft Excel 2019+ or Google Sheets.

3. Commercial Rights:
   Unlimited single-company and client commercial use.
   Resale of raw source files is strictly prohibited.

=====================================================
Support: support@novabiz-assets.pro
Status: Verified & Cryptographically Signed
Token: ${order.downloadToken}
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.replace('.zip', '') + '_License_Package.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl glass-panel rounded-3xl border border-emerald-500/30 overflow-hidden shadow-2xl my-8 bg-[var(--bg-main)]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Top Celebration Banner */}
        <div className="p-8 text-center bg-gradient-to-b from-emerald-500/20 via-indigo-500/10 to-transparent border-b border-[var(--border-color)] relative">
          <button
            onClick={() => setIsDeliveryOpen(false)}
            className="absolute right-4 top-4 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] mb-2">
            {t('deliverySuccessTitle')}
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            {t('deliverySuccessSubtitle')}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Order Details & Token Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs">
            <div>
              <span className="text-[var(--text-muted)] block">{t('orderIdLabel')}</span>
              <span className="font-bold text-[var(--text-main)] font-mono">{order.id}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">{t('tokenExpiresLabel')}</span>
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 7 дней
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[var(--text-muted)] block">Статус защиты:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> SSL Подписан
              </span>
            </div>
          </div>

          {/* License Key Box */}
          <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                {t('saveLicenseKey')}
              </span>
              <span className="text-sm font-extrabold text-[var(--text-main)] font-mono">
                {licenseKey}
              </span>
            </div>

            <button
              onClick={handleCopyKey}
              className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Скопирован' : 'Копировать'}</span>
            </button>
          </div>

          {/* Unlocked Products List with Downloads */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Доступные к скачиванию файлы ({order.items.length})
            </h4>

            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {item.format}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">
                      Лицензия активна
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-[var(--text-main)]">
                    {item.title}
                  </h5>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTriggerMockDownload(item.sampleFileName, item.title)}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачать файл</span>
                  </button>

                  {item.format.includes('Notion') && (
                    <a
                      href="https://demo.notion.site"
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl border border-[var(--border-color)] hover:border-cyan-400 text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Notion</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Email notice */}
          <p className="text-xs text-[var(--text-muted)] text-center">
            {t('emailSentNote')}{' '}
            <span className="font-semibold text-[var(--text-main)]">{order.customerEmail}</span>.
            Вы также можете скачать файлы в любое время в личном кабинете.
          </p>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                setIsDeliveryOpen(false);
                setIsDashboardOpen(true);
              }}
              className="py-3 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500 text-xs font-bold text-[var(--text-main)] transition-all flex items-center justify-center gap-2"
            >
              <FolderArchive className="w-4 h-4 text-purple-400" />
              <span>Перейти в Личный кабинет</span>
            </button>

            <button
              onClick={() => setIsDeliveryOpen(false)}
              className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>{t('backToShopping')}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
