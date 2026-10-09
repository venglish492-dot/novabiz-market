import type { Locale } from '@/i18n/config';

/** Copy for About, Contact and Resources. No invented history, numbers or team claims. */
const pages = {
  ru: {
    about: {
      title: 'О Vektor Lab',
      description: 'Vektor Lab — маркетплейс цифровых продуктов для основателей, команд и специалистов, которые создают.',
      lead: 'Мы делаем готовые системы для работы, которую обычно начинают с чистого листа: финансовые модели, рабочие пространства, плейбуки и презентации.',
      sections: [
        {
          title: 'Чем мы занимаемся',
          body: 'Vektor Lab собирает и выпускает цифровые продукты в рабочих форматах — Excel и Google Sheets, Notion, PowerPoint, Keynote и PDF. Каждый продукт — это структура, которую можно адаптировать под свой бизнес, а не набор картинок.',
        },
        {
          title: 'Как мы работаем',
          body: 'До покупки вы видите состав продукта, форматы, версию, требования и лицензию. После подтверждения оплаты продукт попадает в вашу библиотеку, откуда его можно скачать повторно. Мы не публикуем вымышленные отзывы и не показываем статистику, которой нет.',
        },
        {
          title: 'Куда мы движемся',
          body: 'Каталог растёт: мы готовим направления UI/UX, разработки, AI и ассетов. Архитектура платформы рассчитана на продукты сторонних авторов — они появятся, когда будут готовы процессы модерации и выплат.',
        },
      ],
      principles: ['Ясность важнее обещаний', 'Состав и лицензия — до покупки', 'Только реальные отзывы и данные', 'Исходники в рабочих форматах'],
      principlesTitle: 'Принципы',
    },
    contact: {
      title: 'Контакты',
      description: 'Свяжитесь с Vektor Lab: вопросы о продуктах, заказах, лицензиях и сотрудничестве.',
      lead: 'Пишите или звоните — по вопросам продуктов, заказов, лицензий и сотрудничества.',
      orderTip: 'Если вопрос касается заказа, укажите его номер — он есть в письме и в разделе «Покупки».',
      topicsTitle: 'Возможно, ответ уже есть',
    },
    resources: {
      title: 'Ресурсы',
      description: 'Руководства, документация продуктов, блог и правила Vektor Lab.',
      lead: 'Всё, что помогает выбрать продукт и работать с ним: руководства, документация, статьи и правила.',
      guidesTitle: 'Руководства',
      guidesBody: 'Мы готовим практические руководства по работе с продуктами. Пока ответы на частые вопросы есть на страницах продуктов.',
      docsTitle: 'Документация продуктов',
      docsBody: 'Инструкции по заполнению и настройке входят в комплект продуктов и доступны в библиотеке после покупки.',
      blogTitle: 'Блог',
      blogBody: 'Статьи о финансах, операционной работе и продукте.',
      policiesTitle: 'Правила и лицензии',
    },
    blog: {
      title: 'Блог',
      description: 'Статьи Vektor Lab о финансах, операционной работе, продукте и продажах.',
      empty: 'Статей пока нет',
      emptyBody: 'Первые материалы появятся здесь. А пока загляните в каталог.',
      related: 'Продукты из статьи',
    },
  },
  en: {
    about: {
      title: 'About Vektor Lab',
      description: 'Vektor Lab is a marketplace of digital products for founders, teams and specialists who build.',
      lead: 'We make ready-made systems for work that usually starts from a blank page: financial models, workspaces, playbooks and presentation kits.',
      sections: [
        {
          title: 'What we do',
          body: 'Vektor Lab builds and publishes digital products in working formats — Excel and Google Sheets, Notion, PowerPoint, Keynote and PDF. Each product is a structure you adapt to your business, not a set of pictures.',
        },
        {
          title: 'How we work',
          body: 'Before you buy, you see the contents, formats, version, requirements and license. Once your payment is confirmed, the product lands in your library, where you can download it again. We don’t publish invented reviews or show statistics we don’t have.',
        },
        {
          title: 'Where we’re going',
          body: 'The catalog is growing: we are preparing UI/UX, development, AI and asset collections. The platform is built to support third-party creators — they will arrive once moderation and payout processes are ready.',
        },
      ],
      principles: ['Clarity over promises', 'Contents and license before purchase', 'Only real reviews and data', 'Source files in working formats'],
      principlesTitle: 'Principles',
    },
    contact: {
      title: 'Contact',
      description: 'Get in touch with Vektor Lab about products, orders, licenses and partnerships.',
      lead: 'Write or call about products, orders, licenses and partnerships.',
      orderTip: 'For order questions, include your order number — you’ll find it in your email and under Purchases.',
      topicsTitle: 'You may find the answer here',
    },
    resources: {
      title: 'Resources',
      description: 'Guides, product documentation, the blog and Vektor Lab policies.',
      lead: 'Everything that helps you choose a product and work with it: guides, documentation, articles and policies.',
      guidesTitle: 'Guides',
      guidesBody: 'We are preparing practical guides for working with our products. For now, answers to common questions are on each product page.',
      docsTitle: 'Product documentation',
      docsBody: 'Setup and usage instructions are included with each product and available in your library after purchase.',
      blogTitle: 'Blog',
      blogBody: 'Articles on finance, operations and product.',
      policiesTitle: 'Policies and licenses',
    },
    blog: {
      title: 'Blog',
      description: 'Vektor Lab articles on finance, operations, product and sales.',
      empty: 'No articles yet',
      emptyBody: 'The first articles will appear here. In the meantime, explore the catalog.',
      related: 'Products in this article',
    },
  },
} satisfies Record<Locale, unknown>;

export function getPageContent(locale: Locale) {
  return pages[locale];
}
