'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrayerTime } from '@/lib/prayer-activity';

interface AdminDashboardContentProps {
  metrics: {
    totalIncome: number;
    totalDonation: number;
  };
  projects: Array<any>;
  gallery: Array<any>;
  prayers: Record<string, string | number>;
}

export function AdminDashboardContent({ metrics, projects, gallery, prayers }: AdminDashboardContentProps) {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tPrayers = useTranslations('prayers');
  const prayerKeys = ['fajr', 'zohar', 'asr', 'maghrib', 'isha', 'juma'] as const;

  return (
    <div className="space-y-5 lg:space-y-8">
      <div className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm sm:p-6">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t('dashboard')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{t('dashboardDescription')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-emerald-900/10 bg-gradient-to-br from-emerald-50 to-white">
          <div className="text-sm font-medium text-slate-500">{tCommon('income')}</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{metrics.totalIncome}</div>
        </Card>
        <Card className="border-emerald-900/10 bg-gradient-to-br from-amber-50 to-white">
          <div className="text-sm font-medium text-slate-500">{tCommon('donations')}</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{metrics.totalDonation}</div>
        </Card>
        <Card className="border-emerald-900/10 bg-gradient-to-br from-sky-50 to-white">
          <div className="text-sm font-medium text-slate-500">{tCommon('projects')}</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{projects.length}</div>
        </Card>
        <Card className="border-emerald-900/10 bg-gradient-to-br from-fuchsia-50 to-white">
          <div className="text-sm font-medium text-slate-500">{tCommon('gallery')}</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{gallery.length}</div>
        </Card>
      </div>
      <Card className="border-emerald-900/10 bg-white/80">
        <h2 className="text-xl font-black sm:text-2xl">{t('todayPrayerTimes')}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {prayerKeys.map((key) => {
            const prayerLabel = tPrayers(key);
            const value = prayers[key];
            return (
              <Badge key={key} className="bg-emerald-700 text-white shadow-sm">
                {prayerLabel}: {formatPrayerTime(String(value ?? ''), locale)}
              </Badge>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
