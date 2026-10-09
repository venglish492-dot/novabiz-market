import type { Category } from '../types/index.ts';

/**
 * Category taxonomy. This is the static fallback and the seed source for the
 * `categories` table; once Supabase is configured the database controls it.
 */
type Seed = Omit<Category, 'sortOrder' | 'description'> & { description?: Category['description'] };

const empty = { ru: '', en: '' };

const roots: Seed[] = [
  {
    id: 'spreadsheets',
    slug: 'spreadsheets',
    parentId: null,
    tone: 'data',
    name: { ru: 'Таблицы', en: 'Spreadsheets' },
    description: {
      ru: 'Финансовые модели, юнит-экономика и прогнозы в Excel и Google Sheets.',
      en: 'Financial models, unit economics and forecasts for Excel and Google Sheets.',
    },
  },
  {
    id: 'notion',
    slug: 'notion',
    parentId: null,
    tone: 'notion',
    name: { ru: 'Notion', en: 'Notion' },
    description: {
      ru: 'Готовые рабочие пространства: операционные системы компании, CRM и управление проектами.',
      en: 'Ready-made workspaces: company operating systems, CRM and project management.',
    },
  },
  {
    id: 'business',
    slug: 'business',
    parentId: null,
    tone: 'business',
    name: { ru: 'Бизнес', en: 'Business' },
    description: {
      ru: 'Системы для запуска, финансов, клиентов и операционной работы.',
      en: 'Systems for launching, finance, clients and day-to-day operations.',
    },
  },
  {
    id: 'marketing',
    slug: 'marketing',
    parentId: null,
    tone: 'marketing',
    name: { ru: 'Маркетинг и продажи', en: 'Marketing & Sales' },
    description: {
      ru: 'Плейбуки для аутрича, продаж, кампаний и текстов.',
      en: 'Playbooks for outreach, sales, campaigns and copywriting.',
    },
  },
  {
    id: 'product',
    slug: 'product',
    parentId: null,
    tone: 'product',
    name: { ru: 'Продукт', en: 'Product' },
    description: {
      ru: 'PRD, исследования, стратегия и роадмапы для продуктовых команд.',
      en: 'PRDs, research, strategy and roadmaps for product teams.',
    },
  },
  {
    id: 'presentations',
    slug: 'presentations',
    parentId: null,
    tone: 'slides',
    name: { ru: 'Презентации', en: 'Presentations' },
    description: {
      ru: 'Редактируемые шаблоны презентаций для PowerPoint, Keynote и Google Slides.',
      en: 'Editable presentation templates for PowerPoint, Keynote and Google Slides.',
    },
  },
  {
    id: 'ui-ux',
    slug: 'ui-ux',
    parentId: null,
    tone: 'design',
    name: { ru: 'UI/UX', en: 'UI/UX' },
    description: {
      ru: 'UI-киты, дизайн-системы и компоненты для Figma.',
      en: 'UI kits, design systems and components for Figma.',
    },
  },
  {
    id: 'development',
    slug: 'development',
    parentId: null,
    tone: 'development',
    name: { ru: 'Разработка', en: 'Development' },
    description: {
      ru: 'Бойлерплейты и наборы для React, Next.js и Tailwind.',
      en: 'Boilerplates and kits for React, Next.js and Tailwind.',
    },
  },
  {
    id: 'ai',
    slug: 'ai',
    parentId: null,
    tone: 'ai',
    name: { ru: 'AI', en: 'AI' },
    description: {
      ru: 'Промпты, AI-воркфлоу и шаблоны для работы с моделями.',
      en: 'Prompts, AI workflows and templates for working with models.',
    },
  },
  {
    id: 'assets',
    slug: 'assets',
    parentId: null,
    tone: 'assets',
    name: { ru: 'Ассеты', en: 'Assets' },
    description: {
      ru: 'Иконки, иллюстрации, 3D и графика.',
      en: 'Icons, illustrations, 3D and graphics.',
    },
  },
];

