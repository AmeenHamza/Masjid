import { useTranslations } from 'next-intl';
import { Phone, MapPin } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export function SiteFooter({ address, phone }: { address: string; phone: string }) {
  const t = useTranslations('home');

  return (
    <footer className="border-t border-emerald-900/10 bg-white/70 py-10 backdrop-blur dark:border-white/10 dark:bg-slate-950/75">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[1fr_auto] lg:px-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{t('title')}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('subtitle')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{address}</span>
            <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{phone}</span>
          </div>
        </div>
        <div className="flex items-start gap-3 lg:justify-end">
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
