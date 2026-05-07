'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown, Menu, Phone } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@/navigation';
import { Logo } from './logo';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';

const navItems: Array<any> = [
  { kind: 'link' as const, href: '/', key: 'home' as const },
  { kind: 'link' as const, href: '/income', key: 'income' as const },
  { kind: 'link' as const, href: '/expense', key: 'expense' as const },
  { kind: 'link' as const, href: '/shop', key: 'shop' as const },
  { kind: 'link' as const, href: '/donations', key: 'donations' as const },
  { kind: 'link' as const, href: '/ramadan', key: 'ramadan' as const },
  { kind: 'link' as const, href: '/projects', key: 'projects' as const },
  { kind: 'link' as const, href: '/gallery', key: 'gallery' as const }
];

export function SiteHeader({
  phone = '+92 300 1234567',
  masjidName
}: {
  phone?: string;
  masjidName?: string;
}) {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const [ramadanOpen, setRamadanOpen] = useState(false);
  const normalizedName = (masjidName || '').trim();
  const words = normalizedName.split(/\s+/).filter(Boolean);
  const hasSplitName = words.length > 2;
  const logoTopText = hasSplitName ? words.slice(0, 2).join(' ') : (masjidName || t('brandTop'));
  const logoBottomText = hasSplitName ? words.slice(2).join(' ') : t('brandBottom');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 text-slate-900 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 dark:text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        <Link href="/" className="shrink-0">
          <Logo topText={logoTopText} bottomText={logoBottomText} tone="dark" />
        </Link>
        <nav className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => (
            item.kind === 'menu' ? (
              <div
                key={item.key}
                className="group relative"
                onMouseEnter={() => setRamadanOpen(true)}
                onMouseLeave={() => setRamadanOpen(false)}
              >
                <button
                  type="button"
                  aria-expanded={ramadanOpen}
                  onClick={() => setRamadanOpen((value) => !value)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {t(item.key)}
                  <ChevronDown className={`h-4 w-4 transition ${ramadanOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute left-0 top-full z-50 pt-2 ${ramadanOpen ? 'block' : 'hidden'} group-hover:block`}>
                  <div className="w-64 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-slate-950">
                    {item.items.map((subItem: any) => (
                      <Link
                        key={subItem.key}
                        href={subItem.href}
                        onClick={() => setRamadanOpen(false)}
                        className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                      >
                        {tNav(subItem.key)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link key={item.key} href={item.href} className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white">
                {t(item.key)}
              </Link>
            )
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-emerald-50/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/5 dark:text-white/90">
            <Phone className="h-4 w-4" />
            <span dir="ltr" className="[unicode-bidi:isolate]">{phone}</span>
          </div>
        </div>
        <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 lg:hidden dark:border-white/10 dark:bg-white/5 dark:text-white" onClick={() => setOpen(!open)}>
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open ? (
        <div className="reveal border-t border-slate-200/80 bg-white/95 px-4 py-4 shadow-lg dark:border-white/10 dark:bg-slate-950 lg:hidden">
          <div className="grid gap-3">
            {navItems.map((item) => (
              item.kind === 'menu' ? (
                <div key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => setRamadanOpen((value) => !value)}
                    className="flex w-full items-center justify-between text-sm font-semibold text-slate-800 dark:text-white"
                  >
                    {t(item.key)}
                    <ChevronDown className={`h-4 w-4 transition ${ramadanOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {ramadanOpen ? (
                    <div className="mt-3 grid gap-2">
                      {item.items.map((subItem: any) => (
                        <Link
                          key={subItem.key}
                          href={subItem.href}
                          onClick={() => {
                            setOpen(false);
                            setRamadanOpen(false);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                          {tNav(subItem.key)}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link key={item.key} href={item.href} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  {t(item.key)}
                </Link>
              )
            ))}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
