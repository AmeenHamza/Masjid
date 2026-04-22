import { useTranslations } from 'next-intl';
import { ChevronRight, MapPin, Phone } from 'lucide-react';
import { Link } from '@/navigation';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';

export function SiteFooter({ address, phone, masjidName }: { address: string; phone: string; masjidName?: string }) {
  const year = new Date().getFullYear();
  const tCommon = useTranslations('common');
  const t = useTranslations('home');

  const quickLinks = [
    { href: '/', label: tCommon('home') },
    { href: '/income', label: tCommon('income') },
    { href: '/expense', label: tCommon('expense') },
    { href: '/shop', label: tCommon('shop') },
    { href: '/donations', label: tCommon('donations') },
    { href: '/fitrah', label: tCommon('fitrah') },
    { href: '/projects', label: tCommon('projects') },
    { href: '/gallery', label: tCommon('gallery') }
  ];

  return (
    <footer className="relative overflow-hidden border-t border-slate-200/80 bg-gradient-to-b from-white via-emerald-50/35 to-amber-50/40 py-8 dark:border-white/10 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-950 sm:py-10 lg:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(16,185,129,0.14),transparent_42%),radial-gradient(circle_at_90%_82%,rgba(245,158,11,0.1),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid gap-5 rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-xl shadow-emerald-900/5 ring-1 ring-white/70 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:ring-white/10 sm:gap-7 sm:rounded-[2rem] sm:p-6 lg:grid-cols-[1.2fr_0.95fr_0.85fr] lg:gap-8 lg:p-9">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">{tCommon('brandTop')}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white lg:text-3xl">{masjidName || t('title')}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">{t('subtitle')}</p>

            <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3 sm:max-w-md">
              <div className="inline-flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/85 px-3 py-2 text-sm text-slate-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-slate-200">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                <span>{address}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/85 px-3 py-2 text-sm text-slate-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-slate-200">
                <Phone className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                <span dir="ltr" className="[unicode-bidi:isolate]">{phone}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">{t('navigation')}</h3>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
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

          <div className="space-y-4 sm:space-y-5">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">{tCommon('prayerTimes')}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('marquee')}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-2.5 dark:border-white/10 dark:bg-white/5 sm:p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{tCommon('languageTheme')}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 sm:mt-3 sm:gap-3">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200/80 pt-5 text-xs text-slate-600 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} {masjidName || t('title')}.</p>
          <p className="inline-flex items-center gap-2">
            <span>{tCommon('home')}</span>
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            <span>{t('subtitle')}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