const children: Array<[parent: string, id: string, ru: string, en: string]> = [
  ['spreadsheets', 'financial-models', 'Финансовые модели', 'Financial Models'],
  ['spreadsheets', 'unit-economics', 'Юнит-экономика', 'Unit Economics'],
  ['spreadsheets', 'forecasting', 'Прогнозирование', 'Forecasting'],
  ['spreadsheets', 'analytics', 'Аналитика', 'Analytics'],

  ['notion', 'startup-os', 'Startup OS', 'Startup OS'],
  ['notion', 'notion-crm', 'CRM в Notion', 'Notion CRM'],
  ['notion', 'productivity', 'Продуктивность', 'Productivity'],
  ['notion', 'project-management', 'Управление проектами', 'Project Management'],

  ['business', 'startup-systems', 'Системы для стартапов', 'Startup Systems'],
  ['business', 'crm', 'CRM и клиенты', 'CRM & Clients'],
  ['business', 'finance', 'Финансы', 'Finance'],
  ['business', 'operations', 'Операционная работа', 'Operations'],

  ['marketing', 'outreach', 'Аутрич', 'Outreach'],
  ['marketing', 'sales', 'Продажи', 'Sales'],
  ['marketing', 'campaigns', 'Кампании', 'Campaigns'],
  ['marketing', 'copywriting', 'Копирайтинг', 'Copywriting'],

  ['product', 'prd', 'PRD и спецификации', 'PRDs & Specs'],
  ['product', 'research', 'Исследования', 'Research'],
  ['product', 'strategy', 'Стратегия', 'Strategy'],
  ['product', 'roadmaps', 'Роадмапы', 'Roadmaps'],

  ['presentations', 'pitch-decks', 'Питч-деки', 'Pitch Decks'],
  ['presentations', 'powerpoint', 'PowerPoint', 'PowerPoint'],
  ['presentations', 'keynote', 'Keynote', 'Keynote'],
  ['presentations', 'google-slides', 'Google Slides', 'Google Slides'],

  ['ui-ux', 'ui-kits', 'UI-киты', 'UI Kits'],
  ['ui-ux', 'design-systems', 'Дизайн-системы', 'Design Systems'],
  ['ui-ux', 'components', 'Компоненты', 'Components'],
  ['ui-ux', 'figma-resources', 'Ресурсы для Figma', 'Figma Resources'],

  ['development', 'react', 'React', 'React'],
  ['development', 'nextjs', 'Next.js', 'Next.js'],
  ['development', 'tailwind', 'Tailwind', 'Tailwind'],
  ['development', 'boilerplates', 'Бойлерплейты', 'Boilerplates'],
  ['development', 'developer-kits', 'Наборы разработчика', 'Developer Kits'],

  ['ai', 'prompts', 'Промпты', 'Prompts'],
  ['ai', 'ai-workflows', 'AI-воркфлоу', 'AI Workflows'],
  ['ai', 'ai-templates', 'AI-шаблоны', 'AI Templates'],
  ['ai', 'ai-tools', 'AI-инструменты', 'AI Tools'],

  ['assets', 'icons', 'Иконки', 'Icons'],
  ['assets', 'illustrations', 'Иллюстрации', 'Illustrations'],
  ['assets', '3d-assets', '3D', '3D'],
  ['assets', 'graphics', 'Графика', 'Graphics'],
];

export const CATEGORIES: Category[] = [
  ...roots.map((root, index) => ({
    ...root,
    description: root.description ?? empty,
    sortOrder: index,
  })),
  ...children.map(([parent, id, ru, en], index) => {
    const root = roots.find((r) => r.id === parent);
    if (!root) throw new Error(`Unknown parent category ${parent}`);
    return {
      id,
      slug: id,
      parentId: parent,
      tone: root.tone,
      name: { ru, en },
      description: empty,
      sortOrder: index,
    } satisfies Category;
  }),
];
