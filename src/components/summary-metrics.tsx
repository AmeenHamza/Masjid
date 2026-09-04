import { Card } from './ui/card';
import { formatCurrency } from '@/lib/utils';

export function SummaryMetrics({ metrics, labels, locale }: { metrics: { totalIncome: number; monthlyShopIncome: number; activeProjects: number; yearlyExpense: number }; labels: { totalIncome: string; monthlyShopIncome: string; activeProjects: string; yearlyExpense: string }; locale?: 'en' | 'ur' }) {
  const resolvedLocale = locale === 'ur' ? 'ur' : 'en';

  const items = [
    { label: labels.totalIncome, value: formatCurrency(metrics.totalIncome, 'PKR', resolvedLocale) },
    { label: labels.monthlyShopIncome, value: formatCurrency(metrics.monthlyShopIncome, 'PKR', resolvedLocale) },
    { label: labels.activeProjects, value: String(metrics.activeProjects) },
    { label: labels.yearlyExpense, value: formatCurrency(metrics.yearlyExpense, 'PKR', resolvedLocale) }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="relative overflow-hidden border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/80">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-cyan-500" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{item.label}</p>
          <div className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-emerald-300">{item.value}</div>
        </Card>
      ))}
    </div>
  );
}
