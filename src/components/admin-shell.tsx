'use client';

import { LayoutDashboard, LogOut, Settings, Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '@/navigation';
import { ThemeToggle } from './theme-toggle';
import type { ReactNode } from 'react';
import { backendApiUrl } from '@/lib/backend-url';

const links = [
  { href: '/admin', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/admin/prayer-times', icon: Globe, key: 'prayerTimes' },
  { href: '/admin/income-records', icon: Globe, key: 'incomeRecords' },
  { href: '/admin/expense-records', icon: Globe, key: 'expenseRecords' },
  { href: '/admin/shop-records', icon: Globe, key: 'shopRecords' },
  { href: '/admin/donations', icon: Globe, key: 'donations' },
  { href: '/admin/fitrah-records', icon: Globe, key: 'fitrah' },
  { href: '/admin/projects', icon: Globe, key: 'projects' },
  { href: '/admin/gallery', icon: Globe, key: 'gallery' },
  { href: '/admin/settings', icon: Settings, key: 'settings' }
];

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations('admin');
  const common = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  async function logout() {
    await fetch(`${backendApiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
    router.push(`/${locale}/admin/login`);
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950">
          <div className="text-xs uppercase tracking-[0.3em] text-emerald-700">Masjid Admin</div>
          <h1 className="mt-2 text-2xl font-black">Jami Masjid Noori</h1>
          <nav className="mt-8 space-y-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:bg-emerald-50 dark:hover:bg-white/5">
                <link.icon className="h-4 w-4" />
                {
                  t(
                    link.key as
                      | 'dashboard'
                      | 'prayerTimes'
                      | 'incomeRecords'
                      | 'expenseRecords'
                      | 'shopRecords'
                      | 'donations'
                      | 'fitrah'
                      | 'projects'
                      | 'gallery'
                      | 'settings'
                  )
                }
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex items-center gap-3">
            <ThemeToggle />
            <button onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
              <LogOut className="h-4 w-4" /> {common('logout')}
            </button>
          </div>
        </aside>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
