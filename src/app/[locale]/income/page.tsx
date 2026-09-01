export const dynamic = 'force-dynamic';

import { getSiteSettings } from '@/lib/public-data';
import { getIncomeRecords, getShopRecords, getDonationRecords } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SectionPage } from '@/components/section-page';
import { DownloadReportButton } from '@/components/download-report-button';
import { getResourceConfig } from '@/lib/admin-ui';
import { getTranslations } from 'next-intl/server';
import { formatCurrency, formatNumber } from '@/lib/utils';

const reportMonthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function buildReportPeriodLabel(month: number, year: number) {
  if (month && year) return `${reportMonthNames[month - 1]} ${year}`;
  if (year) return `Year ${year}`;
  if (month) return reportMonthNames[month - 1];
  return 'All Records';
}

function normalizeSource(value: unknown, fallback: string | null) {
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

export default async function IncomePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const resolvedLocale = locale as 'en' | 'ur';
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [settings, t, common, allRecords, allShopRecords, allDonationRecords] = await Promise.all([getSiteSettings(), getTranslations({ locale: resolvedLocale, namespace: 'pages' }), getTranslations({ locale: resolvedLocale, namespace: 'common' }), getIncomeRecords(), getShopRecords(), getDonationRecords()]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const selectedSource = normalizeSource((resolvedSearchParams as any)?.source, null);
  const selectedMonth = normalizeMonth((resolvedSearchParams as any)?.month, 0);
  const selectedYear = normalizeYear((resolvedSearchParams as any)?.year, 0);

  const sources = Array.from(new Set(allRecords.map((item: any) => String(item.source || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const years = Array.from(new Set(allRecords.map((item: any) => Number(item.year) || currentYear))).filter((year) => Number.isInteger(year)).sort((a, b) => b - a);
  if (selectedYear && !years.includes(selectedYear)) {
    years.push(selectedYear);
    years.sort((a, b) => b - a);
  }

  const records = allRecords.filter((item: any) =>
    (!selectedSource || String(item.source || '').trim() === selectedSource) &&
    (!selectedMonth || Number(item.month) === selectedMonth) &&
    (!selectedYear || Number(item.year) === selectedYear)
  );

  // Monthly/yearly summary cards are fixed headline totals for the current
  // period and should not shrink when the user filters the table below by
  // source/month/year - they're computed from allRecords, not records.
  const monthly = allRecords.filter((item: any) => item.month === currentMonth && item.year === currentYear).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const yearly = allRecords.filter((item: any) => item.year === currentYear).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  // Shop Received / Donations Received follow whichever month is picked in
  // the filter above (defaulting to the current month when left on "All
  // Months") - shop stays one month behind, same rent-cycle reasoning used
  // everywhere else in the app, while donations reflect that same month.
  const donationPeriodMonth = selectedMonth || currentMonth;
  const donationPeriodYear = selectedYear || currentYear;
  const shopPeriodMonth = donationPeriodMonth === 1 ? 12 : donationPeriodMonth - 1;
  const shopPeriodYear = donationPeriodMonth === 1 ? donationPeriodYear - 1 : donationPeriodYear;

  const shopReceived = allShopRecords
    .filter((item: any) => Number(item.month) === shopPeriodMonth && Number(item.year) === shopPeriodYear)
    .reduce((sum: number, item: any) => sum + Number(item.paymentAmount || 0), 0);
  const donationsReceived = allDonationRecords
    .filter((item: any) => Number(item.month) === donationPeriodMonth && Number(item.year) === donationPeriodYear)
    .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const rows = records.map((item: any) => ({
    date: `${item.month || '-'}-${item.year || '-'}`,
    title: String(item.title || '-'),
    source: String(item.source || '-'),
    amount: formatCurrency(Number(item.amount || 0))
  }));

  const columns = [common('date'), common('title'), common('source'), common('amount')];

  const normalizedRows = rows.map((item) => ({
    [common('date')]: item.date,
    [common('title')]: item.title,
    [common('source')]: item.source,
    [common('amount')]: item.amount
  }));

  return (
    <>
      <SiteHeader phone={settings.phone} masjidName={settings.masjidName} />
      <main className="mx-auto max-w-7xl px-4 pt-6 lg:px-6">
        <form className="mb-6 grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="min-w-0">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{common('source')}</div>
            <select name="source" defaultValue={selectedSource ?? ''} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
              <option value="">{t('allSources')}</option>
              {sources.map((source) => (
                <option key={source} value={source}>{source}</option>
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
        <div className="mb-6 flex justify-end">
          <DownloadReportButton
            siteTitle={settings.masjidName}
            reportTitle="Income Report"
            periodLabel={buildReportPeriodLabel(selectedMonth, selectedYear)}
            columns={(getResourceConfig('income-records')?.fields ?? []).map((field) => ({
              key: field.name,
              label: field.label,
              type: field.name.toLowerCase() === 'amount' ? 'amount' : field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'
            }))}
            rows={records}
            totals={[{ label: 'Total Amount', value: records.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0) }]}
            paperSettings={settings}
            fileName={`income-report-${buildReportPeriodLabel(selectedMonth, selectedYear).replace(/\s+/g, '-').toLowerCase()}.pdf`}
            label={t('downloadReport')}
          />
        </div>
      </main>
      <SectionPage
        brandLabel={`${common('brandTop')} ${common('brandBottom')}`}
        title={t('income.title')}
        subtitle={t('income.subtitle')}
        summary={[
          { label: common('monthly'), value: formatCurrency(monthly) },
          { label: common('yearly'), value: formatCurrency(yearly) },
          { label: common('entries'), value: formatNumber(records.length) },
          { label: common('shopReceived'), value: formatCurrency(shopReceived) },
          { label: common('donationsReceived'), value: formatCurrency(donationsReceived) }
        ]}
        columns={columns}
        rows={normalizedRows}
        recordsLabel={common('records')}
        noRecordsLabel={common('noRecordsYet')}
      />
      <SiteFooter address={settings.address} phone={settings.phone} email={settings.email} />
    </>
  );
}
