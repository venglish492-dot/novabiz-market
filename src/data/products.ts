import type { Product } from '../types/index.ts';

/**
 * Static catalog: the fallback data source when Supabase is not configured,
 * and the seed source for the `products` table (see scripts/generate-seed.ts).
 *
 * Content policy:
 *  - No ratings, review counts or download counts here. These are derived
 *    from real data (approved, verified-purchase reviews) only.
 *  - No compare-at prices unless a genuine regular price is configured.
 *  - Product facts (what is included, counts of templates/slides/tabs) are
 *    kept as described by the product owner. Outcome claims (conversion
 *    rates, revenue, funding results) are not used.
 */

export const VEKTOR_LAB_CREATOR = {
  id: 'c0000000-0000-4000-8000-000000000001',
  slug: 'vektor-lab',
  name: 'Vektor Lab',
};

type ProductSeed = Omit<
  Product,
  | 'status'
  | 'creator'
  | 'rating'
  | 'compareAtAmount'
  | 'thumbnail'
  | 'gallery'
  | 'previewUrl'
  | 'documentationUrl'
  | 'bundleProductIds'
  | 'seo'
  | 'changelog'
  | 'createdAt'
  | 'updatedAt'
  | 'publishedAt'
  | 'technologies'
> &
  Partial<Pick<Product, 'technologies' | 'changelog'>>;

function defineProduct(seed: ProductSeed): Product {
  return {
    status: 'published',
    creator: VEKTOR_LAB_CREATOR,
    rating: null,
    compareAtAmount: null,
    thumbnail: null,
    gallery: [],
    previewUrl: null,
    documentationUrl: null,
    bundleProductIds: [],
    seo: { title: null, description: null },
    technologies: [],
    changelog: [],
    createdAt: `${seed.lastUpdated}T00:00:00.000Z`,
    updatedAt: `${seed.lastUpdated}T00:00:00.000Z`,
    publishedAt: `${seed.lastUpdated}T00:00:00.000Z`,
    ...seed,
  };
}

const notionDuplicateFaq = {
  question: {
    ru: 'Как я получу шаблон Notion?',
    en: 'How do I receive the Notion template?',
  },
  answer: {
    ru: 'После подтверждения оплаты в вашей библиотеке появится ссылка на дублирование. Откройте её, нажмите «Duplicate» и выберите своё рабочее пространство Notion.',
    en: 'Once your payment is confirmed, a duplicate link appears in your library. Open it, click “Duplicate” and choose your Notion workspace.',
  },
};

const sheetsFaq = {
  question: {
    ru: 'Работает ли модель в Google Таблицах?',
    en: 'Does the model work in Google Sheets?',
  },
  answer: {
    ru: 'Да. В комплект входят файл .xlsx и ссылка для копирования версии Google Sheets в ваш Google Drive.',
    en: 'Yes. You get the .xlsx file plus a link to copy the Google Sheets version into your Google Drive.',
  },
};

