'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';

const localeMeta = {
  en: { label: 'EN', flag: '/flags/uk.svg' },
  ur: { label: 'اردو', flag: '/flags/pk.svg' }
} as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();

  const nextLocale = locale === 'en' ? 'ur' : 'en';
  const targetPath = pathname.replace(/^\/(en|ur)(?=\/|$)/, '') || '/';

  return (
    <button
      type="button"
      onClick={() => router.push(targetPath, { locale: nextLocale })}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/30 dark:bg-white/10"
      aria-label={t('switchLanguage')}
    >
      <span className="relative h-4 w-6 overflow-hidden rounded-sm">
        <Image src={localeMeta[locale as 'en' | 'ur'].flag} alt="flag" fill className="object-cover" />
      </span>
      <span>{localeMeta[locale as 'en' | 'ur'].label}</span>
      <span className="text-white/60">/</span>
      <span>{localeMeta[nextLocale].label}</span>
    </button>
  );
}
