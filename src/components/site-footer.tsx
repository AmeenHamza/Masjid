import { useTranslations } from 'next-intl';
import { ChevronRight, Compass, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Link } from '@/navigation';
import { ThemeToggle } from './theme-toggle';

export function SiteFooter({ address, phone }: { address: string; phone: string }) {
  const year = new Date().getFullYear();
  const tCommon = useTranslations('common');
  const t = useTranslations('home');

  const quickLinks = [
    { href: '/', label: tCommon('home') },
    { href: '/income', label: tCommon('income') },
    { href: '/expense', label: tCommon('expense') },
    { href: '/donations', label: tCommon('donations') },
    { href: '/projects', label: tCommon('projects') },
    { href: '/gallery', label: tCommon('gallery') }
  ];

  return (
    <footer className="border-t border-slate-200/80 bg-gradient-to-b from-white/95 via-white to-emerald-50/80 py-12 backdrop-blur dark:border-white/10 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/20">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid gap-8 rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm ring-1 ring-white/60 dark:border-white/10 dark:bg-white/5 dark:ring-white/10 lg:grid-cols-[1.15fr_0.9fr_0.9fr] lg:p-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{t('title')}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">{t('highlight')}</p>
            <div className="mt-5 grid gap-3 sm:max-w-md">
              <div className="inline-flex items-start gap-2 rounded-2xl bg-emerald-700/10 px-3 py-2 text-sm text-slate-700 dark:bg-emerald-500/15 dark:text-slate-200">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{address}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700/10 px-3 py-2 text-sm text-slate-700 dark:bg-emerald-500/15 dark:text-slate-200">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{phone}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">{t('navigation')}</h3>
            <ul className="mt-4 grid gap-2">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 transition hover:bg-emerald-700/10 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">{tCommon('liveSummary')}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('marquee')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-emerald-50/80 px-3 py-2 text-xs font-bold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4" />
                <span>{tCommon('admin')}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-emerald-50/80 px-3 py-2 text-xs font-bold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
                <Compass className="h-4 w-4" />
                <span>{tCommon('projects')}</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200/80 pt-5 text-xs text-slate-600 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {t('title')}.
          </p>
          <p className="inline-flex items-center gap-2">
            <span>{tCommon('records')}</span>
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            <span>{t('subtitle')}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
