import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Noto_Naskh_Arabic } from 'next/font/google';
import type { ReactNode } from 'react';

const englishFont = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });
const urduFont = Noto_Naskh_Arabic({ subsets: ['arabic'], variable: '--font-urdu' });

export const metadata: Metadata = {
  title: 'Jami Masjid Noori & Madrasa',
  description: 'Official bilingual web application for Jami Masjid Noori & Madrasa, Korangi No. 1, Karachi.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning className={`${englishFont.variable} ${urduFont.variable} min-h-screen bg-background font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
