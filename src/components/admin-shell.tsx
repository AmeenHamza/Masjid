'use client';

import { LayoutDashboard, LogOut, Settings, Globe } from 'lucide-react';
import Link from 'next/link';
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
  async function logout() {
    await fetch(`${backendApiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
    window.location.assign('/admin/login');
  }

  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    prayerTimes: 'Prayer Times',
    incomeRecords: 'Income Records',
    expenseRecords: 'Expense Records',
    shopRecords: 'Shop Records',
    donations: 'Donations',
    fitrah: 'Fitrah',
    projects: 'Projects',
    gallery: 'Gallery',
    settings: 'Settings'
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.1),_transparent_35%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_28%)] dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className="border-b border-emerald-900/10 bg-white/80 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/80 lg:border-b-0 lg:border-r lg:p-5">
          <div className="flex items-center justify-between lg:block">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-emerald-700">Masjid Admin</div>
              <h1 className="mt-2 text-xl font-black lg:text-2xl">Jami Masjid Noori</h1>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <button onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
          <nav className="mt-6 grid gap-2 sm:grid-cols-2 lg:mt-8 lg:grid-cols-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-700/30 hover:bg-emerald-700 hover:text-white dark:bg-white/5 dark:text-white/85 dark:hover:border-white/20 dark:hover:bg-white/15 dark:hover:text-white">
                <link.icon className="h-4 w-4" />
                {
                  labels[
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
                  ]
                }
              </Link>
            ))}
          </nav>
          <div className="mt-8 hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            <button onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </aside>
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="reveal">{children}</div>
        </main>
      </div>
    </div>
  );
}
