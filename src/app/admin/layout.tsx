import type { ReactNode } from 'react';
import { getMessages } from 'next-intl/server';
import { AdminProviders } from '@/components/admin-providers';
import { defaultLocale } from '@/i18n/config';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const messages = await getMessages({ locale: defaultLocale });

  return (
    <AdminProviders locale={defaultLocale} messages={messages}>
      {children}
    </AdminProviders>
  );
}
