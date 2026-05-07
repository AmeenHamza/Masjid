'use client';

import { LayoutDashboard, LogOut, Settings, Globe } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

const links = [
  { href: '/admin', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/admin/prayer-times', icon: Globe, key: 'prayerTimes' },
  { href: '/admin/income-records', icon: Globe, key: 'incomeRecords' },
  { href: '/admin/expense-records', icon: Globe, key: 'expenseRecords' },
  { href: '/admin/shop-records', icon: Globe, key: 'shopRecords' },
  { href: '/admin/donations', icon: Globe, key: 'donations' },
  { href: '/admin/ramadan', icon: Globe, key: 'ramadan' },
  { href: '/admin/projects', icon: Globe, key: 'projects' },
  { href: '/admin/gallery', icon: Globe, key: 'gallery' },
  { href: '/admin/settings', icon: Settings, key: 'settings' }
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('admin');
  const tComponents = useTranslations('components');

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.assign('/admin/login');
  }

  const activeClass = 'border-emerald-700 bg-emerald-700 text-white shadow-md shadow-emerald-700/20';
  const inactiveClass = 'border-transparent bg-white/70 text-slate-700 hover:border-emerald-700/20 hover:bg-emerald-50';

  const navItems = useMemo(() => links.map((link) => ({ ...link, label: t(link.key as any) })), [t]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/85 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-emerald-700">{tComponents('masjidAdmin')}</div>
            <div className="text-lg font-black">{tComponents('jamisMasjidNoori')}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-900/10 bg-white shadow-sm"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-61px)] lg:min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className="hidden border-r border-emerald-900/10 bg-white/80 p-5 backdrop-blur lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-emerald-700">{tComponents('masjidAdmin')}</div>
            <h1 className="mt-2 text-2xl font-black">{tComponents('jamisMasjidNoori')}</h1>
          </div>
          <nav className="mt-8 space-y-2">
            {navItems.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link key={link.href} href={link.href} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${isActive ? activeClass : inactiveClass}`}>
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8">
            <button onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white">
              <LogOut className="h-4 w-4" /> {tComponents('logout')}
            </button>
          </div>
        </aside>

        <main className="p-4 sm:p-5 lg:p-8">
          <div className="reveal">{children}</div>
        </main>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/50" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-[92vw] max-w-sm overflow-y-auto border-l border-emerald-900/10 bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-emerald-700">{tComponents('masjidAdmin')}</div>
                <div className="text-lg font-black">{tComponents('navigation')}</div>
              </div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-6 grid gap-2">
              {navItems.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${isActive ? activeClass : inactiveClass}`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8">
              <button onClick={logout} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white">
                <LogOut className="h-4 w-4" /> {tComponents('logout')}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
