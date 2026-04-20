import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const resolvedLocale = locales.includes(locale as (typeof locales)[number]) ? (locale as (typeof locales)[number]) : defaultLocale;

  return {
    locale: resolvedLocale,
    timeZone: 'Asia/Karachi',
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default
  };
});
