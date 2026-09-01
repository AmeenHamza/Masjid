export const dynamic = 'force-dynamic';

import { getShopRecords, getSiteSettings } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SectionPage } from '@/components/section-page';
import { DownloadReportButton } from '@/components/download-report-button';
import { getTranslations } from 'next-intl/server';
import { formatCurrency } from '@/lib/utils';

const reportMonthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(value: unknown, locale: 'en' | 'ur') {
  if (!value) {
    return '-';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function normalizeMonth(value: unknown, fallback: number) {
  // No param at all -> use the caller's default. An explicit "0" (the "All
  // Months" option) must be respected rather than falling back, so this
  // checks presence first instead of treating 0 as falsy/invalid.
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 12 ? parsed : fallback;
}

function buildPeriodLabel(month: number, year: number) {
  if (month && year) return `${reportMonthNames[month - 1]} ${year}`;
  if (year) return `Year ${year}`;
  if (month) return reportMonthNames[month - 1];
  return 'All Records';
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

function normalizeShopName(value: unknown, fallback: string | null) {
  if (Array.isArray(value)) {
    return String(value[0] ?? '') || fallback;
  }

  const normalized = String(value ?? '').trim();
  return normalized ? normalized : fallback;
}

function getShopRecordMonth(record: Record<string, unknown>) {
  const directMonth = Number(record.month);
  if (Number.isInteger(directMonth) && directMonth >= 1 && directMonth <= 12) {
    return directMonth;
  }

  const sourceDate = record.date || record.buyDate;
  const parsed = new Date(String(sourceDate || ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed.getMonth() + 1;
}

function getShopRecordYear(record: Record<string, unknown>) {
  const directYear = Number(record.year);
  if (Number.isInteger(directYear) && directYear >= 1900) {
    return directYear;
  }

  const sourceDate = record.date || record.buyDate;
  const parsed = new Date(String(sourceDate || ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

export default async function ShopPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const resolvedLocale = locale as 'en' | 'ur';
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const allRecords = await getShopRecords();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  // Rent for a given month is only ever collected the following month (e.g.
  // July's rent comes in during August), so the current calendar month never
  // has any payments recorded against it yet. Default the view to last
  // month instead, which is the most recent period that's actually settled.
  const defaultMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const defaultYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const selectedShopName = normalizeShopName(resolvedSearchParams?.shopName, null);
  const selectedOwnerName = normalizeShopName(resolvedSearchParams?.name, null);
  const selectedMonth = normalizeMonth(resolvedSearchParams?.month, defaultMonth);
  const selectedYear = normalizeYear(resolvedSearchParams?.year, defaultYear);
  const [settings, t, common] = await Promise.all([getSiteSettings(), getTranslations({ locale: resolvedLocale, namespace: 'pages' }), getTranslations({ locale: resolvedLocale, namespace: 'common' })]);
  const numberFormatter = new Intl.NumberFormat(resolvedLocale === 'ur' ? 'ur-PK' : 'en-PK');

  const shopNames = Array.from(new Set(allRecords.map((item: any) => String(item.shopName || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const ownerNames = Array.from(new Set(allRecords
    .filter((item: any) =>
      (!selectedShopName || String(item.shopName || '').trim() === selectedShopName)
    )
    .map((item: any) => String(item.ownerName || '').trim())
    .filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const years = Array.from(new Set(allRecords
    .filter((item: any) =>
      (!selectedShopName || String(item.shopName || '').trim() === selectedShopName)
    )
    .map((item: any) => getShopRecordYear(item) || new Date().getFullYear()))).filter((year) => Number.isInteger(year)).sort((a, b) => b - a);
  if (selectedYear && !years.includes(selectedYear)) {
    years.push(selectedYear);
    years.sort((a, b) => b - a);
  }
  const records = allRecords.filter((item: any) =>
    (!selectedShopName || String(item.shopName || '').trim() === selectedShopName) &&
    (!selectedOwnerName || String(item.ownerName || '').trim() === selectedOwnerName) &&
    (!selectedMonth || getShopRecordMonth(item) === selectedMonth) &&
    (!selectedYear || getShopRecordYear(item) === selectedYear)
  );

  // Selecting a specific Name is what confirms the report is for a real
  // tenant, not just whatever happens to be currently filtered - Shop is
  // optional on top of that (narrows a tenant with multiple shops down to
  // one of them, or covers all of that tenant's shops when left on "All").
  const shopReportReady = Boolean(selectedOwnerName) && records.length > 0;

  const totalShops = records.length;
  const clearShops = records.filter((item: any) => Number(item.debtAmount || 0) === 0).length;
  const totalPaymentReceived = records.reduce((sum: number, item: any) => sum + (Number(item.paymentAmount || 0) || 0), 0);

  const rows = records.map((item: any, index: number) => ({
    [common('serial')]: numberFormatter.format(index + 1),
    [common('date')]: formatDate(item.date || item.buyDate, resolvedLocale),
    [common('month')]: String(getShopRecordMonth(item) || selectedMonth),
    [common('year')]: String(getShopRecordYear(item) || selectedYear),
    [common('shopName')]: String(item.shopName || item.itemName || '-'),
    [common('ownerName')]: String(item.ownerName || '-'),
    [common('status')]: item.vacated ? common('vacated') : common('active'),
    [common('paymentReceived')]: formatCurrency(Number(item.paymentAmount || 0), 'PKR', resolvedLocale),
    [common('shopBalance')]: formatCurrency(Number(item.debtAmount || 0), 'PKR', resolvedLocale)
  }));

  const columns = [common('serial'), common('date'), common('month'), common('year'), common('shopName'), common('ownerName'), common('status'), common('paymentReceived'), common('shopBalance')];

  // Balance color: red if more than one month's rent is owed, green if
  // fully clear, amber for anything owed in between.
  const balanceColors = records.map((item: any) => {
    const debt = Number(item.debtAmount || 0);
    const rent = Number(item.monthlyRent || 0);
    if (debt <= 0) return 'green' as const;
    if (rent > 0 && debt > rent) return 'red' as const;
    return 'amber' as const;
  });

  const normalizedRows = rows;

  return (
    <>
      <SiteHeader phone={settings.phone} masjidName={settings.masjidName} />
      <main className="mx-auto max-w-7xl px-4 pt-6 lg:px-6">
        <form className="mb-6 grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="min-w-0">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{common('shop')}</div>
            <select name="shopName" defaultValue={selectedShopName ?? ''} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
              <option value="">{t('allShops')}</option>
              {shopNames.map((shopName) => (
                <option key={shopName} value={shopName}>{shopName}</option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{common('ownerName')}</div>
            <select name="name" defaultValue={selectedOwnerName ?? ''} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
              <option value="">{t('allOwners')}</option>
              {ownerNames.map((ownerName) => (
                <option key={ownerName} value={ownerName}>{ownerName}</option>
              ))}
            </select>
          </label>
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
        <div className="mb-6 flex justify-end">
          <DownloadReportButton
            siteTitle={settings.masjidName}
            reportTitle="Shop Rent Report"
            periodLabel={buildPeriodLabel(selectedMonth, selectedYear)}
            columns={[
              { key: 'serialNumber', label: 'Serial No.' },
              { key: 'shopName', label: 'Shop Name' },
              { key: 'ownerName', label: 'Rental Name' },
              { key: 'previousBalance', label: 'Previous Balance', type: 'amount' },
              { key: 'date', label: 'Payment Date', type: 'date' },
              { key: 'paymentAmount', label: 'Payment Received', type: 'amount' },
              { key: 'debtAmount', label: 'Remaining Balance', type: 'amount' }
            ]}
            rows={records.map((item: any) => ({ ...item, date: item.date || item.buyDate }))}
            totals={[
              { label: 'Total Rent Received', value: records.reduce((sum: number, item: any) => sum + Number(item.paymentAmount || 0), 0) },
              { label: 'Total Outstanding Balance', value: records.reduce((sum: number, item: any) => sum + Number(item.debtAmount || 0), 0) }
            ]}
            paperSettings={settings}
            fileName={`shop-rent-report-${buildPeriodLabel(selectedMonth, selectedYear).replace(/\s+/g, '-')}.pdf`.toLowerCase()}
            label={t('downloadReport')}
            disabledReason={shopReportReady ? null : 'Select a Name to generate a report.'}
          />
        </div>
      </main>
      <SectionPage
        brandLabel={`${common('brandTop')} ${common('brandBottom')}`}
        title={t('shop.title')}
        subtitle={`${t('shop.subtitle')} ${buildPeriodLabel(selectedMonth, selectedYear)}`}
        summary={[
          { label: common('entries'), value: numberFormatter.format(totalShops) },
          { label: common('clearShops'), value: numberFormatter.format(clearShops) },
          { label: common('paymentReceivedTotal'), value: formatCurrency(totalPaymentReceived, 'PKR', resolvedLocale) }
        ]}
        columns={columns}
        rows={normalizedRows}
        recordsLabel={common('records')}
        noRecordsLabel={common('noRecordsYet')}
        columnColorOverrides={{ column: common('shopBalance'), colors: balanceColors }}
      />
      <SiteFooter address={settings.address} phone={settings.phone} email={settings.email} />
    </>
  );
}
