import type { LocalizedList, LocalizedText } from '../i18n/config.ts';
import type { LicenseTier } from '../types/index.ts';

export interface LicenseDefinition {
  id: LicenseTier;
  name: LocalizedText;
  summary: LocalizedText;
  allowed: LocalizedList;
  notAllowed: LocalizedList;
}

/**
 * Plain-language license tiers. The authoritative wording lives on /licenses;
 * each product references exactly one tier.
 */
export const LICENSES: Record<LicenseTier, LicenseDefinition> = {
  personal: {
    id: 'personal',
    name: { ru: 'Персональная', en: 'Personal' },
    summary: {
      ru: 'Для одного человека и некоммерческих проектов.',
      en: 'For one person and non-commercial projects.',
    },
    allowed: {
      ru: ['Использование одним человеком', 'Личные и учебные проекты', 'Изменение файлов под свои задачи'],
      en: ['Use by one individual', 'Personal and learning projects', 'Modifying the files for your own needs'],
    },
    notAllowed: {
      ru: ['Коммерческое использование', 'Передача, перепродажа или публикация исходных файлов'],
      en: ['Commercial use', 'Sharing, reselling or publishing the source files'],
    },
  },
  commercial: {
    id: 'commercial',
    name: { ru: 'Коммерческая', en: 'Commercial' },
    summary: {
      ru: 'Для одного пользователя: работа в своём бизнесе и в проектах для клиентов.',
      en: 'For one user: use in your own business and in client projects.',
    },
    allowed: {
      ru: [
        'Использование одним пользователем',
        'Работа в собственном бизнесе',
        'Использование в проектах для клиентов',
        'Изменение и адаптация файлов',
      ],
      en: [
        'Use by one user',
        'Use in your own business',
        'Use in work delivered to clients',
        'Modifying and adapting the files',
      ],
    },
    notAllowed: {
      ru: [
        'Перепродажа или бесплатная раздача исходных файлов, в том числе изменённых',
        'Публикация шаблона как самостоятельного продукта',
        'Передача доступа другим людям вне лицензии',
      ],
      en: [
        'Reselling or giving away the source files, including modified versions',
        'Publishing the template as a standalone product',
        'Sharing access with people outside the license',
      ],
    },
  },
  team: {
    id: 'team',
    name: { ru: 'Командная', en: 'Team' },
    summary: {
      ru: 'Как коммерческая, но для одной команды внутри одной компании.',
      en: 'Like Commercial, but for one team within one company.',
    },
    allowed: {
      ru: ['Использование командой одной компании', 'Работа в бизнесе и проектах для клиентов', 'Изменение файлов'],
      en: ['Use by a team within one company', 'Use in the business and client work', 'Modifying the files'],
    },
    notAllowed: {
      ru: ['Перепродажа или раздача исходных файлов', 'Использование другими компаниями'],
      en: ['Reselling or giving away the source files', 'Use by other companies'],
    },
  },
  extended: {
    id: 'extended',
    name: { ru: 'Расширенная', en: 'Extended' },
    summary: {
      ru: 'Для конечных продуктов, которые продаются пользователям. Условия указываются в карточке товара.',
      en: 'For end products sold to users. Terms are stated on the product page.',
    },
    allowed: {
      ru: ['Использование в конечном продукте, который продаётся', 'Всё, что разрешено коммерческой лицензией'],
      en: ['Use in an end product that is sold', 'Everything allowed by the Commercial license'],
    },
    notAllowed: {
      ru: ['Перепродажа исходных файлов как самостоятельного товара'],
      en: ['Reselling the source files as a standalone item'],
    },
  },
};
