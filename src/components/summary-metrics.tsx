import { Card } from './ui/card';
import { formatCurrency } from '@/lib/utils';

export function SummaryMetrics({ metrics, labels, locale }: { metrics: { totalIncome: number; totalDonation: number; activeProjects: number; yearlyExpense: number }; labels: { totalIncome: string; totalDonation: string; activeProjects: string; yearlyExpense: string }; locale?: 'en' | 'ur' }) {
  const resolvedLocale = locale === 'ur' ? 'ur' : 'en';

  const items = [
    { label: labels.totalIncome, value: formatCurrency(metrics.totalIncome, 'PKR', resolvedLocale) },
    { label: labels.totalDonation, value: formatCurrency(metrics.totalDonation, 'PKR', resolvedLocale) },
    { label: labels.activeProjects, value: String(metrics.activeProjects) },
    { label: labels.yearlyExpense, value: formatCurrency(metrics.yearlyExpense, 'PKR', resolvedLocale) }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-emerald-100 bg-white/95 p-5 dark:border-white/10 dark:bg-slate-950/80">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
          <div className="mt-2 text-3xl font-black text-emerald-800 dark:text-emerald-300">{item.value}</div>
        </Card>
      ))}
    </div>
  );
}
