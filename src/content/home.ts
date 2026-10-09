import type { Locale } from '@/i18n/config';

/**
 * Homepage copy. Kept out of components and translated per locale.
 * Claims are limited to what the platform actually does today.
 */
const home = {
  ru: {
    values: [
      { title: 'Состав до покупки', body: 'В каждой карточке — файлы, форматы, версия и требования.' },
      { title: 'Понятная лицензия', body: 'Права использования описаны простым языком.' },
      { title: 'Библиотека покупок', body: 'Купленные продукты и обновления остаются в аккаунте.' },
      { title: 'Рабочие форматы', body: 'Excel, Google Sheets, Notion, PowerPoint, Keynote и PDF.' },
    ],
    featured: {
      eyebrow: 'В фокусе',
      cta: 'Смотреть продукт',
      includes: 'Что внутри',
    },
    categories: {
      eyebrow: 'Направления',
      title: 'Выберите область работы',
      description: 'Каталог организован по дисциплинам. Внутри — продукты для конкретных задач и форматов.',
    },
    goals: {
      eyebrow: 'По задаче',
      title: 'Начните с того, что нужно сделать',
      description: 'Не знаете, какой шаблон вам нужен? Выберите задачу — мы покажем подходящие продукты.',
    },
    discovery: {
      eyebrow: 'Каталог',
      title: 'Продукты, с которыми можно начать сегодня',
      cta: 'Весь каталог',
    },
    formats: {
      eyebrow: 'Форматы',
      title: 'Работает в инструментах, которыми вы уже пользуетесь',
      description: 'Мы выпускаем продукты в форматах, которые открываются без дополнительного софта и конвертаций.',
    },
    why: {
      eyebrow: 'Почему Vektor Lab',
      title: 'Продукты, собранные как системы',
      items: [
        { title: 'Готово к работе', body: 'Структура, формулы и связи уже настроены — вы адаптируете систему, а не собираете её с нуля.' },
        { title: 'Ясно, что вы получаете', body: 'Форматы, версия, размер и полный список файлов указаны до покупки.' },
        { title: 'Исходники, а не картинки', body: 'Редактируемые файлы в рабочих форматах: таблицы, рабочие пространства, слайды.' },
        { title: 'Честная лицензия', body: 'Коммерческое использование в вашем бизнесе и проектах для клиентов — без мелкого шрифта.' },
        { title: 'Доступ после подтверждения оплаты', body: 'Как только платёж подтверждён, продукт появляется в вашей библиотеке.' },
        { title: 'Обновления там же', body: 'Если условия продукта включают обновления, новые версии появляются в библиотеке.' },
      ],
    },
    how: {
      eyebrow: 'Как это работает',
      title: 'Четыре шага от выбора до работы',
      steps: [
        { title: 'Выберите', body: 'Ищите по категории, задаче или формату. Поиск понимает русский и английский.' },
        { title: 'Проверьте', body: 'Состав, совместимость, версия и лицензия — на странице продукта.' },
        { title: 'Оплатите', body: 'Оплата проходит на защищённой странице платёжного провайдера.' },
        { title: 'Работайте', body: 'Файлы и ссылки — в вашей библиотеке, доступны для повторного скачивания.' },
      ],
    },
    collections: {
      eyebrow: 'Подборки',
      title: 'Наборы под конкретную работу',
      cta: 'Все подборки',
    },
    reviews: {
      eyebrow: 'Отзывы',
      title: 'Что говорят покупатели',
    },
    faq: {
      eyebrow: 'Вопросы',
      title: 'Коротко о главном',
      items: [
        {
          q: 'Как я получу продукт?',
          a: 'После того как платёжный провайдер подтвердит оплату, продукт появится в вашей библиотеке: файлы для скачивания, а для продуктов Notion — ссылка на дублирование шаблона.',
        },
        {
          q: 'Нужен ли аккаунт?',
          a: 'Да. Покупки привязываются к аккаунту, чтобы вы могли повторно скачать файлы и получать обновления.',
        },
        {
          q: 'Какая лицензия у продуктов?',
          a: 'Большинство продуктов распространяются по коммерческой лицензии для одного пользователя: можно использовать в своём бизнесе и в проектах для клиентов, нельзя перепродавать исходные файлы. Лицензия указана в каждой карточке.',
        },
        {
          q: 'Работают ли таблицы в Google Sheets?',
          a: 'Если в форматах продукта указан Google Sheets — да, в комплект входит версия или ссылка для копирования.',
        },
        {
          q: 'Можно ли вернуть цифровой продукт?',
          a: 'Если файл повреждён, не открывается или не соответствует описанию, напишите нам в течение 14 дней после покупки. Подробности — в политике возврата.',
        },
      ],
    },
    final: {
      title: 'Найдите систему для своей следующей задачи',
      body: 'Каталог растёт. Начните с продукта, который закрывает задачу уже сегодня.',
      primary: 'Смотреть продукты',
      secondary: 'Написать нам',
    },
  },
  en: {
    values: [
      { title: 'Know what’s inside', body: 'Every product lists its files, formats, version and requirements.' },
      { title: 'Clear licensing', body: 'Usage rights explained in plain language.' },
      { title: 'Your library', body: 'Purchases and updates stay in your account.' },
      { title: 'Real formats', body: 'Excel, Google Sheets, Notion, PowerPoint, Keynote and PDF.' },
    ],
    featured: {
      eyebrow: 'In focus',
      cta: 'View product',
      includes: 'What’s inside',
    },
    categories: {
      eyebrow: 'Disciplines',
      title: 'Choose your area of work',
      description: 'The catalog is organized by discipline. Inside, products are grouped by task and format.',
    },
    goals: {
      eyebrow: 'By goal',
      title: 'Start with what you need to get done',
      description: 'Not sure which template you need? Pick a goal and we’ll show the products that fit.',
    },
    discovery: {
      eyebrow: 'Catalog',
      title: 'Products you can start using today',
      cta: 'Full catalog',
    },
    formats: {
      eyebrow: 'Formats',
      title: 'Works in the tools you already use',
      description: 'We ship in formats that open without extra software or conversions.',
    },
    why: {
      eyebrow: 'Why Vektor Lab',
      title: 'Products built as systems',
      items: [
        { title: 'Ready to use', body: 'Structure, formulas and relations are already set up — you adapt a system instead of building one.' },
        { title: 'Know what you get', body: 'Formats, version, size and the full list of files are shown before you buy.' },
        { title: 'Source files, not screenshots', body: 'Editable files in working formats: spreadsheets, workspaces and slides.' },
        { title: 'Honest licensing', body: 'Commercial use in your business and client work — no fine print.' },
        { title: 'Access once payment is confirmed', body: 'As soon as the payment is confirmed, the product appears in your library.' },
        { title: 'Updates in one place', body: 'If a product’s terms include updates, new versions appear in your library.' },
      ],
    },
    how: {
      eyebrow: 'How it works',
      title: 'Four steps from choosing to working',
      steps: [
        { title: 'Choose', body: 'Browse by category, goal or format. Search understands English and Russian.' },
        { title: 'Check', body: 'Contents, compatibility, version and license — on every product page.' },
        { title: 'Pay', body: 'Payment happens on the payment provider’s secure page.' },
        { title: 'Work', body: 'Files and links live in your library and can be downloaded again.' },
      ],
    },
    collections: {
      eyebrow: 'Collections',
      title: 'Sets for a specific job',
      cta: 'All collections',
    },
    reviews: {
      eyebrow: 'Reviews',
      title: 'What customers say',
    },
    faq: {
      eyebrow: 'Questions',
      title: 'The essentials',
      items: [
        {
          q: 'How do I receive a product?',
          a: 'Once the payment provider confirms your payment, the product appears in your library: files to download and, for Notion products, a link to duplicate the template.',
        },
        {
          q: 'Do I need an account?',
          a: 'Yes. Purchases are tied to your account so you can download files again and receive updates.',
        },
        {
          q: 'What license do products come with?',
          a: 'Most products use a Commercial license for one user: use them in your business and in client projects, but don’t resell the source files. The license is shown on every product.',
        },
        {
          q: 'Do the spreadsheets work in Google Sheets?',
          a: 'If Google Sheets is listed in a product’s formats, yes — a Sheets version or copy link is included.',
        },
        {
          q: 'Can I get a refund on a digital product?',
          a: 'If a file is damaged, won’t open or doesn’t match its description, contact us within 14 days of purchase. See the refund policy for details.',
        },
      ],
    },
    final: {
      title: 'Find the system for your next piece of work',
      body: 'The catalog keeps growing. Start with a product that solves today’s task.',
      primary: 'Explore products',
      secondary: 'Contact us',
    },
  },
} satisfies Record<Locale, unknown>;

export type HomeContent = (typeof home)['ru'];

export function getHomeContent(locale: Locale): HomeContent {
  return home[locale];
}
