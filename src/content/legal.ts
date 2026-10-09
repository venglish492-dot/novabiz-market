import type { Locale } from '@/i18n/config';

/**
 * Legal and policy documents. Written conservatively and in plain language;
 * they describe how the platform actually works. Review with your legal
 * advisor before relying on them commercially.
 */

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalDocument {
  title: string;
  description: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_UPDATED = '2026-10-09';

type DocKey = 'terms' | 'privacy' | 'refunds' | 'licenses';

const documents: Record<DocKey, Record<Locale, LegalDocument>> = {
  terms: {
    ru: {
      title: 'Условия использования',
      description: 'Правила использования сайта Vektor Lab и покупки цифровых продуктов.',
      intro:
        'Эти условия регулируют использование сайта vektorlab.uz и покупку цифровых продуктов Vektor Lab. Оформляя заказ или создавая аккаунт, вы соглашаетесь с ними.',
      sections: [
        {
          heading: '1. Что мы продаём',
          paragraphs: [
            'Vektor Lab продаёт цифровые продукты: шаблоны, таблицы, рабочие пространства Notion, презентации, руководства и другие файлы. Состав, форматы, версия и требования каждого продукта указаны на его странице.',
            'Покупая продукт, вы получаете лицензию на его использование на условиях, указанных в карточке продукта и на странице «Лицензии». Право собственности на продукт к вам не переходит.',
          ],
        },
        {
          heading: '2. Аккаунт',
          list: [
            'Для покупки нужен аккаунт. Указывайте достоверный email — к нему привязаны заказы и доступ к библиотеке.',
            'Вы отвечаете за сохранность пароля и действия в своём аккаунте.',
            'Мы можем ограничить доступ к аккаунту при нарушении этих условий или лицензии.',
          ],
        },
        {
          heading: '3. Цены и оплата',
          list: [
            'Цены указаны на страницах продуктов в указанной валюте. Итоговая сумма рассчитывается на сервере при оформлении заказа, включая применённые промокоды.',
            'Оплата проводится через платёжного провайдера на его защищённой странице. Данные карты не передаются Vektor Lab.',
            'Заказ считается оплаченным только после подтверждения платежа провайдером.',
          ],
        },
        {
          heading: '4. Получение продукта',
          paragraphs: [
            'После подтверждения оплаты продукт появляется в вашей библиотеке: файлы для скачивания и, если это предусмотрено продуктом, ссылка на шаблон Notion. Ссылки на скачивание создаются по запросу и действуют короткое время; повторно скачать файл можно из библиотеки.',
          ],
        },
        {
          heading: '5. Обновления',
          paragraphs: [
            'Если условия продукта предусматривают обновления, новые версии появляются в вашей библиотеке. Мы не обязуемся выпускать обновления для каждого продукта.',
          ],
        },
        {
          heading: '6. Отзывы',
          paragraphs: [
            'Оставить отзыв может только покупатель продукта. Отзывы публикуются после модерации. Мы не редактируем смысл отзывов и не публикуем отзывы, которые содержат оскорбления, рекламу или персональные данные третьих лиц.',
          ],
        },
        {
          heading: '7. Ограничение ответственности',
          paragraphs: [
            'Продукты — это инструменты и шаблоны. Результаты их использования зависят от ваших данных, решений и обстоятельств. Финансовые модели, юридические и HR-шаблоны не являются финансовой, юридической или кадровой консультацией.',
          ],
        },
        {
          heading: '8. Изменения условий',
          paragraphs: [
            'Мы можем обновлять эти условия. Дата последнего обновления указана на этой странице. Покупки, оформленные ранее, регулируются условиями на момент покупки.',
          ],
        },
        {
          heading: '9. Контакты',
          paragraphs: ['По вопросам об этих условиях пишите на hello@vektorlab.uz.'],
        },
      ],
    },
    en: {
      title: 'Terms of Service',
      description: 'Rules for using the Vektor Lab website and purchasing digital products.',
      intro:
        'These terms govern your use of vektorlab.uz and purchases of Vektor Lab digital products. By creating an account or placing an order you agree to them.',
      sections: [
        {
          heading: '1. What we sell',
          paragraphs: [
            'Vektor Lab sells digital products: templates, spreadsheets, Notion workspaces, presentations, guides and other files. Each product page lists its contents, formats, version and requirements.',
            'When you buy a product you receive a license to use it on the terms shown on the product page and on the Licenses page. Ownership of the product does not transfer to you.',
          ],
        },
        {
          heading: '2. Your account',
          list: [
            'An account is required to purchase. Use an accurate email address — orders and library access are tied to it.',
            'You are responsible for keeping your password safe and for activity in your account.',
            'We may restrict access to an account that breaches these terms or a product license.',
          ],
        },
        {
          heading: '3. Prices and payment',
          list: [
            'Prices are shown on product pages in the stated currency. The final total, including any promo code, is calculated on our server at checkout.',
            'Payment is processed by a payment provider on its secure page. Card details are not shared with Vektor Lab.',
            'An order is considered paid only after the payment provider confirms the payment.',
          ],
        },
        {
          heading: '4. Delivery',
          paragraphs: [
            'Once payment is confirmed, the product appears in your library: files to download and, where the product includes one, a link to a Notion template. Download links are generated on request and expire quickly; you can download again from your library.',
          ],
        },
        {
          heading: '5. Updates',
          paragraphs: [
            'Where a product’s terms include updates, new versions appear in your library. We do not commit to releasing updates for every product.',
          ],
        },
        {
          heading: '6. Reviews',
          paragraphs: [
            'Only customers who bought a product can review it. Reviews are published after moderation. We do not alter the meaning of reviews, and we do not publish reviews containing abuse, advertising or third-party personal data.',
          ],
        },
        {
          heading: '7. Limitation of liability',
          paragraphs: [
            'Products are tools and templates. Outcomes depend on your data, decisions and circumstances. Financial models and legal or HR templates are not financial, legal or employment advice.',
          ],
        },
        {
          heading: '8. Changes to these terms',
          paragraphs: [
            'We may update these terms. The date of the last update is shown on this page. Earlier purchases are governed by the terms in effect at the time of purchase.',
          ],
        },
        {
          heading: '9. Contact',
          paragraphs: ['Questions about these terms: hello@vektorlab.uz.'],
        },
      ],
    },
  },
  privacy: {
    ru: {
      title: 'Политика конфиденциальности',
      description: 'Какие данные собирает Vektor Lab, зачем и как они защищены.',
      intro: 'Мы собираем только данные, необходимые для работы магазина, и не продаём персональные данные.',
      sections: [
        {
          heading: 'Какие данные мы обрабатываем',
          list: [
            'Данные аккаунта: email, имя, язык интерфейса, согласие на рассылку.',
            'Данные заказов: состав заказа, суммы, статус оплаты, номер заказа.',
            'Журнал скачиваний: какой файл и когда скачан, а также тип браузера (user agent). IP-адреса в журнале не сохраняются.',
            'Отзывы, которые вы оставляете.',
            'Email подписчика рассылки (если вы подписались).',
          ],
        },
        {
          heading: 'Чего мы не храним',
          list: [
            'Данные банковских карт: их обрабатывает платёжный провайдер на своей странице.',
            'Пароли в открытом виде: аутентификацию обеспечивает поставщик сервиса авторизации.',
          ],
        },
        {
          heading: 'Зачем',
          list: [
            'Чтобы оформлять заказы, подтверждать оплату и выдавать доступ к продуктам.',
            'Чтобы защищать файлы от несанкционированного скачивания и предотвращать злоупотребления.',
            'Чтобы отвечать на ваши обращения.',
            'Чтобы отправлять письма о новых продуктах — только если вы на это согласились.',
          ],
        },
        {
          heading: 'Cookie и хранилище браузера',
          paragraphs: [
            'Мы используем необходимые cookie для входа в аккаунт и сохранения выбранного языка. Корзина, избранное и тема оформления хранятся в браузере на вашем устройстве. Мы не используем рекламные cookie и сторонние трекеры. Если включена собственная аналитика, она фиксирует обезличенные события (например, просмотр страницы продукта) без IP-адресов.',
          ],
        },
        {
          heading: 'Поставщики услуг',
          paragraphs: [
            'Для работы сайта мы используем сторонних поставщиков: хостинг, база данных и авторизация, обработка платежей и отправка писем. Они обрабатывают данные только в объёме, необходимом для оказания услуг.',
          ],
        },
        {
          heading: 'Ваши права',
          paragraphs: [
            'Вы можете изменить имя и настройки в аккаунте, отписаться от рассылки и запросить удаление аккаунта или копию ваших данных, написав на hello@vektorlab.uz. Данные о заказах могут храниться дольше, если этого требует закон.',
          ],
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      description: 'What data Vektor Lab collects, why, and how it is protected.',
      intro: 'We collect only the data needed to run the store, and we never sell personal data.',
      sections: [
        {
          heading: 'Data we process',
          list: [
            'Account data: email, name, interface language, newsletter consent.',
            'Order data: items, amounts, payment status and order number.',
            'Download log: which file was downloaded and when, plus the browser type (user agent). IP addresses are not stored in this log.',
            'Reviews you write.',
            'Newsletter subscriber email (if you subscribe).',
          ],
        },
        {
          heading: 'What we do not store',
          list: [
            'Payment card details: these are handled by the payment provider on its own page.',
            'Plain-text passwords: authentication is handled by our authentication service provider.',
          ],
        },
        {
          heading: 'Why we process it',
          list: [
            'To place orders, confirm payments and grant access to products.',
            'To protect files from unauthorized downloads and prevent abuse.',
            'To respond to your requests.',
            'To email you about new products — only if you have opted in.',
          ],
        },
        {
          heading: 'Cookies and browser storage',
          paragraphs: [
            'We use essential cookies to keep you signed in and remember your language. Your cart, wishlist and theme are stored in your browser on your device. We do not use advertising cookies or third-party trackers. If our first-party analytics is enabled, it records anonymous events (such as a product page view) without IP addresses.',
          ],
        },
        {
          heading: 'Service providers',
          paragraphs: [
            'We rely on third-party providers for hosting, database and authentication, payment processing and email delivery. They process data only as needed to provide their services.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            'You can change your name and settings in your account, unsubscribe from emails, and request deletion of your account or a copy of your data by writing to hello@vektorlab.uz. Order records may be retained longer where the law requires it.',
          ],
        },
      ],
    },
  },
  refunds: {
    ru: {
      title: 'Политика возврата',
      description: 'Когда и как можно вернуть деньги за цифровой продукт.',
      intro:
        'Цифровые продукты нельзя «вернуть» как физический товар, поэтому мы рассматриваем каждое обращение индивидуально и стараемся решить вопрос честно.',
      sections: [
        {
          heading: 'Когда мы оформляем возврат',
          list: [
            'Файл повреждён или не открывается в указанных программах, и мы не можем это исправить.',
            'Продукт существенно не соответствует описанию на странице.',
            'Вы случайно оплатили один и тот же продукт дважды.',
          ],
        },
        {
          heading: 'Как запросить возврат',
          paragraphs: [
            'Напишите на hello@vektorlab.uz в течение 14 дней после покупки. Укажите номер заказа и опишите проблему. Сначала мы постараемся помочь: прислать исправленный файл или объяснить, как работать с продуктом.',
          ],
        },
        {
          heading: 'Что происходит после возврата',
          paragraphs: [
            'Деньги возвращаются через платёжного провайдера тем же способом, которым была произведена оплата. Сроки зачисления зависят от провайдера и банка. После возврата доступ к продукту в библиотеке закрывается, а лицензия прекращает действие.',
          ],
        },
        {
          heading: 'Важно',
          paragraphs: ['Возвраты не оформляются автоматически — каждый запрос обрабатывается вручную.'],
        },
      ],
    },
    en: {
      title: 'Refund Policy',
      description: 'When and how you can get a refund for a digital product.',
      intro: 'Digital products can’t be “returned” like physical goods, so we review each request individually and aim to resolve it fairly.',
      sections: [
        {
          heading: 'When we issue refunds',
          list: [
            'A file is damaged or won’t open in the listed software, and we can’t fix it.',
            'The product is materially different from its description.',
            'You accidentally paid for the same product twice.',
          ],
        },
        {
          heading: 'How to request a refund',
          paragraphs: [
            'Email hello@vektorlab.uz within 14 days of purchase with your order number and a description of the problem. We will first try to help — by sending a corrected file or explaining how to use the product.',
          ],
        },
        {
          heading: 'After a refund',
          paragraphs: [
            'Refunds are issued through the payment provider to the original payment method. Timing depends on the provider and your bank. After a refund, access to the product in your library is removed and the license ends.',
          ],
        },
        {
          heading: 'Please note',
          paragraphs: ['Refunds are not automatic — every request is handled manually.'],
        },
      ],
    },
  },
  licenses: {
    ru: {
      title: 'Лицензии',
      description: 'Что можно и чего нельзя делать с купленными продуктами.',
      intro:
        'Каждый продукт Vektor Lab распространяется по одной из лицензий ниже. Лицензия указана на странице продукта, в чеке и в вашей библиотеке.',
      sections: [
        {
          heading: 'Общие правила',
          list: [
            'Лицензия — это право использования, а не передача прав на продукт.',
            'Лицензия действует бессрочно, пока вы соблюдаете её условия, и прекращается при возврате денег за заказ.',
            'Для продуктов сторонних авторов (когда они появятся) права принадлежат автору; Vektor Lab выдаёт лицензию от его имени на тех же условиях.',
          ],
        },
      ],
    },
    en: {
      title: 'Licenses',
      description: 'What you can and can’t do with the products you buy.',
      intro:
        'Every Vektor Lab product is distributed under one of the licenses below. The license is shown on the product page, on your receipt and in your library.',
      sections: [
        {
          heading: 'General rules',
          list: [
            'A license is a right to use, not a transfer of rights in the product.',
            'A license is perpetual while you follow its terms, and ends if the order is refunded.',
            'For third-party products (once available), rights remain with the creator; Vektor Lab grants the license on their behalf under the same terms.',
          ],
        },
      ],
    },
  },
};

export function getLegalDocument(key: DocKey, locale: Locale): LegalDocument {
  return documents[key][locale];
}
