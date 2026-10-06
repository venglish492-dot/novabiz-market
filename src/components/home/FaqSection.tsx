'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function FaqSection() {
  const { t } = useLanguage();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Как именно происходит мгновенная выдача товара?',
      a: 'Сразу после того, как банковский эквайринг или крипто-шлюз подтверждает транзакцию (обычно это занимает от 0.2 до 1 секунды), наша система генерирует криптографический защищенный токен. Окно браузера автоматически переключается на экран выдачи с кнопками скачивания ZIP-архива и прямыми ссылками на дублирование в Notion. Дополнительно копия архива и лицензионный ключ отправляются на ваш Email.'
    },
    {
      q: 'Подойдут ли Excel-таблицы для работы в Google Таблицах?',
      a: 'Да, 100%! Все наши финансовые модели и калькуляторы юнит-экономики оптимизированы для кросс-платформенной работы. В комплект каждого продукта входит как классический файл .xlsx (с рабочими формулами), так и PDF-инструкция со специальной ссылкой для импорта и копирования в личный Google Drive в один клик.'
    },
    {
      q: 'Как перенести купленный шаблон Notion в свое рабочее пространство?',
      a: 'Это делается в один клик. Перейдя по персональной ссылке из вашего заказа, вы попадете на страницу шаблона в Notion. В правом верхнем углу достаточно нажать кнопку «Duplicate» (Дублировать), и вся структура со всеми 24+ базами данных и страницами появится в вашем аккаунте Notion.'
    },
    {
      q: 'Какая лицензия предоставляется на использование материалов?',
      a: 'Вы получаете бессрочную коммерческую лицензию (Single-User Unlimited Commercial License). Это дает право использовать модели, таблицы, скрипты и регламенты для любых ваших собственных бизнес-проектов или при работе с клиентами без каких-либо роялти. Запрещается только прямая перепродажа исходных шаблонов в качестве отдельного цифрового товара.'
    },
    {
      q: 'Что делать, если у меня возникнут вопросы по заполнению финмодели?',
      a: 'В каждый комплект вложена подробная PDF-методичка и видео-инструкция с разбором каждого поля и сценария. Кроме того, наша служба поддержки доступна 24/7 в Telegram и по email для ответов на любые вопросы.'
    }
  ];

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-cyan-500/20">
            <HelpCircle className="w-3.5 h-3.5" />
            База знаний
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-main)] mb-4">
            {t('faqTitle')}
          </h2>
          <p className="text-base text-[var(--text-muted)]">
            {t('faqSubtitle')}
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl border border-[var(--border-color)] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-[var(--text-main)] hover:text-cyan-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[var(--text-muted)] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-color)] animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
