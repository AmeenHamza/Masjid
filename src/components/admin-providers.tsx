'use client';

import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import type { AbstractIntlMessages } from 'next-intl';

type AdminProvidersProps = {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
};

export function AdminProviders({ children, locale, messages }: AdminProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Karachi">
      {children}
      <Toaster position="top-right" richColors closeButton />
    </NextIntlClientProvider>
  );
}
