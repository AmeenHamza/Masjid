export const dynamic = 'force-dynamic';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { RamadanYearSelector } from '@/components/ramadan-year-selector';
import { Link } from '@/navigation';
import { getRamadanDonationRecords, getRamadanExpenseRecords, getFitrahRecords, getSiteSettings } from '@/lib/public-data';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

type RamadanView = 'donation' | 'expense' | 'fitrah';

function normalizeView(value: unknown): RamadanView {
  const nextValue = String(value || '').toLowerCase();

  if (nextValue === 'expense') return 'expense';
  if (nextValue === 'fitrah') return 'fitrah';
  return 'donation';
}

function viewHref(view: RamadanView, year?: number) {
  const params = new URLSearchParams({ view });
  if (year) params.append('year', String(year));
  return `/ramadan?${params.toString()}`;
}

function getAvailableYears(donationRecords: any[], expenseRecords: any[], fitrahRecords: any[]): number[] {
  const years = new Set<number>();
  const currentYear = new Date().getFullYear();
  
  // Collect all years from records
  donationRecords.forEach((r) => {
    if (r.year) years.add(r.year);
  });
  
  expenseRecords.forEach((r) => {
    if (r.year) years.add(r.year);
  });
  
  fitrahRecords.forEach((r) => {
    if (r.year) years.add(r.year);
  });
  
  // Add current year
  years.add(currentYear);
  
  // Find earliest year with data (minimum 2001)
  const earliestYear = years.size > 0 ? Math.min(...Array.from(years)) : currentYear;
  const startYear = Math.min(earliestYear, 2001);
  
  // Generate range from earliest year to current year
  for (let y = startYear; y <= currentYear; y++) {
    years.add(y);
  }
  
  return Array.from(years).sort((a, b) => b - a);
}

function sumAmount(records: Array<Record<string, unknown>>, key = 'amount') {
  return records.reduce((sum, item) => sum + Number(item[key] ?? 0), 0);
}

function sumMembers(records: any[]) {
  return records.reduce((sum, item) => sum + Number(item.membersCount ?? 0), 0);
}

export default async function RamadanPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<{ view?: string; year?: string }> }) {
  const { locale } = await params;
  const resolvedLocale = locale as 'en' | 'ur';
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const view = normalizeView(resolvedSearchParams?.view);
  const selectedYear = resolvedSearchParams?.year ? Number(resolvedSearchParams.year) : new Date().getFullYear();

  const [settings, pages, common, nav, donationRecords, expenseRecords, fitrahRecords] = await Promise.all([
    getSiteSettings(),
    getTranslations({ locale: resolvedLocale, namespace: 'pages' }),
    getTranslations({ locale: resolvedLocale, namespace: 'common' }),
    getTranslations({ locale: resolvedLocale, namespace: 'nav' }),
    getRamadanDonationRecords(),
    getRamadanExpenseRecords(),
    getFitrahRecords()
  ]);

  const availableYears = getAvailableYears(donationRecords, expenseRecords, fitrahRecords);
  
  // Filter records by selected year
  const filteredDonationRecords = donationRecords.filter((r) => r.year === selectedYear);
  const filteredExpenseRecords = expenseRecords.filter((r) => r.year === selectedYear);
  const filteredFitrahRecords = fitrahRecords.filter((r) => r.year === selectedYear);

  const donationRows = filteredDonationRecords.map((item: any) => ({
      year: String(item.year || '-'),
      donor: String(item.donorName || '-'),
      amount: formatCurrency(Number(item.amount || 0)),
      note: String(item.note || '-')
    }));

  const expenseRows = filteredExpenseRecords.map((item: any) => ({
    year: String(item.year || '-'),
    title: String(item.title || '-'),
    amount: formatCurrency(Number(item.amount || 0)),
    note: String(item.note || '-')
  }));

  const fitrahRows = filteredFitrahRecords.map((item: any) => ({
    family: String(item.familyName || '-'),
    members: formatNumber(Number(item.membersCount || 0)),
    amount: formatCurrency(Number(item.amount || 0)),
    year: String(item.year || '-')
  }));

  const views = {
    donation: {
      title: nav('ramadanDonation'),
      subtitle: pages('ramadanDonation.subtitle'),
      summary: [
        { label: common('entries'), value: formatNumber(donationRows.length) },
        { label: common('amount'), value: formatCurrency(sumAmount(filteredDonationRecords as Array<Record<string, unknown>>)) }
      ],
      columns: [common('year'), common('donor'), common('amount'), common('notes')],
      rows: donationRows.map((item) => ({
        [common('year')]: item.year,
        [common('donor')]: item.donor,
        [common('amount')]: item.amount,
        [common('notes')]: item.note
      }))
    },
    expense: {
      title: nav('ramadanExpense'),
      subtitle: pages('ramadanExpense.subtitle'),
      summary: [
        { label: common('entries'), value: formatNumber(expenseRows.length) },
        { label: common('amount'), value: formatCurrency(sumAmount(filteredExpenseRecords as Array<Record<string, unknown>>)) }
      ],
      columns: [common('year'), common('title'), common('amount'), common('notes')],
      rows: expenseRows.map((item) => ({
        [common('year')]: item.year,
        [common('title')]: item.title,
        [common('amount')]: item.amount,
        [common('notes')]: item.note
      }))
    },
    fitrah: {
      title: common('fitrah'),
      subtitle: pages('fitrah.subtitle'),
      summary: [
        { label: common('families'), value: formatNumber(filteredFitrahRecords.length) },
        { label: common('members'), value: formatNumber(sumMembers(filteredFitrahRecords)) },
        { label: common('amount'), value: formatCurrency(sumAmount(filteredFitrahRecords as Array<Record<string, unknown>>)) }
      ],
      columns: [common('family'), common('members'), common('amount'), common('year')],
      rows: fitrahRows.map((item) => ({
        [common('family')]: item.family,
        [common('members')]: item.members,
        [common('amount')]: item.amount,
        [common('year')]: item.year
      }))
    }
  } as const;

  const current = views[view];
  const hasRecords = current.rows.length > 0;

  return (
    <>
      <SiteHeader phone={settings.phone} masjidName={settings.masjidName} />
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 lg:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">{common('ramadan')}</p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{current.title}</h1>
              <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">{current.subtitle}</p>
            </div>
            <div className="flex flex-col gap-4 lg:min-w-[520px]">
              <RamadanYearSelector 
                availableYears={availableYears}
                selectedYear={selectedYear}
                view={view}
                commonTranslations={{ year: common('year') }}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {current.summary.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{item.label}</div>
                    <div className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-emerald-300">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <div className="grid gap-2 sm:grid-cols-3">
            <Link href={viewHref('donation', selectedYear)} className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'donation' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
              {nav('ramadanDonation')}
            </Link>
            <Link href={viewHref('expense', selectedYear)} className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'expense' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
              {nav('ramadanExpense')}
            </Link>
            <Link href={viewHref('fitrah', selectedYear)} className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'fitrah' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
              {common('fitrah')}
            </Link>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <div className="border-b border-slate-200/80 bg-slate-50 px-6 py-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{common('records')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-700 dark:border-white/10 dark:text-slate-300">
                  {current.columns.map((column) => (
                    <th key={column} className="px-6 py-4 font-bold">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.rows.length ? (
                  current.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-slate-100 dark:border-white/5">
                      {current.columns.map((column) => (
                        <td key={column} className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {row[column] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={current.columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {common('noRecordsYet')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <SiteFooter address={settings.address} phone={settings.phone} />
    </>
  );
}
