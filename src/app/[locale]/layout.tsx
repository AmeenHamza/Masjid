import { getMessages } from 'next-intl/server';
import { Providers } from '@/components/providers';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import type { ReactNode } from 'react';

export default async function LocaleLayout({ children, params }: Readonly<{ children: ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;

  if (!locales.includes(locale as 'en' | 'ur')) {
    notFound();
  }

  const resolvedLocale = locale as 'en' | 'ur';
  const messages = await getMessages({ locale: resolvedLocale });

  return (
    <Providers locale={resolvedLocale} messages={messages}>
      <div dir={resolvedLocale === 'ur' ? 'rtl' : 'ltr'}>{children}</div>
    </Providers>
  );
}
