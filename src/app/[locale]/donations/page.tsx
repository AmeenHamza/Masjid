export const dynamic = 'force-dynamic';

import { getDonationRecords, getSiteSettings } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { getTranslations } from 'next-intl/server';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Link } from '@/navigation';

function normalizeView(value: unknown) {
  const nextValue = String(value || '').toLowerCase();
  if (nextValue === 'box') return 'box';
  if (nextValue === 'masjid') return 'masjid';
  if (nextValue === 'madrasa') return 'madrasa';
  return 'friday';
}

function normalizeMonth(value: unknown, fallback: number) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 12 ? parsed : fallback;
}

function normalizeYear(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  if (parsed === 0) return 0;
  if (parsed >= 1900) return parsed;
  if (parsed > 0 && parsed < 100) return 2000 + parsed;
  return fallback;
}

function viewHref(view: 'friday' | 'box' | 'masjid' | 'madrasa', month: number, year: number) {
  return `/donations?view=${view}&month=${month}&year=${year}`;
}

const reportMonthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default async function DonationsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const resolvedLocale = locale as 'en' | 'ur';
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const view = normalizeView(resolvedSearchParams?.view);
  const selectedMonth = normalizeMonth(resolvedSearchParams?.month, 0);
  const selectedYear = normalizeYear(resolvedSearchParams?.year, 0);
  const [settings, t, common, records] = await Promise.all([getSiteSettings(), getTranslations({ locale: resolvedLocale, namespace: 'pages' }), getTranslations({ locale: resolvedLocale, namespace: 'common' }), getDonationRecords()]);

  const typeRecords = records.filter((item: any) => String(item.type || '').toLowerCase() === view);
  const years = Array.from(new Set(typeRecords.map((item: any) => Number(item.year)))).filter((year) => Number.isInteger(year) && year > 0).sort((a, b) => b - a);
  if (selectedYear && !years.includes(selectedYear)) {
    years.push(selectedYear);
    years.sort((a, b) => b - a);
  }

  const filteredRecords = typeRecords.filter((item: any) =>
    (!selectedMonth || Number(item.month) === selectedMonth) &&
    (!selectedYear || Number(item.year) === selectedYear)
  );
  const totalAmount = filteredRecords.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const rows = filteredRecords.map((item: any) => ({
    date: `${item.month || '-'}-${item.year || '-'}`,
    donor: String(item.donorName || '-'),
    amount: formatCurrency(Number(item.amount || 0)),
    note: String(item.note || '-')
  }));

  const columns = [common('date'), common('donor'), common('amount'), common('notes')];

  const normalizedRows = rows.map((item) => ({
    [common('date')]: item.date,
    [common('donor')]: item.donor,
    [common('amount')]: item.amount,
    [common('notes')]: item.note
  }));

  const viewLabels: Record<typeof view, string> = {
    friday: 'Friday Donation',
    box: 'Box Donation',
    masjid: 'Masjid Donation',
    madrasa: 'Madrasa Donation'
  };
  const title = viewLabels[view];
  const subtitle = `${viewLabels[view]} records from the admin panel.`;

  return (
    <>
      <SiteHeader phone={settings.phone} masjidName={settings.masjidName} />
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 lg:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">{common('donations')}</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
              <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[420px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{common('entries')}</div>
                <div className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-emerald-300">{formatNumber(filteredRecords.length)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{common('amount')}</div>
                <div className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-emerald-300">{formatCurrency(totalAmount)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <div className="grid gap-2 sm:grid-cols-4">
            <Link href={viewHref('friday', selectedMonth, selectedYear)} className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'friday' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
              Friday Donation
            </Link>
            <Link href={viewHref('box', selectedMonth, selectedYear)} className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'box' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
              Box Donation
            </Link>
            <Link href={viewHref('masjid', selectedMonth, selectedYear)} className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'masjid' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
              Masjid Donation
            </Link>
            <Link href={viewHref('madrasa', selectedMonth, selectedYear)} className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'madrasa' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
              Madrasa Donation
            </Link>
          </div>
        </section>

        <form className="mt-6 grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <input type="hidden" name="view" value={view} />
          <label className="min-w-0">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{common('month')}</div>
            <select name="month" defaultValue={String(selectedMonth)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
              <option value="0">{t('allMonths')}</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>{reportMonthNames[month - 1]}</option>
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

        <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <div className="border-b border-slate-200/80 bg-slate-50 px-6 py-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{common('records')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-700 dark:border-white/10 dark:text-slate-300">
                  {columns.map((column) => (
                    <th key={column} className="px-6 py-4 font-bold">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalizedRows.length ? (
                  normalizedRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-slate-100 dark:border-white/5">
                      {columns.map((column) => (
                        <td key={column} className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {row[column] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {common('noRecordsYet')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <SiteFooter address={settings.address} phone={settings.phone} email={settings.email} />
    </>
  );
}
