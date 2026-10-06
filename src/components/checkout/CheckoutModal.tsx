'use client';

import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  Globe, 
  Coins, 
  Zap, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  User 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';

export default function CheckoutModal() {
  const { t } = useLanguage();
  const { 
    isCheckoutOpen, 
    setIsCheckoutOpen, 
    total, 
    cartItems, 
    processCheckout 
  } = useStore();

  const [email, setEmail] = useState('founder@business.pro');
  const [name, setName] = useState('Александр');
  const [paymentMethod, setPaymentMethod] = useState<'card_ru' | 'stripe' | 'crypto' | 'demo'>('card_ru');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  if (!isCheckoutOpen) return null;

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsProcessing(true);
    setProcessingStep('Шлюз: Проверка эквайринга и авторизация транзакции...');

    // Realistic seamless simulated payment & cryptographic token minting
    setTimeout(async () => {
      setProcessingStep('Автопилот: Создание лицензии и генерация защищенного токена...');
      setTimeout(async () => {
        await processCheckout(
          email,
          name,
          paymentMethod === 'card_ru'
            ? 'Банковские карты РФ / СБП'
            : paymentMethod === 'stripe'
            ? 'Международный эквайринг Stripe'
            : paymentMethod === 'crypto'
            ? 'USDT TRC-20'
            : 'Тест-драйв автовыдачи (Sandbox)'
        );
        setIsProcessing(false);
      }, 900);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg glass-panel rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl my-8 bg-[var(--bg-main)]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-xl font-black text-[var(--text-main)]">
                {t('checkoutTitle')}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                256-bit SSL шифрование соединения
              </p>
            </div>
          </div>

          <button
            onClick={() => !isProcessing && setIsCheckoutOpen(false)}
            disabled={isProcessing}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body or Processing State */}
        {isProcessing ? (
          <div className="p-12 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-cyan-500/20 border-b-cyan-400 animate-spin" />
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-[var(--text-main)] mb-2">
                {t('processingPayment')}
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-mono animate-pulse">
                {processingStep}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 max-w-xs mx-auto">
              Не закрывайте окно, сейчас откроется ссылка на скачивание...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitPayment} className="p-6 space-y-5">
            
            {/* Input: Customer Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                {t('yourEmail')} *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alex@founder.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-[11px] text-[var(--text-muted)] block mt-1">
                Файлы и лицензионный ключ отправляются на эту почту мгновенно.
              </span>
            </div>

            {/* Input: Customer Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                {t('yourName')}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Имя или Название компании"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                {t('paymentMethod')}
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                
                {/* Method 1: Cards RU */}
                <label
                  onClick={() => setPaymentMethod('card_ru')}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'card_ru'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    <div>
                      <span className="text-sm font-bold text-[var(--text-main)] block">
                        {t('payCardRu')}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Без комиссии • Моментальное зачисление
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="gateway"
                    checked={paymentMethod === 'card_ru'}
                    onChange={() => setPaymentMethod('card_ru')}
                    className="accent-indigo-500"
                  />
                </label>

                {/* Method 2: Stripe / International Cards */}
                <label
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'stripe'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    <div>
                      <span className="text-sm font-bold text-[var(--text-main)] block">
                        {t('payCardWorld')}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Visa, Mastercard, Amex, Apple Pay
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="gateway"
                    checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')}
                    className="accent-indigo-500"
                  />
                </label>

                {/* Method 3: Crypto */}
                <label
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'crypto'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-sm font-bold text-[var(--text-main)] block">
                        {t('payCrypto')}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        USDT (TRC-20, TON, Polygon)
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="gateway"
                    checked={paymentMethod === 'crypto'}
                    onChange={() => setPaymentMethod('crypto')}
                    className="accent-indigo-500"
                  />
                </label>

                {/* Method 4: Free Demo Sandbox */}
                <label
                  onClick={() => setPaymentMethod('demo')}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'demo'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                    <div>
                      <span className="text-sm font-bold text-[var(--text-main)] block">
                        {t('payDemo')}
                      </span>
                      <span className="text-[11px] text-amber-400">
                        Мгновенное тестовое скачивание без списания
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="gateway"
                    checked={paymentMethod === 'demo'}
                    onChange={() => setPaymentMethod('demo')}
                    className="accent-amber-500"
                  />
                </label>

              </div>
            </div>

            {/* Total Summary */}
            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--text-muted)] block">Товаров в заказе: {cartItems.length} шт.</span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Автовыдача активирована
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[var(--text-muted)] block">Итого к оплате</span>
                <span className="text-2xl font-black text-[var(--text-main)]">
                  {paymentMethod === 'demo' ? '0 ₽ (Тест)' : `${total.toLocaleString('ru-RU')} ₽`}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 hover:scale-[1.01] active:scale-95 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>
                {t('payAmount')}{' '}
                {paymentMethod === 'demo' ? '0 ₽' : `${total.toLocaleString('ru-RU')} ₽`}
              </span>
            </button>

            <div className="text-center">
              <span className="text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                {t('securityBadge')}
              </span>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
