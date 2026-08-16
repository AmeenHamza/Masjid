export const dynamic = 'force-dynamic';

import { getExpenseRecords, getSiteSettings } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SectionPage } from '@/components/section-page';
import { getTranslations } from 'next-intl/server';
import { formatCurrency, formatNumber } from '@/lib/utils';

function normalizeCategory(value: unknown, fallback: string | null) {
  if (Array.isArray(value)) {
    return String(value[0] ?? '') || fallback;
  }

  const normalized = String(value ?? '').trim();
  return normalized ? normalized : fallback;
}

function normalizeMonth(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : fallback;
}

function normalizeYear(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  if (parsed === 0) {
    return 0;
  }

  if (parsed >= 1900) {
    return parsed;
  }

  if (parsed > 0 && parsed < 100) {
    return 2000 + parsed;
  }

  return fallback;
}

export default async function ExpensePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const resolvedLocale = locale as 'en' | 'ur';
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [settings, t, common, allRecords] = await Promise.all([getSiteSettings(), getTranslations({ locale: resolvedLocale, namespace: 'pages' }), getTranslations({ locale: resolvedLocale, namespace: 'common' }), getExpenseRecords()]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const selectedCategory = normalizeCategory((resolvedSearchParams as any)?.category, null);
  const selectedMonth = normalizeMonth((resolvedSearchParams as any)?.month, 0);
  const selectedYear = normalizeYear((resolvedSearchParams as any)?.year, 0);

  const categories = Array.from(new Set(allRecords.map((item: any) => String(item.category || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const years = Array.from(new Set(allRecords.map((item: any) => Number(item.year) || currentYear))).filter((year) => Number.isInteger(year)).sort((a, b) => b - a);
  if (selectedYear && !years.includes(selectedYear)) {
    years.push(selectedYear);
    years.sort((a, b) => b - a);
  }

  const records = allRecords.filter((item: any) =>
    (!selectedCategory || String(item.category || '').trim() === selectedCategory) &&
    (!selectedMonth || Number(item.month) === selectedMonth) &&
    (!selectedYear || Number(item.year) === selectedYear)
  );

  // Monthly/yearly summary cards are fixed headline totals for the current
  // period and should not shrink when the user filters the table below by
  // category/month/year - they're computed from allRecords, not records.
  const monthly = allRecords.filter((item: any) => item.month === currentMonth && item.year === currentYear).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const yearly = allRecords.filter((item: any) => item.year === currentYear).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const rows = records.map((item: any) => ({
    date: `${item.month || '-'}-${item.year || '-'}`,
    title: String(item.title || '-'),
    note: String(item.note || '-'),
    amount: formatCurrency(Number(item.amount || 0))
  }));

  const columns = [common('date'), common('title'), common('note'), common('amount')];

  const normalizedRows = rows.map((item) => ({
    [common('date')]: item.date,
    [common('title')]: item.title,
    [common('note')]: item.note,
    [common('amount')]: item.amount
  }));

  return (
    <>
      <SiteHeader phone={settings.phone} masjidName={settings.masjidName} />
      <main className="mx-auto max-w-7xl px-4 pt-6 lg:px-6">
        <form className="mb-6 grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="min-w-0">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{common('category')}</div>
            <select name="category" defaultValue={selectedCategory ?? ''} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
              <option value="">{t('allCategories')}</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{common('month')}</div>
            <select name="month" defaultValue={String(selectedMonth)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
              <option value="0">{t('allMonths')}</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{common('year')}</div>
            <select name="year" defaultValue={String(selectedYear)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
              <option value="0">{t('allYears')}</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600">Filter</button>
        </form>
      </main>
      <SectionPage
        brandLabel={`${common('brandTop')} ${common('brandBottom')}`}
        title={t('expense.title')}
        subtitle={t('expense.subtitle')}
        summary={[
          { label: common('monthly'), value: formatCurrency(monthly) },
          { label: common('yearly'), value: formatCurrency(yearly) },
          { label: common('entries'), value: formatNumber(records.length) }
        ]}
        columns={columns}
        rows={normalizedRows}
        recordsLabel={common('records')}
        noRecordsLabel={common('noRecordsYet')}
      />
      <SiteFooter address={settings.address} phone={settings.phone} />
    </>
  );
}