export const PRODUCTS: Product[] = [
  defineProduct({
    id: 'a1000000-0000-4000-8000-000000000001',
    slug: 'saas-unit-economics-financial-model',
    productType: 'spreadsheet',
    title: {
      ru: 'Финансовая модель SaaS и юнит-экономика на 5 лет',
      en: 'SaaS Unit Economics & 5-Year Financial Model',
    },
    subtitle: {
      ru: 'Когорты, LTV/CAC, отток, P&L и денежный поток в одной модели',
      en: 'Cohorts, LTV/CAC, churn, P&L and cash flow in one model',
    },
    shortDescription: {
      ru: 'Финансовая модель для B2B и B2C SaaS: когортный анализ, LTV/CAC, отток, P&L, Cash Flow и три сценария роста.',
      en: 'A financial model for B2B and B2C SaaS: cohort analysis, LTV/CAC, churn, P&L, cash flow and three growth scenarios.',
    },
    description: {
      ru: 'Модель для фаундеров и финансовых руководителей SaaS-компаний. Рассчитывает ключевые метрики — MRR, ARR, Net Revenue Retention, срок окупаемости CAC — и строит прогноз денежных потоков на 60 месяцев. Сценарии роста переключаются в одном месте, а дашборд с графиками можно сразу использовать в материалах для инвесторов.',
      en: 'A model for founders and finance leads at SaaS companies. It calculates key metrics — MRR, ARR, net revenue retention, CAC payback — and builds a 60-month cash flow forecast. Growth scenarios switch in one place, and the chart dashboard can go straight into investor materials.',
    },
    categoryId: 'financial-models',
    secondaryCategoryIds: ['unit-economics', 'finance'],
    goals: ['analyze-unit-economics', 'prepare-investors', 'build-saas', 'launch-startup'],
    tags: ['SaaS', 'LTV/CAC', 'MRR', 'P&L', 'Cash Flow', 'Cohorts'],
    formats: ['excel', 'google-sheets', 'pdf'],
    software: ['Microsoft Excel', 'Google Sheets'],
    audience: {
      ru: ['Фаундеры SaaS-стартапов', 'Финансовые директора и аналитики', 'Команды, готовящиеся к раунду'],
      en: ['SaaS founders', 'Finance leads and analysts', 'Teams preparing to raise'],
    },
    useCases: {
      ru: ['Планирование бюджета на год вперёд', 'Подготовка финансовой части питч-дека', 'Оценка влияния цены и оттока на выручку'],
      en: ['Planning next year’s budget', 'Preparing the financial section of a pitch deck', 'Testing how pricing and churn affect revenue'],
    },
    features: {
      ru: [
        'Расчёт CAC, LTV, оттока и когортного удержания',
        'Три сценария роста: консервативный, базовый, агрессивный',
        'Прогноз P&L и денежного потока на 60 месяцев',
        'Дашборд ключевых метрик с графиками для инвесторов',
        'Версия для Google Sheets',
      ],
      en: [
        'CAC, LTV, churn and cohort retention calculations',
        'Three growth scenarios: conservative, base and aggressive',
        '60-month P&L and cash flow forecast',
        'Key-metrics dashboard with investor-ready charts',
        'Google Sheets version',
      ],
    },
    includedItems: {
      ru: [
        'Финансовая модель SaaS (.xlsx)',
        'Ссылка на копию в Google Sheets (PDF)',
        'Шаблон дашборда KPI для инвесторов (.xlsx)',
        'Пошаговое руководство по заполнению (PDF, 28 страниц)',
      ],
      en: [
        'SaaS financial model (.xlsx)',
        'Google Sheets copy link (PDF)',
        'Investor KPI dashboard template (.xlsx)',
        'Step-by-step setup guide (PDF, 28 pages)',
      ],
    },
    requirements: {
      ru: ['Microsoft Excel (настольная версия) или Google Sheets', 'Базовое понимание SaaS-метрик'],
      en: ['Microsoft Excel (desktop) or Google Sheets', 'A basic understanding of SaaS metrics'],
    },
    specs: [
      { label: { ru: 'Вкладки', en: 'Tabs' }, value: { ru: '14', en: '14' } },
      { label: { ru: 'Горизонт прогноза', en: 'Forecast horizon' }, value: { ru: '60 месяцев', en: '60 months' } },
      { label: { ru: 'Сценарии', en: 'Scenarios' }, value: { ru: '3', en: '3' } },
      { label: { ru: 'Руководство', en: 'Guide' }, value: { ru: 'PDF, 28 страниц', en: 'PDF, 28 pages' } },
    ],
    faq: [sheetsFaq],
    price: { amount: 3490, currency: 'RUB' },
    license: 'commercial',
    delivery: 'download',
    version: '4.2',
    lastUpdated: '2025-01-01',
    fileSize: '8.4 MB',
    isFeatured: true,
    sortOrder: 1,
  }),

  defineProduct({
    id: 'a1000000-0000-4000-8000-000000000002',
    slug: 'startup-os-notion-workspace',
    productType: 'notion-template',
    title: {
      ru: 'Startup OS — рабочее пространство Notion',
      en: 'Startup OS — Notion Workspace',
    },
    subtitle: {
      ru: 'CRM, база знаний, OKR, спринты и онбординг в одной системе',
      en: 'CRM, wiki, OKRs, sprints and onboarding in one system',
    },
    shortDescription: {
      ru: 'Операционная система компании в Notion: CRM, база знаний, OKR, спринты, финансы и онбординг команды.',
      en: 'A company operating system in Notion: CRM, wiki, OKRs, sprints, finance and team onboarding.',
    },
    description: {
      ru: 'Единое рабочее пространство вместо разрозненных инструментов. 24 связанные базы данных: задачи по Scrum и Kanban, карточки клиентов и воронка B2B-сделок, квартальные OKR, база знаний с регламентами и дашборд руководителя. Шаблон дублируется в ваш аккаунт Notion и полностью редактируется.',
      en: 'One workspace instead of scattered tools. 24 linked databases: Scrum and Kanban tasks, client records and a B2B deal pipeline, quarterly OKRs, a wiki with SOPs and an executive dashboard. The template is duplicated into your own Notion account and is fully editable.',
    },
    categoryId: 'startup-os',
    secondaryCategoryIds: ['startup-systems', 'project-management'],
    goals: ['launch-startup', 'organize-operations', 'manage-team', 'build-saas'],
    tags: ['Notion', 'Startup OS', 'CRM', 'OKR', 'Wiki', 'Sprints'],
    formats: ['notion', 'pdf'],
    software: ['Notion'],
    audience: {
      ru: ['Фаундеры и операционные руководители', 'Команды от 2 до 50 человек', 'Компании, переходящие в Notion'],
      en: ['Founders and operations leads', 'Teams of 2 to 50 people', 'Companies moving to Notion'],
    },
    useCases: {
      ru: ['Запуск операционных процессов новой компании', 'Сведение задач, целей и клиентов в одно место', 'Онбординг новых сотрудников'],
      en: ['Setting up operations for a new company', 'Bringing tasks, goals and clients into one place', 'Onboarding new hires'],
    },
    features: {
      ru: [
        'Дашборд основателя: выручка, спринты и ключевые метрики',
        'B2B CRM со статусами сделок и контактами',
        'OKR с прогрессом по ключевым результатам',
        'База регламентов, SOP и онбординга',
        'Дублирование в личное или командное пространство Notion',
      ],
      en: [
        'Founder dashboard: revenue, sprints and key metrics',
        'B2B CRM with deal stages and contacts',
        'OKRs with key-result progress tracking',
        'Hub for SOPs, procedures and onboarding',
        'Duplicates into a personal or team Notion workspace',
      ],
    },
    includedItems: {
      ru: [
        'Ссылка на дублирование шаблона Notion',
        'Видео по настройке под ваш бизнес (40 минут)',
        'Гайд по внедрению регламентов в команде (PDF)',
        'Набор иконок и обложек для страниц',
      ],
      en: [
        'Notion template duplicate link',
        'Customization walkthrough video (40 minutes)',
        'Team SOP rollout guide (PDF)',
        'Icon and page-cover pack',
      ],
    },
    requirements: {
      ru: ['Аккаунт Notion', 'Для командной работы — командное пространство Notion'],
      en: ['A Notion account', 'A Notion team workspace for collaborative use'],
    },
    specs: [
      { label: { ru: 'Базы данных', en: 'Databases' }, value: { ru: '24 связанные', en: '24 linked' } },
      { label: { ru: 'Страницы и шаблоны', en: 'Pages & templates' }, value: { ru: '45+', en: '45+' } },
      { label: { ru: 'Видео', en: 'Video' }, value: { ru: '40 минут', en: '40 minutes' } },
    ],
    faq: [notionDuplicateFaq],
    price: { amount: 2990, currency: 'RUB' },
    license: 'commercial',
    delivery: 'download-and-link',
    version: '5.0',
    lastUpdated: '2025-02-01',
    fileSize: null,
    isFeatured: true,
    sortOrder: 2,
  }),

  defineProduct({
    id: 'a1000000-0000-4000-8000-000000000003',
    slug: 'b2b-cold-outreach-playbook',
    productType: 'playbook',
    title: {
      ru: 'Плейбук B2B-аутрича и Account-Based Marketing',
      en: 'B2B Cold Outreach & ABM Playbook',
    },
    subtitle: {
      ru: '45 цепочек писем, скрипты для LinkedIn и CRM для лидов',
      en: '45 email sequences, LinkedIn scripts and a lead CRM',
    },
    shortDescription: {
      ru: '45 цепочек холодных писем для B2B, скрипты для LinkedIn, чек-лист доставляемости и Notion-CRM для лидогенерации.',
      en: '45 B2B cold email sequences, LinkedIn scripts, a deliverability checklist and a Notion CRM for prospecting.',
    },
    description: {
      ru: 'Система исходящих продаж для B2B: шаблоны писем для разных сегментов, сценарии фоллоу-апов, технический чек-лист настройки почты (SPF, DKIM, DMARC), рекомендации по текстам и трекер лидов в Notion. Шаблоны — отправная точка: результаты зависят от рынка, оффера и базы контактов.',
      en: 'An outbound sales system for B2B: email templates for different segments, follow-up cadences, a technical mail setup checklist (SPF, DKIM, DMARC), copywriting guidance and a Notion lead tracker. The templates are a starting point — results depend on your market, offer and contact list.',
    },
    categoryId: 'outreach',
    secondaryCategoryIds: ['sales', 'copywriting'],
    goals: ['improve-sales', 'run-agency'],
    tags: ['B2B', 'Cold email', 'LinkedIn', 'ABM', 'Deliverability', 'Prompts'],
    formats: ['pdf', 'notion', 'excel'],
    software: ['Notion', 'Microsoft Excel', 'Any email client'],
    audience: {
      ru: ['Основатели B2B-компаний', 'SDR и менеджеры по продажам', 'Маркетинговые и лидген-агентства'],
      en: ['B2B founders', 'SDRs and account executives', 'Marketing and lead-gen agencies'],
    },
    useCases: {
      ru: ['Запуск первой кампании холодных писем', 'Настройка домена и почты перед рассылкой', 'Персонализация писем с помощью AI'],
      en: ['Launching a first cold email campaign', 'Setting up a domain and mailbox before sending', 'Personalizing emails with AI'],
    },
    features: {
      ru: [
        '45 многошаговых цепочек писем для разных B2B-ниш',
        'Скрипты первого контакта и фоллоу-апов в LinkedIn',
        'Чек-лист прогрева домена и настройки SPF/DKIM/DMARC',
        'Промпты для персонализации писем с помощью языковых моделей',
      ],
      en: [
        '45 multi-step email cadences for different B2B niches',
        'LinkedIn connection and follow-up message scripts',
        'Domain warm-up and SPF/DKIM/DMARC setup checklist',
        'Prompts for personalizing emails with language models',
      ],
    },
    includedItems: {
      ru: [
        'Основной плейбук по аутричу (PDF, 84 страницы)',
        'Сборник цепочек писем (PDF)',
        'Трекер лидов (ссылка на шаблон Notion)',
        'Чек-лист аудита доставляемости (.xlsx)',
      ],
      en: [
        'Outreach master playbook (PDF, 84 pages)',
        'Email sequence copy book (PDF)',
        'Lead tracker (Notion template link)',
        'Deliverability audit checklist (.xlsx)',
      ],
    },
    requirements: {
      ru: ['Корпоративная почта на собственном домене', 'Аккаунт Notion для трекера лидов'],
      en: ['A business mailbox on your own domain', 'A Notion account for the lead tracker'],
    },
    specs: [
      { label: { ru: 'Цепочки писем', en: 'Email sequences' }, value: { ru: '45', en: '45' } },
      { label: { ru: 'Плейбук', en: 'Playbook' }, value: { ru: 'PDF, 84 страницы', en: 'PDF, 84 pages' } },
    ],
    faq: [],
    price: { amount: 1990, currency: 'RUB' },
    license: 'commercial',
    delivery: 'download-and-link',
    version: '3.1',
    lastUpdated: '2025-01-01',
    fileSize: '14.2 MB',
    isFeatured: false,
    sortOrder: 5,
  }),

  defineProduct({
    id: 'a1000000-0000-4000-8000-000000000004',
    slug: 'ecommerce-unit-economics-pnl-cashflow',
    productType: 'spreadsheet',
    title: {
      ru: 'E-commerce и маркетплейсы: юнит-экономика, P&L и ДДС',
      en: 'E-commerce & Marketplaces: Unit Economics, P&L and Cash Flow',
    },
    subtitle: {
      ru: 'Чистая прибыль по каждому SKU с учётом комиссий, логистики и возвратов',
      en: 'Net profit per SKU after fees, fulfilment and returns',
    },
    shortDescription: {
      ru: 'Таблица для продавцов на Wildberries, Ozon, Яндекс Маркете и в собственном магазине: комиссии, логистика, реклама, возвраты и денежный поток.',
      en: 'A spreadsheet for sellers on Wildberries, Ozon, Yandex Market and their own store: fees, fulfilment, ads, returns and cash flow.',
    },
    description: {
      ru: 'Считает реальную чистую прибыль с учётом комиссий маркетплейса, эквайринга, логистики, хранения и процента выкупа. Включает ABC/XYZ-анализ ассортимента, управленческий P&L, бюджет движения денежных средств и калькулятор точки безубыточности для новых товаров. Справочник тарифов отражает ставки на момент выпуска версии — сверяйте их с актуальными условиями площадок.',
      en: 'Calculates true net profit after marketplace commission, payment processing, fulfilment, storage and buyout rate. Includes ABC/XYZ assortment analysis, a management P&L, a cash flow budget and a break-even calculator for new products. The fee reference reflects rates at the time of the version release — check them against current marketplace terms.',
    },
    categoryId: 'unit-economics',
    secondaryCategoryIds: ['finance', 'analytics'],
    goals: ['sell-on-marketplaces', 'analyze-unit-economics'],
    tags: ['E-commerce', 'Wildberries', 'Ozon', 'P&L', 'Cash Flow', 'SKU'],
    formats: ['excel', 'google-sheets'],
    software: ['Microsoft Excel', 'Google Sheets'],
    audience: {
      ru: ['Селлеры маркетплейсов', 'DTC-бренды и интернет-магазины', 'Финансисты e-commerce'],
      en: ['Marketplace sellers', 'DTC brands and online stores', 'E-commerce finance teams'],
    },
    useCases: {
      ru: ['Поиск убыточных SKU', 'Расчёт допустимого рекламного бюджета', 'Решение о запуске нового товара'],
      en: ['Finding unprofitable SKUs', 'Setting a safe ad budget', 'Deciding whether to launch a new product'],
    },
    features: {
      ru: [
        'Юнит-экономика каждого SKU с учётом процента выкупа',
        'Управленческий P&L и бюджет движения денежных средств',
        'ABC/XYZ-анализ товарной матрицы',
        'Расчёт допустимого рекламного бюджета по марже',
      ],
      en: [
        'Per-SKU unit economics including buyout rate',
        'Management P&L and cash flow budget',
        'ABC/XYZ product assortment analysis',
        'Safe ad budget calculated from margin',
      ],
    },
    includedItems: {
      ru: [
        'Модель юнит-экономики для маркетплейсов (.xlsx)',
        'Ссылка на версию Google Sheets (PDF)',
        'Видеоинструкция по расчётам (ссылка)',
        'Справочник тарифов и комиссий (.xlsx)',
      ],
      en: [
        'Marketplace unit economics model (.xlsx)',
        'Google Sheets version link (PDF)',
        'Calculation walkthrough video (link)',
        'Fee and commission reference (.xlsx)',
      ],
    },
    requirements: {
      ru: ['Microsoft Excel или Google Sheets', 'Выгрузка продаж и расходов с ваших площадок'],
      en: ['Microsoft Excel or Google Sheets', 'Sales and cost exports from your sales channels'],
    },
    specs: [
      { label: { ru: 'Вкладки', en: 'Tabs' }, value: { ru: '11 связанных', en: '11 linked' } },
      { label: { ru: 'Анализы', en: 'Analyses' }, value: { ru: 'ABC/XYZ, точка безубыточности', en: 'ABC/XYZ, break-even' } },
    ],
    faq: [sheetsFaq],
    price: { amount: 2490, currency: 'RUB' },
    license: 'commercial',
    delivery: 'download',
    version: '3.8',
    lastUpdated: '2025-02-01',
    fileSize: '6.7 MB',
    isFeatured: false,
    sortOrder: 4,
  }),

  defineProduct({
    id: 'a1000000-0000-4000-8000-000000000005',
    slug: 'product-manager-playbook',
    productType: 'notion-template',
    title: {
      ru: 'Плейбук продакт-менеджера (Notion + PDF)',
      en: 'Product Manager Playbook (Notion + PDF)',
    },
    subtitle: {
      ru: 'PRD, CustDev, дерево метрик и приоритизация RICE/ICE',
      en: 'PRDs, customer discovery, metric trees and RICE/ICE scoring',
    },
    shortDescription: {
      ru: 'Инструментарий продакт-менеджера: шаблоны PRD, гайды для CustDev-интервью, дерево North Star Metric и фреймворки приоритизации RICE, ICE и Kano.',
      en: 'A product manager’s toolkit: PRD templates, customer interview guides, a North Star Metric tree and RICE, ICE and Kano prioritization frameworks.',
    },
    description: {
      ru: 'Практическая библиотека артефактов для управления продуктом: шаблоны документации, сценарии интервью для проверки гипотез, калькуляторы приоритизации и карта метрик. Подходит как для одного продакта, так и для продуктовой команды.',
      en: 'A practical library of product management artifacts: documentation templates, interview scripts for validating hypotheses, prioritization calculators and a metrics map. Works for a single PM or a whole product team.',
    },
    categoryId: 'prd',
    secondaryCategoryIds: ['research', 'strategy', 'productivity'],
    goals: ['build-product', 'build-saas'],
    tags: ['Product', 'PRD', 'CustDev', 'North Star', 'RICE', 'Kano'],
    formats: ['notion', 'pdf'],
    software: ['Notion'],
    audience: {
      ru: ['Продакт-менеджеры и CPO', 'Фаундеры, которые сами ведут продукт', 'Продуктовые команды'],
      en: ['Product managers and CPOs', 'Founders who run product themselves', 'Product teams'],
    },
    useCases: {
      ru: ['Написание PRD для новой функции', 'Проведение интервью с клиентами', 'Приоритизация бэклога'],
      en: ['Writing a PRD for a new feature', 'Running customer interviews', 'Prioritizing the backlog'],
    },
    features: {
      ru: [
        'Шаблоны PRD (Product Requirements Document)',
        'Сценарии CustDev-интервью и трекер инсайтов',
        'Калькулятор приоритизации RICE и ICE, разбор модели Kano',
        'Дерево метрик North Star Metric',
      ],
      en: [
        'Product Requirements Document (PRD) templates',
        'Customer interview scripts and an insights tracker',
        'RICE and ICE scoring calculator, Kano model guide',
        'North Star Metric tree',
      ],
    },
    includedItems: {
      ru: [
        'Ссылка на дублирование рабочего пространства Notion',
        'Справочник вопросов для CustDev-интервью (PDF, 42 страницы)',
        'Шпаргалки по Product Discovery (PDF)',
        'Шпаргалка по user flow и дизайн-токенам (PDF)',
      ],
      en: [
        'Notion workspace duplicate link',
        'Customer interview question handbook (PDF, 42 pages)',
        'Product discovery cheat sheets (PDF)',
        'User flow and design token cheat sheet (PDF)',
      ],
    },
    requirements: {
      ru: ['Аккаунт Notion'],
      en: ['A Notion account'],
    },
    specs: [
      { label: { ru: 'Базы данных', en: 'Databases' }, value: { ru: '18', en: '18' } },
      { label: { ru: 'Шаблоны', en: 'Templates' }, value: { ru: '35', en: '35' } },
      { label: { ru: 'Справочник интервью', en: 'Interview handbook' }, value: { ru: 'PDF, 42 страницы', en: 'PDF, 42 pages' } },
    ],
    faq: [notionDuplicateFaq],
    price: { amount: 2790, currency: 'RUB' },
    license: 'commercial',
    delivery: 'download-and-link',
    version: '4.0',
    lastUpdated: '2025-01-01',
    fileSize: null,
    isFeatured: false,
    sortOrder: 6,
  }),

  defineProduct({
    id: 'a1000000-0000-4000-8000-000000000006',
    slug: 'venture-pitch-deck-kit',
    productType: 'presentation',
    title: {
      ru: 'Набор для питч-дека и инвестиционных материалов',
      en: 'Venture Pitch Deck Kit',
    },
    subtitle: {
      ru: '120+ слайдов для PowerPoint, Keynote и Google Slides + дата-рум в Notion',
      en: '120+ slides for PowerPoint, Keynote and Google Slides + a Notion data room',
    },
    shortDescription: {
      ru: 'Более 120 редактируемых слайдов для привлечения инвестиций в PowerPoint, Keynote и Google Slides, а также шаблон дата-рума в Notion.',
      en: 'More than 120 editable fundraising slides for PowerPoint, Keynote and Google Slides, plus a Notion data room template.',
    },
    description: {
      ru: 'Конструктор презентации для раундов Pre-Seed, Seed и Series A. Слайды следуют привычной для инвесторов структуре: проблема, решение, рынок TAM/SAM/SOM, бизнес-модель, тракшн, команда. В комплекте тёмная и светлая темы, инфографика, шаблон виртуального дата-рума в Notion и гайд по подготовке к встречам с инвесторами.',
      en: 'A deck builder for Pre-Seed, Seed and Series A rounds. Slides follow the structure investors expect: problem, solution, TAM/SAM/SOM, business model, traction and team. Includes dark and light themes, infographics, a Notion virtual data room template and a guide to preparing for investor meetings.',
    },
    categoryId: 'pitch-decks',
    secondaryCategoryIds: ['powerpoint', 'keynote', 'google-slides', 'startup-systems'],
    goals: ['prepare-investors', 'launch-startup'],
    tags: ['Pitch deck', 'Fundraising', 'Keynote', 'PowerPoint', 'Data room'],
    formats: ['powerpoint', 'keynote', 'google-slides', 'notion', 'pdf'],
    software: ['PowerPoint', 'Keynote', 'Google Slides', 'Notion'],
    audience: {
      ru: ['Фаундеры перед раундом', 'Акселерационные программы', 'Команды, готовящие демо-день'],
      en: ['Founders before a round', 'Accelerator cohorts', 'Teams preparing for demo day'],
    },
    useCases: {
      ru: ['Сборка питч-дека с нуля', 'Подготовка дата-рума для due diligence', 'Отработка ответов на вопросы инвесторов'],
      en: ['Building a pitch deck from scratch', 'Preparing a data room for due diligence', 'Rehearsing answers to investor questions'],
    },
    features: {
      ru: [
        'Более 120 мастер-слайдов в тёмной и светлой темах',
        'Структуры слайдов: проблема, решение, рынок, бизнес-модель, команда, тракшн',
        'Шаблон виртуального дата-рума в Notion',
        'Гайд по подготовке к встречам и ответам на вопросы инвесторов',
      ],
      en: [
        '120+ master slides in dark and light themes',
        'Slide structures: problem, solution, market, business model, team, traction',
        'Notion virtual data room template',
        'Guide to preparing for investor meetings and questions',
      ],
    },
    includedItems: {
      ru: [
        'Питч-дек для PowerPoint (.pptx)',
        'Питч-дек для Keynote (.key)',
        'Ссылка на копию в Google Slides (PDF)',
        'Шаблон дата-рума в Notion (ссылка)',
        'Гайд по подготовке к раунду (PDF, 32 страницы)',
      ],
      en: [
        'PowerPoint pitch deck (.pptx)',
        'Keynote pitch deck (.key)',
        'Google Slides copy link (PDF)',
        'Notion data room template (link)',
        'Fundraising preparation guide (PDF, 32 pages)',
      ],
    },
    requirements: {
      ru: ['PowerPoint, Keynote или Google Slides', 'Аккаунт Notion для дата-рума'],
      en: ['PowerPoint, Keynote or Google Slides', 'A Notion account for the data room'],
    },
    specs: [
      { label: { ru: 'Слайды', en: 'Slides' }, value: { ru: '120+', en: '120+' } },
      { label: { ru: 'Темы', en: 'Themes' }, value: { ru: 'Тёмная и светлая', en: 'Dark and light' } },
      { label: { ru: 'Гайд', en: 'Guide' }, value: { ru: 'PDF, 32 страницы', en: 'PDF, 32 pages' } },
    ],
    faq: [
      {
        question: { ru: 'Можно ли менять шрифты и цвета?', en: 'Can I change fonts and colours?' },
        answer: {
          ru: 'Да. Все слайды редактируются: тексты, цвета, графики и расположение элементов.',
          en: 'Yes. Every slide is editable: text, colours, charts and layout.',
        },
      },
    ],
    price: { amount: 3890, currency: 'RUB' },
    license: 'commercial',
    delivery: 'download-and-link',
    version: '4.5',
    lastUpdated: '2025-02-01',
    fileSize: '142 MB',
    isFeatured: true,
    sortOrder: 3,
  }),

  defineProduct({
    id: 'a1000000-0000-4000-8000-000000000007',
    slug: 'hr-team-scaling-system',
    productType: 'notion-template',
    title: {
      ru: 'HR-система для роста команды: найм, онбординг и оценка',
      en: 'HR & Team Scaling System: Hiring, Onboarding & Reviews',
    },
    subtitle: {
      ru: 'ATS в Notion, скоринг-карты, план 30-60-90 и Review 360',
      en: 'A Notion ATS, interview scorecards, 30-60-90 plans and 360 reviews',
    },
    shortDescription: {
      ru: 'Воронка найма (ATS) в Notion, скоринг-карты собеседований, планы адаптации на 30-60-90 дней и Performance Review 360.',
      en: 'A Notion applicant tracking system, interview scorecards, 30-60-90 day onboarding plans and 360 performance reviews.',
    },
    description: {
      ru: 'Система управления персоналом для растущих компаний. Помогает выстроить путь сотрудника: профиль вакансии, структурированные интервью, онбординг в первые недели и регулярная оценка результатов по методике 360 градусов.',
      en: 'A people-management system for growing companies. It structures the employee journey: role profiles, structured interviews, onboarding in the first weeks and regular 360-degree performance reviews.',
    },
    categoryId: 'operations',
    secondaryCategoryIds: ['project-management', 'productivity'],
    goals: ['manage-team', 'organize-operations', 'launch-startup'],
    tags: ['HR', 'Hiring', 'ATS', 'Onboarding', 'Performance review', 'Notion'],
    formats: ['notion', 'pdf', 'word', 'excel'],
    software: ['Notion', 'Microsoft Word', 'Microsoft Excel'],
    audience: {
      ru: ['Фаундеры, которые сами нанимают', 'HR и People-команды', 'Руководители растущих отделов'],
      en: ['Founders who hire themselves', 'HR and People teams', 'Managers of growing teams'],
    },
    useCases: {
      ru: ['Организация воронки кандидатов', 'Единые критерии оценки на собеседованиях', 'Онбординг и ревью сотрудников'],
      en: ['Organizing a candidate pipeline', 'Consistent interview evaluation criteria', 'Onboarding and employee reviews'],
    },
    features: {
      ru: [
        'ATS в Notion с этапами воронки кандидатов',
        'Скоринг-карты для оценки hard и soft skills',
        'Чек-листы онбординга на 30-60-90 дней',
        'Шаблон и методика Performance Review 360°',
      ],
      en: [
        'Notion ATS with candidate pipeline stages',
        'Scorecards for evaluating hard and soft skills',
        '30-60-90 day onboarding checklists',
        '360° performance review template and method',
      ],
    },
    includedItems: {
      ru: [
        'Ссылка на дублирование рабочего пространства Notion',
        'Описания 50 технических вакансий (PDF)',
        'Шаблон handbook для сотрудников (.docx)',
        'Рубрика оценки на интервью (.xlsx)',
      ],
      en: [
        'Notion workspace duplicate link',
        '50 tech role job descriptions (PDF)',
        'Employee handbook starter template (.docx)',
        'Interview scorecard rubric (.xlsx)',
      ],
    },
    requirements: {
      ru: ['Аккаунт Notion', 'Microsoft Word и Excel (или совместимые редакторы)'],
      en: ['A Notion account', 'Microsoft Word and Excel (or compatible editors)'],
    },
    specs: [
      { label: { ru: 'Базы данных', en: 'Databases' }, value: { ru: '12', en: '12' } },
      { label: { ru: 'Документы', en: 'Documents' }, value: { ru: '28', en: '28' } },
      { label: { ru: 'Описания вакансий', en: 'Job descriptions' }, value: { ru: '50', en: '50' } },
    ],
    faq: [notionDuplicateFaq],
    price: { amount: 2190, currency: 'RUB' },
    license: 'commercial',
    delivery: 'download-and-link',
    version: '2.6',
    lastUpdated: '2025-01-01',
    fileSize: null,
    isFeatured: false,
    sortOrder: 7,
  }),

  defineProduct({
    id: 'a1000000-0000-4000-8000-000000000008',
    slug: 'freelance-agency-os',
    productType: 'notion-template',
    title: {
      ru: 'Freelance & Agency OS: клиенты, договоры, счета и CRM',
      en: 'Freelance & Agency OS: Clients, Contracts, Invoicing & CRM',
    },
    subtitle: {
      ru: 'Клиентский портал, КП, учёт времени и рентабельность проектов',
      en: 'Client portal, proposals, time tracking and project profitability',
    },
    shortDescription: {
      ru: 'Процессы фрилансера и агентства в одной системе: клиентский портал, коммерческие предложения, учёт времени, шаблоны договоров и брифы.',
      en: 'Freelancer and agency operations in one system: client portal, proposals, time tracking, contract templates and briefs.',
    },
    description: {
      ru: 'Решение для фрилансеров, студий и консалтинговых агентств. Объединяет клиентский портал в Notion, шаблоны коммерческих предложений, калькулятор рентабельности проектов в Excel, шаблоны договоров, SOW и NDA. Юридические шаблоны — отправная точка: адаптируйте их под вашу юрисдикцию вместе с юристом.',
      en: 'For freelancers, studios and consultancies. Combines a Notion client portal, proposal templates, an Excel project profitability calculator and contract, SOW and NDA templates. The legal templates are a starting point — adapt them to your jurisdiction with a lawyer.',
    },
    categoryId: 'crm',
    secondaryCategoryIds: ['notion-crm', 'operations'],
    goals: ['run-agency', 'improve-sales', 'organize-operations'],
    tags: ['Agency', 'Freelance', 'CRM', 'Proposals', 'Contracts', 'Notion'],
    formats: ['notion', 'excel', 'word', 'pdf'],
    software: ['Notion', 'Microsoft Excel', 'Microsoft Word'],
    audience: {
      ru: ['Фрилансеры и независимые специалисты', 'Дизайн- и digital-студии', 'Консалтинговые агентства'],
      en: ['Freelancers and independent specialists', 'Design and digital studios', 'Consultancies'],
    },
    useCases: {
      ru: ['Ведение клиентов и проектов в одном месте', 'Подготовка коммерческих предложений', 'Расчёт ставки и рентабельности'],
      en: ['Managing clients and projects in one place', 'Preparing proposals', 'Calculating rates and profitability'],
    },
    features: {
      ru: [
        'Клиентский портал в Notion, которым можно поделиться по ссылке',
        'Шаблоны коммерческих предложений и Scope of Work',
        'Шаблоны договоров, актов и NDA',
        'Калькулятор почасовой ставки и рентабельности проектов',
      ],
      en: [
        'Shareable Notion client portal',
        'Proposal and scope of work templates',
        'Contract, statement of work and NDA templates',
        'Hourly rate and project profitability calculator',
      ],
    },
    includedItems: {
      ru: [
        'Ссылка на дублирование рабочего пространства Notion',
        'Шаблоны договоров и актов (Word и PDF)',
        'Калькулятор рентабельности проектов (.xlsx)',
        'Шаблоны брифов для клиентов (PDF)',
      ],
      en: [
        'Notion workspace duplicate link',
        'Contract and statement of work templates (Word & PDF)',
        'Project profitability calculator (.xlsx)',
        'Client intake brief templates (PDF)',
      ],
    },
    requirements: {
      ru: ['Аккаунт Notion', 'Microsoft Excel и Word (или совместимые редакторы)'],
      en: ['A Notion account', 'Microsoft Excel and Word (or compatible editors)'],
    },
    specs: [
      { label: { ru: 'Шаблоны и базы', en: 'Templates & databases' }, value: { ru: '22', en: '22' } },
    ],
    faq: [notionDuplicateFaq],
    price: { amount: 1890, currency: 'RUB' },
    license: 'commercial',
    delivery: 'download-and-link',
    version: '3.2',
    lastUpdated: '2025-02-01',
    fileSize: '19.8 MB',
    isFeatured: false,
    sortOrder: 8,
  }),
];
