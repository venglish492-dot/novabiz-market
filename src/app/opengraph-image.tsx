import { renderOgImage, OG_SIZE } from '@/lib/seo/og';
import ru from '@/i18n/dictionaries/ru';

export const alt = 'Vektor Lab';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  return renderOgImage({
    eyebrow: ru.hero.eyebrow,
    title: `${ru.hero.titleLead} ${ru.hero.titleTail}`,
    subtitle: 'Финансовые модели · Notion · Плейбуки · Презентации',
  });
}
