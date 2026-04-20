'use client';

import { useTranslations } from 'next-intl';
import { Menu, Phone } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@/navigation';
import { Logo } from './logo';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';

const navItems = [
  { href: '/', key: 'home' },
  { href: '/income', key: 'income' },
  { href: '/expense', key: 'expense' },
  { href: '/shop', key: 'shop' },
  { href: '/donations', key: 'donations' },
  { href: '/fitrah', key: 'fitrah' },
  { href: '/projects', key: 'projects' },
  { href: '/gallery', key: 'gallery' },
  { href: '/projects', key: 'projects' }
];

export function SiteHeader({ phone = '+92 300 1234567' }: { phone?: string }) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <Link key={item.key} href={item.href} className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white">
              {t(item.key as 'home' | 'gallery' | 'projects' | 'income' | 'expense' | 'shop' | 'donations')}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm">
            <Phone className="h-4 w-4" />
            <span>{phone}</span>
          </div>
        </div>
        <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 lg:hidden" onClick={() => setOpen(!open)}>
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open ? (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-4 lg:hidden">
          <div className="grid gap-3">
            {navItems.map((item) => (
              <Link key={item.key} href={item.href} className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-medium">
                {t(item.key as 'home' | 'gallery' | 'projects' | 'income' | 'expense' | 'shop' | 'donations')}
              </Link>
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
