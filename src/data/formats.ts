import type { FormatId } from '../types/index.ts';

export type FormatKind = 'spreadsheet' | 'workspace' | 'slides' | 'document' | 'design' | 'code' | 'asset' | 'archive';

export interface FormatDefinition {
  id: FormatId;
  /** Product/brand names are not translated. */
  label: string;
  /** Typographic monogram used instead of emoji or third-party logos. */
  mark: string;
  kind: FormatKind;
}

export const FORMATS: Record<FormatId, FormatDefinition> = {
  excel: { id: 'excel', label: 'Microsoft Excel', mark: 'XLSX', kind: 'spreadsheet' },
  'google-sheets': { id: 'google-sheets', label: 'Google Sheets', mark: 'GSHT', kind: 'spreadsheet' },
  notion: { id: 'notion', label: 'Notion', mark: 'NTN', kind: 'workspace' },
  powerpoint: { id: 'powerpoint', label: 'PowerPoint', mark: 'PPTX', kind: 'slides' },
  keynote: { id: 'keynote', label: 'Keynote', mark: 'KEY', kind: 'slides' },
  'google-slides': { id: 'google-slides', label: 'Google Slides', mark: 'GSLD', kind: 'slides' },
  pdf: { id: 'pdf', label: 'PDF', mark: 'PDF', kind: 'document' },
  word: { id: 'word', label: 'Microsoft Word', mark: 'DOCX', kind: 'document' },
  figma: { id: 'figma', label: 'Figma', mark: 'FIG', kind: 'design' },
  react: { id: 'react', label: 'React', mark: 'RCT', kind: 'code' },
  nextjs: { id: 'nextjs', label: 'Next.js', mark: 'NXT', kind: 'code' },
  tailwind: { id: 'tailwind', label: 'Tailwind CSS', mark: 'TW', kind: 'code' },
  'html-css': { id: 'html-css', label: 'HTML / CSS', mark: 'HTML', kind: 'code' },
  '3d': { id: '3d', label: '3D', mark: '3D', kind: 'asset' },
  zip: { id: 'zip', label: 'ZIP', mark: 'ZIP', kind: 'archive' },
};

export const FORMAT_IDS = Object.keys(FORMATS) as FormatId[];

export function isFormatId(value: string): value is FormatId {
  return Object.hasOwn(FORMATS, value);
}
