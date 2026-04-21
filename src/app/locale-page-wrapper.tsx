import { cookies } from 'next/headers';
import { getMessages } from 'next-intl/server';
import type { JSX } from 'react';
import { Providers } from '@/components/providers';

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

type LocalePageComponent = (props: LocalePageProps) => Promise<JSX.Element> | JSX.Element;

export async function renderLocalePage(Page: LocalePageComponent) {
  const localeCookie = (await cookies()).get('NEXT_LOCALE')?.value;
  const locale = localeCookie === 'ur' ? 'ur' : 'en';
  const messages = await getMessages({ locale });

  return (
    <Providers locale={locale} messages={messages}>
      <div dir={locale === 'ur' ? 'rtl' : 'ltr'}>
        <Page params={Promise.resolve({ locale })} />
      </div>
    </Providers>
  );
}