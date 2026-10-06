import { Product, PromoCode } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-saas-fin-model',
    slug: 'saas-unit-economics-financial-model',
    title: {
      ru: 'SaaS Unit-Экономика & Финансовая модель 5 лет',
      en: 'SaaS Unit Economics & 5-Year Financial Model'
    },
    shortDescription: {
      ru: 'Профессиональная финмодель для B2B/B2C SaaS: когортный анализ, LTV/CAC, Churn, P&L, Cash Flow и сценарное планирование.',
      en: 'Professional financial model for SaaS: cohort analysis, LTV/CAC, Churn, P&L, Cash Flow, and multi-scenario forecasting.'
    },
    fullDescription: {
      ru: 'Комплексный инструмент для фаундеров и финансовых директоров. Разработан на основе стандартов международных венчурных фондов (Y Combinator, a16z). Включает автоматический расчет ключевых SaaS-метрик (MRR, ARR, Net Retention Rate, Payback Period), прогноз денежных потоков на 60 месяцев и динамические графики для питч-дека.',
      en: 'Comprehensive framework for founders and CFOs built according to tier-1 VC standards. Features automated MRR/ARR, Net Retention, Payback Period calculations, 60-month cashflow projections, and presentation-ready investor charts.'
    },
    category: 'financial-models',
    price: 3490,
    originalPrice: 7900,
    currency: '₽',
    rating: 4.96,
    reviewsCount: 148,
    badge: {
      ru: 'Хит продаж',
      en: 'Bestseller'
    },
    tags: ['Excel', 'Google Sheets', 'SaaS', 'VC Ready', 'LTV/CAC'],
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    fileDetails: {
      format: 'Excel (.xlsx)',
      size: '8.4 MB',
      pagesOrSheets: '14 вкладок формул',
      version: 'v4.2 (2025 Edition)',
      lastUpdated: 'Январь 2025'
    },
    features: {
      ru: [
        'Автоматический расчет CAC, LTV, Churn Rate и когортного удержания',
        '3 сценария роста: Консервативный, Базовый, Агрессивный',
        'Интеграция с Google Таблицами в 1 клик',
        'Готовый дашборд для отправки инвесторам и бизнес-ангелам',
        'Видео-инструкция по заполнению за 25 минут'
      ],
      en: [
        'Automated calculation of CAC, LTV, Churn, and cohort retention',
        '3 dynamic growth scenarios: Conservative, Base, Aggressive',
        '1-click Google Sheets import and live synchronization',
        'Investor-ready executive dashboard for pitch decks',
        '25-minute comprehensive video onboarding guide'
      ]
    },
    includedFiles: {
      ru: [
        'SaaS_Financial_Model_v4.2.xlsx (Формулы и макросы)',
        'Google_Sheets_Access_Link.pdf (Ссылка на копирование в облако)',
        'Investor_KPI_Dashboard_Template.xlsx',
        'Step-by-Step_Guide_Founder_Edition.pdf (28 стр.)'
      ],
      en: [
        'SaaS_Financial_Model_v4.2.xlsx (Complete formulas)',
        'Google_Sheets_Cloud_Clone_Link.pdf',
        'Investor_KPI_Dashboard_Template.xlsx',
        'Step-by-Step_Guide_Founder_Edition.pdf (28 pages)'
      ]
    },
    notionDemoUrl: 'https://demo.notion.site/saas-fin-model-preview',
    sampleFileName: 'NovaBiz_SaaS_Financial_Model_2025.zip',
    reviews: [
      {
        id: 'rev-1',
        author: 'Михаил Резников',
        role: 'CEO & Founder',
        company: 'CloudPulse B2B',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        rating: 5,
        date: '14 февраля 2025',
        comment: 'С этой финмоделью мы подняли Seed-раунд на $300k. Фонды особенно оценили когортный анализ и прозрачную логику unit-экономики. Сэкономили недели работы финансового консультанта.',
        verified: true
      },
      {
        id: 'rev-2',
        author: 'Анна Воропаева',
        role: 'CFO',
        company: 'FinTrack',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces',
        rating: 5,
        date: '28 января 2025',
        comment: 'Всё аккуратно рассортировано по вкладкам, формулы защищены от случайной поломки, дизайн таблиц просто эстетическое удовольствие. Однозначный мастхэв.',
        verified: true
      }
    ]
  },
  {
    id: 'prod-startup-os-notion',
    slug: 'ultimate-startup-os-notion',
    title: {
      ru: 'Ultimate Startup OS 2025 (Notion Workspace)',
      en: 'Ultimate Startup OS 2025 (Notion Workspace)'
    },
    shortDescription: {
      ru: 'Всеобъемлющая операционная система для компании в Notion: CRM, база знаний, OKR, спринты, финансы и онбординг команды.',
      en: 'All-in-one Notion operating system for your company: CRM, Company Wiki, OKRs, Agile sprints, payroll, and team onboarding.'
    },
    fullDescription: {
      ru: 'Замените 10 разрозненных SaaS-сервисов одним идеально настроенным рабочим пространством Notion. Включает 24 связанных базы данных: управление задачами по Scrum/Kanban, карточки клиентов и пайплайн B2B-сделок, стратегические цели по системе OKR, базу знаний компании с матрицей доступов и дашборд руководителя.',
      en: 'Replace 10 fragmented software tools with a single, perfectly orchestrated Notion workspace. Includes 24 interconnected relational databases: Scrum/Kanban project management, B2B deal pipeline CRM, quarterly OKRs, company wiki with access permissions, and CEO cockpit.'
    },
    category: 'notion-templates',
    price: 2990,
    originalPrice: 6500,
    currency: '₽',
    rating: 4.98,
    reviewsCount: 312,
    badge: {
      ru: 'Выбор экспертов',
      en: 'Staff Pick'
    },
    tags: ['Notion', 'Startup OS', 'CRM', 'OKRs', 'Team Workspace'],
    gradient: 'from-purple-600 via-pink-600 to-rose-500',
    fileDetails: {
      format: 'Notion',
      size: '24 Базы данных',
      pagesOrSheets: '45+ страниц и шаблонов',
      version: 'v5.0 (Notion 2.40+ Ready)',
      lastUpdated: 'Февраль 2025'
    },
    features: {
      ru: [
        'Единый дашборд основателя с обзором выручки, спринтов и метрик',
        'B2B CRM с авто-статусами, расчетом вероятности и контактами',
        'Система OKR с автоматическим прогресс-баром по ключевым результатам',
        'База регламентов, SOP и онбординга новых сотрудников',
        'Мгновенное дублирование в личный или командный Notion аккаунт'
      ],
      en: [
        'Executive CEO cockpit with high-level revenue and project tracking',
        'Relational B2B CRM with lead scoring and pipeline management',
        'Quarterly OKR tracker with automated progress bars and weights',
        'Complete Standard Operating Procedures (SOP) & onboarding hub',
        '1-click instant duplicate to your personal or team Notion'
      ]
    },
    includedFiles: {
      ru: [
        'Официальная ссылка на дублирование шаблона Notion OS 2025',
        'Видео-руководство по кастомизации под ваш бизнес (40 мин)',
        'Гайд по внедрению регламентов в команду (PDF)',
        'Коллекция иконок и баннеров в стиле Minimalist Dark'
      ],
      en: [
        'Official 1-click duplicate link for Notion Startup OS 2025',
        'Workspace customization walkthrough video (40 mins)',
        'Team onboarding & SOP implementation guide (PDF)',
        'Minimalist dark icons & header covers asset pack'
      ]
    },
    notionDemoUrl: 'https://demo.notion.site/startup-os-workspace-preview',
    sampleFileName: 'NovaBiz_Startup_OS_Notion_Duplicate_Pack.zip',
    reviews: [
      {
        id: 'rev-3',
        author: 'Артем Дронов',
        role: 'Co-Founder & COO',
        company: 'Veloce Media',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
        rating: 5,
        date: '5 марта 2025',
        comment: 'Перевели всю команду из 16 человек из Asana и Trello в этот шаблон. Скорость координации выросла в разы, теперь каждый видит свои OKR и задачи.',
        verified: true
      }
    ]
  },
  {
    id: 'prod-cold-outreach-pack',
    slug: 'b2b-cold-outreach-email-playbook',
    title: {
      ru: 'B2B Cold Outreach & Account-Based Marketing System',
      en: 'B2B Cold Outreach & ABM Playbook Pack'
    },
    shortDescription: {
      ru: '45 протестированных цепочек холодных email-писем для B2B, скрипты для LinkedIn, чек-листы по прогреву доменов и CRM лидогенерации.',
      en: '45 battle-tested B2B cold email sequences, LinkedIn outreach scripts, domain deliverability setup, and Notion prospecting CRM.'
    },
    fullDescription: {
      ru: 'Готовая система лидогенерации с открываемостью писем (Open Rate) до 78% и конверсией в демо-звонки 14%. Включает реальные шаблоны писем, которые принесли контракты в Enterprise и SMB, инструкции по обходу спам-фильтров (SPF, DKIM, DMARC), чек-лист копирайтинга и систему трекинга лидов.',
      en: 'Turn-key outbound pipeline generating up to 78% open rates and 14% demo booking conversion. Includes exact email scripts that closed deals in enterprise and tech SMBs, technical deliverability walkthrough, and prospecting tracking framework.'
    },
    category: 'checklists-guides',
    price: 1990,
    originalPrice: 4200,
    currency: '₽',
    rating: 4.92,
    reviewsCount: 89,
    badge: {
      ru: '+45 скриптов',
      en: '45+ Scripts'
    },
    tags: ['B2B Sales', 'Cold Outreach', 'Email Scripts', 'Notion', 'PDF Guide'],
    gradient: 'from-amber-500 via-orange-600 to-red-500',
    fileDetails: {
      format: 'PDF & Notion',
      size: '14.2 MB',
      pagesOrSheets: '84 страницы + Notion CRM',
      version: 'v3.1 (2025 Update)',
      lastUpdated: 'Январь 2025'
    },
    features: {
      ru: [
        '45 пошаговых сценариев холодных писем для разных сегментов',
        'Скрипты первого контакта и фоллоу-апов в LinkedIn',
        'Технический чек-лист настройки почты (без попадания в спам)',
        'Промпты для ChatGPT/Claude для гипер-персонализации писем'
      ],
      en: [
        '45 multi-step cold outreach cadences for various B2B niches',
        'LinkedIn connection request & follow-up message scripts',
        'Domain warm-up & SPF/DKIM/DMARC technical deliverability guide',
        'AI prompt pack for mass personalization via LLMs'
      ]
    },
    includedFiles: {
      ru: [
        'B2B_Outreach_Master_Playbook.pdf (84 стр.)',
        'Cold_Email_Sequences_Copy_Paste_Book.pdf',
        'Outreach_Lead_Tracker_Database (Notion ссылка)',
        'Email_Deliverability_Audit_Checklist.xlsx'
      ],
      en: [
        'B2B_Outreach_Master_Playbook.pdf (84 pages)',
        'Cold_Email_Sequences_Copy_Paste_Book.pdf',
        'Outreach_Lead_Tracker_Database (Notion link)',
        'Email_Deliverability_Audit_Checklist.xlsx'
      ]
    },
    sampleFileName: 'NovaBiz_B2B_Outreach_System_2025.zip',
    reviews: [
      {
        id: 'rev-4',
        author: 'Олег Самойлов',
        role: 'Head of Growth',
        company: 'LeadGenX',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
        rating: 5,
        date: '21 января 2025',
        comment: 'Взяли 3 скрипта из раздела Enterprise, адаптировали под наш продукт — за первую же неделю назначили 11 квалифицированных созвонов. Окупилось в первые 3 часа.',
        verified: true
      }
    ]
  },
  {
    id: 'prod-ecom-calculator',
    slug: 'ecommerce-pnl-cashflow-unit-economics',
    title: {
      ru: 'E-Commerce & Маркетплейсы: Финмодель, P&L и ДДС',
      en: 'E-Commerce & Marketplaces: Unit Economics & Cashflow'
    },
    shortDescription: {
      ru: 'Автоматизированная таблица Excel для расчетов на Wildberries, Ozon, Яндекс.Маркет и собственного интернет-магазина. Учет комиссий, логистики, рекламы и возвратов.',
      en: 'Automated Excel accounting model for e-commerce stores and marketplaces: commission fees, fulfillment, marketing ROI, returns and cashflow.'
    },
    fullDescription: {
      ru: 'Спасение для селлеров и директоров e-commerce. Рассчитывает реальную чистую прибыль с учетом скрытых расходов маркетплейсов, комиссий за эквайринг, логистику, хранение и долю выкупа. Включает ABC/XYZ-анализ ассортимента и калькулятор точки безубыточности для запуска новых товаров.',
      en: 'Essential tool for DTC brands and marketplace sellers. Accurately calculates real bottom-line net profit after storage, fulfillment, marketing ROAS, commissions, and returns. Includes full ABC/XYZ product inventory matrix and break-even calculator.'
    },
    category: 'excel-sheets',
    price: 2490,
    originalPrice: 5500,
    currency: '₽',
    rating: 4.95,
    reviewsCount: 164,
    badge: {
      ru: 'Обновлено',
      en: 'Updated'
    },
    tags: ['Excel', 'Wildberries', 'Ozon', 'P&L', 'Unit Economics', 'E-Commerce'],
    gradient: 'from-emerald-500 via-teal-600 to-cyan-600',
    fileDetails: {
      format: 'Excel (.xlsx)',
      size: '6.7 MB',
      pagesOrSheets: '11 взаимосвязанных вкладок',
      version: 'v3.8 (WB/Ozon 2025 Тарифы)',
      lastUpdated: 'Февраль 2025'
    },
    features: {
      ru: [
        'Калькулятор юнит-экономики каждого SKU с учетом процента выкупа',
        'Управленческий отчет P&L (прибыли и убытки) и Cash Flow (ДДС)',
        'Автоматический ABC/XYZ анализ прибыльности товарной матрицы',
        'Расчет безопасного рекламного бюджета на основе маржинальности'
      ],
      en: [
        'Per-SKU unit margin calculator with fulfillment and return rates',
        'Integrated Executive P&L statement and dynamic Cash Flow budget',
        'Automated ABC/XYZ product inventory profitability sorting',
        'Maximum safe ad spend (ROAS) threshold calculator'
      ]
    },
    includedFiles: {
      ru: [
        'Ecom_Marketplaces_UnitEconomics_v3.8.xlsx',
        'Google_Sheets_Cloud_Version.pdf (прямая ссылка)',
        'Video_Instruction_Calculation_Manual.mp4 (ссылка)',
        'Таблица_Тарифов_и_Комиссий_2025.xlsx'
      ],
      en: [
        'Ecom_Marketplaces_UnitEconomics_v3.8.xlsx',
        'Google_Sheets_Cloud_Version.pdf',
        'Video_Instruction_Calculation_Manual (link)',
        'Fee_Structures_and_Commissions_Matrix.xlsx'
      ]
    },
    sampleFileName: 'NovaBiz_ECommerce_Financial_Mastery.zip',
    reviews: [
      {
        id: 'rev-5',
        author: 'Елена Кузнецова',
        role: 'Founder',
        company: 'Nordic Home Shop',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
        rating: 5,
        date: '19 февраля 2025',
        comment: 'Наконец-то увидела, какие товары генерировали минус из-за дорогой логистики и низкого процента выкупа. Перестроила ассортимент и подняла маржинальность на 8.4%.',
        verified: true
      }
    ]
  },
  {
    id: 'prod-cpo-product-playbook',
    slug: 'product-manager-cpo-playbook-notion',
    title: {
      ru: 'CPO & Product Manager Playbook (Notion + PDF)',
      en: 'CPO & Senior Product Manager Playbook'
    },
    shortDescription: {
      ru: 'Полный инструментарий продакт-менеджера: шаблоны PRD, Customer Development интервью, North Star Metric дерево и фреймворки приоритезации (RICE, ICE, Kano).',
      en: 'Ultimate product manager suite: battle-tested PRD templates, CustDev interview guides, North Star Metric tree, and prioritization scorecards.'
    },
    fullDescription: {
      ru: 'Практическая библиотека артефактов для управления цифровыми продуктами. Содержит проверенные шаблоны документации, гайды интервью для проверки гипотез ценности, интерактивные калькуляторы приоритизации фичей и карту метрик для продуктовых команд любого масштаба.',
      en: 'Battle-tested repository of product management artifacts. Includes BigTech-grade PRD specifications, customer discovery interview scripts, automated hypothesis prioritization scoring models, and North Star metric frameworks.'
    },
    category: 'notion-templates',
    price: 2790,
    originalPrice: 5900,
    currency: '₽',
    rating: 4.97,
    reviewsCount: 112,
    badge: {
      ru: 'PRO Уровень',
      en: 'PRO Level'
    },
    tags: ['Notion', 'Product Management', 'PRD', 'CustDev', 'RICE Score'],
    gradient: 'from-violet-600 via-indigo-600 to-purple-800',
    fileDetails: {
      format: 'Notion',
      size: '18 Баз данных',
      pagesOrSheets: '35 готовых шаблонов',
      version: 'v4.0 (2025 Edition)',
      lastUpdated: 'Январь 2025'
    },
    features: {
      ru: [
        'Шаблоны PRD (Product Requirements Document) уровня BigTech компаний',
        'Скрипты и трекер качественных интервью CustDev с клиентами',
        'Автоматический калькулятор скоринга гипотез RICE & ICE',
        'Интерактивное дерево метрик North Star Metric (NSM)'
      ],
      en: [
        'BigTech-grade Product Requirement Document (PRD) templates',
        'Customer Discovery / CustDev interview scripts & insights tracker',
        'Automated RICE, ICE, and Kano hypothesis prioritization calculator',
        'Visual interactive North Star Metric hierarchy tree'
      ]
    },
    includedFiles: {
      ru: [
        'Notion_CPO_Playbook_Duplicate_Workspace',
        'CustDev_Interview_Questions_Handbook.pdf (42 стр.)',
        'Product_Discovery_Cheat_Sheets.pdf',
        'Figma_UserFlow_Design_Kit_Tokens.pdf'
      ],
      en: [
        'Notion_CPO_Playbook_Duplicate_Workspace',
        'CustDev_Interview_Questions_Handbook.pdf (42 pages)',
        'Product_Discovery_Cheat_Sheets.pdf',
        'Figma_UserFlow_Design_Kit_Tokens.pdf'
      ]
    },
    sampleFileName: 'NovaBiz_CPO_Product_Playbook_2025.zip',
    reviews: [
      {
        id: 'rev-6',
        author: 'Денис Марков',
        role: 'Lead PM',
        company: 'Fintech Neo',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces',
        rating: 5,
        date: '2 февраля 2025',
        comment: 'Использую в работе со своей продуктовой командой каждый день. Шаблоны PRD экономят до 8 часов на каждую фичу, разработчикам всё понятно с первого раза.',
        verified: true
      }
    ]
  },
  {
    id: 'prod-pitch-deck-kit',
    slug: 'venture-pitch-deck-kit-presentation',
    title: {
      ru: 'Venture Pitch Deck Kit & Инвестиционный Пакет',
      en: 'Venture Pitch Deck Kit & Fundraising Asset Pack'
    },
    shortDescription: {
      ru: '120+ слайдов для привлечения инвестиций в Keynote, PowerPoint и Google Slides. Структура Y Combinator и Sequoia Capital + Notion Data Room.',
      en: '120+ investor-ready presentation slides for Keynote, PowerPoint and Slides based on Sequoia & YC frameworks, plus investor Data Room in Notion.'
    },
    fullDescription: {
      ru: 'Премиальный конструктор презентаций для привлечения раундов Pre-Seed, Seed и Series A. Создан на базе визуального языка ведущих дизайн-агентств Кремниевой долины. Включает 120+ уникальных слайдов с инфографикой, структурами бизнес-моделей, графиками тяги и шаблоном Data Room в Notion.',
      en: 'High-converting fundraising presentation toolkit for Pre-Seed, Seed, and Series A rounds. Designed following tier-1 Silicon Valley agency guidelines. Features 120+ custom vector master slides, market size diagrams, unit economic models, and Notion Virtual Data Room.'
    },
    category: 'startup-os',
    price: 3890,
    originalPrice: 8900,
    currency: '₽',
    rating: 4.99,
    reviewsCount: 203,
    badge: {
      ru: 'ТОП для инвестиций',
      en: 'Top Pitch Pack'
    },
    tags: ['Keynote', 'PowerPoint', 'Pitch Deck', 'Fundraising', 'Notion Data Room'],
    gradient: 'from-amber-600 via-rose-600 to-pink-600',
    fileDetails: {
      format: 'PowerPoint + Notion',
      size: '142 MB',
      pagesOrSheets: '120+ уникальных слайдов',
      version: 'v4.5 (Vector 4K)',
      lastUpdated: 'Февраль 2025'
    },
    features: {
      ru: [
        '120+ выверенных слайдов в темной и светлой премиальной теме',
        'Шаблоны слайдов: Проблема, Решение, Рынок TAM/SAM/SOM, Бизнес-модель, Команда',
        'Готовый Notion Virtual Data Room для передачи инвесторам под NDA',
        'Гайд по питчингу и ответам на каверзные вопросы инвесторов'
      ],
      en: [
        '120+ master slides in both executive dark and clean light themes',
        'Standardized slide structures: Problem, Solution, TAM/SAM/SOM, Team, Traction',
        'Investor Virtual Data Room (VDR) Notion template with NDA disclaimer',
        'Fundraising playbook: handling tricky angel & VC partner objections'
      ]
    },
    includedFiles: {
      ru: [
        'Venture_Pitch_Deck_Master_2025.pptx (PowerPoint)',
        'Venture_Pitch_Deck_Master_2025.key (Apple Keynote)',
        'Google_Slides_Cloud_Edit_Link.pdf',
        'Notion_Investor_Data_Room_Duplicate.pdf',
        'Fundraising_Prep_Checklist_Guide.pdf (32 стр.)'
      ],
      en: [
        'Venture_Pitch_Deck_Master_2025.pptx (PowerPoint)',
        'Venture_Pitch_Deck_Master_2025.key (Apple Keynote)',
        'Google_Slides_Cloud_Edit_Link.pdf',
        'Notion_Investor_Data_Room_Duplicate.pdf',
        'Fundraising_Prep_Checklist_Guide.pdf (32 pages)'
      ]
    },
    sampleFileName: 'NovaBiz_Venture_Pitch_Deck_Kit.zip',
    reviews: [
      {
        id: 'rev-7',
        author: 'Константин Белов',
        role: 'Founder',
        company: 'NeuroSense AI',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces',
        rating: 5,
        date: '10 февраля 2025',
        comment: 'Дизайн выглядит на миллион долларов. Инвесторы на демо-дне отдельно отметили качество визуализации рынка и графиков тяги. Закрыли раунд за 3 недели.',
        verified: true
      }
    ]
  },
  {
    id: 'prod-hr-team-scaling-system',
    slug: 'hr-team-scaling-onboarding-system',
    title: {
      ru: 'HR & Team Scaling System: Найм, Онбординг и Оценка',
      en: 'HR & Team Scaling System: Hiring, Onboarding & Reviews'
    },
    shortDescription: {
      ru: 'Полный пайплайн найма персонала: воронка кандидатов (ATS) в Notion, скоринг-карты собеседований, планы адаптации на 30-60-90 дней и Performance Review 360.',
      en: 'End-to-end recruitment pipeline: Notion applicant tracking system (ATS), scorecard interviews, 30-60-90 day onboarding plans, and 360 reviews.'
    },
    fullDescription: {
      ru: 'Готовая система управления персоналом для растущих технологических компаний. Помогает автоматизировать путь сотрудника: от составления профиля вакансии и проведения интервью до онбординга за первые недели и регулярной оценки результатов по методологии 360 градусов.',
      en: 'Complete talent management and team scaling operating system. Streamlines employee lifecycle: from job description drafting and unbiased scorecard interviewing to structured 30-60-90 day onboarding roadmaps and 360-degree performance evaluation cycles.'
    },
    category: 'startup-os',
    price: 2190,
    originalPrice: 4800,
    currency: '₽',
    rating: 4.91,
    reviewsCount: 76,
    tags: ['Notion', 'HR', 'Recruiting', 'Onboarding', 'Performance Review'],
    gradient: 'from-cyan-600 via-blue-600 to-indigo-700',
    fileDetails: {
      format: 'Notion',
      size: '12 Баз данных',
      pagesOrSheets: '28 готовых документов',
      version: 'v2.6',
      lastUpdated: 'Январь 2025'
    },
    features: {
      ru: [
        'Полноценная ATS-система найма для ведения кандидатов по стадиям',
        'Скоринг-кард для оценки Hard и Soft skills без предвзятости',
        'Интерактивный чеклист онбординга новичка с авто-напоминаниями',
        'Форма и методология проведения оценки Performance Review 360°'
      ],
      en: [
        'Full Applicant Tracking System (ATS) inside Notion with pipeline stages',
        'Objective candidate scorecard for hard and soft skill assessment',
        'Automated 30-60-90 day new hire onboarding checklists and buddy program',
        'Performance Review 360° evaluation template & feedback guidelines'
      ]
    },
    includedFiles: {
      ru: [
        'Notion_HR_Scaling_System_Duplicate_Workspace',
        'Job_Descriptions_50_Tech_Roles_Handbook.pdf',
        'Employee_Handbook_Starter_Template.docx',
        'Interview_Scorecard_Rubric.xlsx'
      ],
      en: [
        'Notion_HR_Scaling_System_Duplicate_Workspace',
        'Job_Descriptions_50_Tech_Roles_Handbook.pdf',
        'Employee_Handbook_Starter_Template.docx',
        'Interview_Scorecard_Rubric.xlsx'
      ]
    },
    sampleFileName: 'NovaBiz_HR_Scaling_System_2025.zip',
    reviews: [
      {
        id: 'rev-8',
        author: 'Ксения Лебедева',
        role: 'HR Director',
        company: 'ScaleUp Studio',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces',
        rating: 5,
        date: '25 января 2025',
        comment: 'Внедрили для масштабирования команды с 10 до 45 человек. Время онбординга сократилось в два раза, новички выходят на продуктивность с первой недели.',
        verified: true
      }
    ]
  },
  {
    id: 'prod-freelance-agency-os',
    slug: 'freelance-agency-client-os-crm',
    title: {
      ru: 'Freelance & Agency OS: Клиенты, Договоры, Счета и CRM',
      en: 'Freelance & Agency OS: Clients, Contracts, Invoicing & CRM'
    },
    shortDescription: {
      ru: 'Все процессы агентства и фрилансера в одной системе: клиентский портал, выставление счетов, учет рабочего времени, шаблоны договоров и брифы.',
      en: 'Everything for solo specialists & digital agencies: client portal, invoice generator, time tracker, proposal decks, and contract templates.'
    },
    fullDescription: {
      ru: 'Универсальное цифровое решение для фрилансеров, студий и консалтинговых агентств. Объединяет клиентский портал в Notion, генератор коммерческих предложений, калькулятор рентабельности проектов в Excel и юридически проверенные шаблоны договоров и NDA.',
      en: 'All-inclusive management cockpit for independent experts, studios, and agencies. Combines client portal in Notion, high-converting proposal builders, project profitability calculators in Excel, and verified legal agreements with mutual NDAs.'
    },
    category: 'excel-sheets',
    price: 1890,
    originalPrice: 3900,
    currency: '₽',
    rating: 4.94,
    reviewsCount: 142,
    badge: {
      ru: 'Для экспертов',
      en: 'For Experts'
    },
    tags: ['Notion', 'Excel', 'CRM', 'Agency', 'Freelance OS', 'Contracts'],
    gradient: 'from-emerald-600 via-teal-600 to-blue-600',
    fileDetails: {
      format: 'PDF & Notion',
      size: '19.8 MB',
      pagesOrSheets: '22 шаблона и базы',
      version: 'v3.2',
      lastUpdated: 'Февраль 2025'
    },
    features: {
      ru: [
        'Клиентский портал (Client Portal), которым можно делиться по ссылке',
        'Автоматический генератор коммерческих предложений (КП)',
        'Юридически выверенные шаблоны договоров (РФ и международные NDA/SOW)',
        'Калькулятор почасовой ставки и рентабельности проектов'
      ],
      en: [
        'Shareable Notion Client Portal for real-time project transparency',
        'High-converting Proposal & Scope of Work (SOW) builders',
        'Lawyer-reviewed client contract and mutual NDA templates',
        'Hourly rate & project profitability forecasting spreadsheet'
      ]
    },
    includedFiles: {
      ru: [
        'Notion_Freelance_Agency_OS_Workspace',
        'Шаблоны_Договоров_и_Актов_2025 (Word & PDF)',
        'Project_Profitability_Calculator.xlsx',
        'Client_Intake_Brief_Templates.pdf'
      ],
      en: [
        'Notion_Freelance_Agency_OS_Workspace',
        'Contract_and_Statement_of_Work_Templates (Word & PDF)',
        'Project_Profitability_Calculator.xlsx',
        'Client_Intake_Brief_Templates.pdf'
      ]
    },
    sampleFileName: 'NovaBiz_Agency_Freelance_OS_2025.zip',
    reviews: [
      {
        id: 'rev-9',
        author: 'Сергей Поляков',
        role: 'Design Agency Lead',
        company: 'PolyDesign',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
        rating: 5,
        date: '17 февраля 2025',
        comment: 'Клиентский портал производит вау-эффект на заказчиков. Закрываем чеки от $2k без долгих согласований, потому что всё прозрачно и супер-профессионально.',
        verified: true
      }
    ]
  }
];

export const PROMO_CODES: PromoCode[] = [
  {
    code: 'START2025',
    discountPercent: 20,
    description: {
      ru: 'Скидка 20% на первый заказ для новых пользователей',
      en: '20% off your first order for new customers'
    }
  },
  {
    code: 'BIZVIP',
    discountPercent: 30,
    description: {
      ru: 'Скидка 30% на заказы от 5 000 ₽',
      en: '30% VIP discount on orders above 5,000 ₽'
    },
    minAmount: 5000
  },
  {
    code: 'FREEDEMO',
    discountPercent: 100,
    description: {
      ru: '100% тест-драйв: мгновенная бесплатная проверка автовыдачи',
      en: '100% free test drive: instant zero-cost auto-delivery demo'
    }
  }
];
