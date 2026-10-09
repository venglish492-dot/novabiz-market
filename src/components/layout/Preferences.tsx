'use client';

import { useTransition } from 'react';
import { Check, Globe, Moon, Sparkles, Sun } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { LOCALES, LOCALE_LABEL, type Locale } from '@/i18n/config';
import { setLocaleAction } from '@/i18n/actions';
import { setTheme, useTheme, type ThemeMode } from '@/lib/client/theme';

export function LanguageOptions({ onDone }: { onDone?: () => void }) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  return (
    <fieldset disabled={pending} className="flex flex-col gap-0.5">
      <legend className="t-eyebrow px-3 pb-2 pt-1.5">{t.nav.language}</legend>
      {LOCALES.map((option: Locale) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          onClick={() =>
            startTransition(async () => {
              await setLocaleAction(option);
              onDone?.();
            })
          }
          className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-fg-muted hover:bg-surface-2 hover:text-fg aria-pressed:text-fg"
        >
          <span lang={option}>{LOCALE_LABEL[option]}</span>
          {locale === option && <Check className="h-4 w-4 text-accent" aria-hidden />}
        </button>
      ))}
    </fieldset>
  );
}

export function ThemeOptions() {
  const { t } = useI18n();
  const theme = useTheme();
  const options: Array<{ id: ThemeMode; label: string; icon: React.ReactNode }> = [
    { id: 'dark', label: t.nav.themeDark, icon: <Moon className="h-4 w-4" aria-hidden /> },
    { id: 'light', label: t.nav.themeLight, icon: <Sun className="h-4 w-4" aria-hidden /> },
    { id: 'neon', label: t.nav.themeNeon, icon: <Sparkles className="h-4 w-4" aria-hidden /> },
  ];
  return (
    <fieldset className="flex flex-col gap-0.5">
      <legend className="t-eyebrow px-3 pb-2 pt-1.5">{t.nav.theme}</legend>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={theme === option.id}
          onClick={() => setTheme(option.id)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-fg-muted hover:bg-surface-2 hover:text-fg aria-pressed:text-fg"
        >
          {option.icon}
          <span className="flex-1">{option.label}</span>
          {theme === option.id && <Check className="h-4 w-4 text-accent" aria-hidden />}
        </button>
      ))}
    </fieldset>
  );
}

export function PreferencesIcon() {
  return <Globe className="h-[18px] w-[18px]" aria-hidden />;
}
