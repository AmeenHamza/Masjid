import { createNavigation } from 'next-intl/navigation';
import { defaultLocale, locales } from './i18n/config';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
  localePrefix: 'never'
});
 