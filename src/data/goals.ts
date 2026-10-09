import type { Goal } from '../types/index.ts';

/** "Shop by goal" entries. A goal is only shown when products are tagged with it. */
export const GOALS: Goal[] = [
  {
    id: 'launch-startup',
    title: { ru: 'Запустить стартап', en: 'Launch a startup' },
    description: {
      ru: 'Операционная система, финансы и найм с первого дня.',
      en: 'Operating system, finance and hiring from day one.',
    },
  },
  {
    id: 'prepare-investors',
    title: { ru: 'Подготовиться к инвесторам', en: 'Prepare for investors' },
    description: {
      ru: 'Питч-дек, финансовая модель и дата-рум.',
      en: 'Pitch deck, financial model and data room.',
    },
  },
  {
    id: 'analyze-unit-economics',
    title: { ru: 'Посчитать юнит-экономику', en: 'Analyze unit economics' },
    description: {
      ru: 'LTV, CAC, маржинальность и денежный поток.',
      en: 'LTV, CAC, margins and cash flow.',
    },
  },
  {
    id: 'build-saas',
    title: { ru: 'Построить SaaS', en: 'Build a SaaS' },
    description: {
      ru: 'Метрики, продуктовая документация и процессы.',
      en: 'Metrics, product documentation and processes.',
    },
  },
  {
    id: 'build-product',
    title: { ru: 'Развивать продукт', en: 'Build a product' },
    description: {
      ru: 'PRD, интервью с клиентами и приоритизация.',
      en: 'PRDs, customer interviews and prioritization.',
    },
  },
  {
    id: 'run-agency',
    title: { ru: 'Вести агентство', en: 'Run an agency' },
    description: {
      ru: 'Клиентский портал, договоры, КП и рентабельность.',
      en: 'Client portal, contracts, proposals and profitability.',
    },
  },
  {
    id: 'improve-sales',
    title: { ru: 'Усилить продажи', en: 'Improve sales' },
    description: {
      ru: 'Аутрич, скрипты и трекинг лидов.',
      en: 'Outreach, scripts and lead tracking.',
    },
  },
  {
    id: 'manage-team',
    title: { ru: 'Управлять командой', en: 'Manage a team' },
    description: {
      ru: 'Найм, онбординг и оценка результатов.',
      en: 'Hiring, onboarding and performance reviews.',
    },
  },
  {
    id: 'organize-operations',
    title: { ru: 'Навести порядок в процессах', en: 'Organize operations' },
    description: {
      ru: 'Регламенты, база знаний и цели команды.',
      en: 'SOPs, a knowledge base and team goals.',
    },
  },
  {
    id: 'sell-on-marketplaces',
    title: { ru: 'Продавать на маркетплейсах', en: 'Sell on marketplaces' },
    description: {
      ru: 'Прибыль по SKU, комиссии, логистика и реклама.',
      en: 'Per-SKU profit, fees, fulfilment and ads.',
    },
  },
  {
    id: 'design-app',
    title: { ru: 'Спроектировать приложение', en: 'Design an app' },
    description: {
      ru: 'UI-киты и дизайн-системы.',
      en: 'UI kits and design systems.',
    },
  },
  {
    id: 'create-ai-workflows',
    title: { ru: 'Создать AI-воркфлоу', en: 'Create AI workflows' },
    description: {
      ru: 'Промпты и автоматизации на базе моделей.',
      en: 'Prompts and model-powered automations.',
    },
  },
];
