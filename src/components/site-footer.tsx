import { useTranslations } from 'next-intl';
import { Phone, MapPin, MoonStar } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export function SiteFooter({ address, phone }: { address: string; phone: string }) {
  const t = useTranslations('home');

  return (
    <footer className="border-t border-slate-200 bg-white/80 py-10 dark:border-white/10 dark:bg-slate-950/80">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[1fr_auto] lg:px-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t('title')}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('subtitle')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{address}</span>
            <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{phone}</span>
          </div>
        </div>
        <div className="flex items-start gap-3 lg:justify-end">
          <ThemeToggle />
          <div className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white">
            <MoonStar className="mb-2 h-4 w-4" />
            <div>Masjid UI</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
