'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('common');
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 text-sm font-medium text-white backdrop-blur transition hover:bg-black/30 dark:bg-white/10 dark:text-white"
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      <span>{isDark ? t('lightMode') : t('darkMode')}</span>
    </button>
  );
}
