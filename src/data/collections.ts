import type { Collection } from '../types/index.ts';

/** Curated collections. Static fallback and seed for the `collections` table. */
export const COLLECTIONS: Collection[] = [
  {
    id: 'b1000000-0000-4000-8000-000000000001',
    slug: 'founder-toolkit',
    title: { ru: 'Набор основателя', en: 'Founder Toolkit' },
    description: {
      ru: 'Операционная система компании, финансовая модель, питч-дек и найм — базовый комплект для первого года.',
      en: 'A company operating system, a financial model, a pitch deck and hiring — the core kit for year one.',
    },
    productIds: [
      'a1000000-0000-4000-8000-000000000002',
      'a1000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000006',
      'a1000000-0000-4000-8000-000000000007',
    ],
    featuredProductId: 'a1000000-0000-4000-8000-000000000002',
    sortOrder: 1,
  },
  {
    id: 'b1000000-0000-4000-8000-000000000002',
    slug: 'numbers-and-finance',
    title: { ru: 'Цифры и финансы', en: 'Numbers & Finance' },
    description: {
      ru: 'Модели для тех, кто принимает решения на основе юнит-экономики и денежного потока.',
      en: 'Models for people who make decisions on unit economics and cash flow.',
    },
    productIds: ['a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004'],
    featuredProductId: 'a1000000-0000-4000-8000-000000000001',
    sortOrder: 2,
  },
  {
    id: 'b1000000-0000-4000-8000-000000000003',
    slug: 'agency-system',
    title: { ru: 'Система агентства', en: 'Agency System' },
    description: {
      ru: 'Привлечение клиентов и работа с ними: аутрич, предложения, договоры и рентабельность.',
      en: 'Winning and serving clients: outreach, proposals, contracts and profitability.',
    },
    productIds: ['a1000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000003'],
    featuredProductId: 'a1000000-0000-4000-8000-000000000008',
    sortOrder: 3,
  },
  {
    id: 'b1000000-0000-4000-8000-000000000004',
    slug: 'product-builder',
    title: { ru: 'Продуктовая команда', en: 'Product Builder' },
    description: {
      ru: 'Документация, исследования и метрики для команд, которые строят продукт.',
      en: 'Documentation, research and metrics for teams building a product.',
    },
    productIds: [
      'a1000000-0000-4000-8000-000000000005',
      'a1000000-0000-4000-8000-000000000002',
      'a1000000-0000-4000-8000-000000000001',
    ],
    featuredProductId: 'a1000000-0000-4000-8000-000000000005',
    sortOrder: 4,
  },
];
