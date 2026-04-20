'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('common');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goToLocale(targetLocale: 'en' | 'ur') {
    if (targetLocale === locale) {
      return;
    }

    const cleanPath = (pathname || '/').replace(/^\/(en|ur)(?=\/|$)/, '') || '/';
    const queryString = searchParams.toString();
    const targetPath = `/${targetLocale}${cleanPath === '/' ? '' : cleanPath}`;
    window.location.assign(queryString ? `${targetPath}?${queryString}` : targetPath);
  }

  return (
    <div
      className="inline-flex h-10 items-center gap-1 rounded-full border border-emerald-900/20 bg-white/70 p-1 text-xs font-semibold text-slate-800 backdrop-blur dark:border-white/15 dark:bg-white/5 dark:text-slate-100"
      aria-label={t('switchLanguage')}
      role="group"
    >
      <button
        type="button"
        onClick={() => goToLocale('en')}
        className={`rounded-full px-3 py-1.5 transition ${locale === 'en' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/10'}`}
      >
        {t('languageEnglish')}
      </button>
      <button
        type="button"
        onClick={() => goToLocale('ur')}
        className={`rounded-full px-3 py-1.5 transition ${locale === 'ur' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/10'}`}
      >
        {t('languageUrdu')}
      </button>
    </div>
  );
}
