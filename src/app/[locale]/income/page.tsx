export const dynamic = 'force-dynamic';

import { getSiteSettings } from '@/lib/public-data';
import { getIncomeRecords } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SectionPage } from '@/components/section-page';
import { getTranslations } from 'next-intl/server';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default async function IncomePage() {
  const [settings, t, records] = await Promise.all([getSiteSettings(), getTranslations('pages'), getIncomeRecords()]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthly = records.filter((item: any) => item.month === currentMonth && item.year === currentYear).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const yearly = records.filter((item: any) => item.year === currentYear).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const rows = records.map((item: any) => ({
    Date: `${item.month || '-'}-${item.year || '-'}`,
    Title: String(item.title || '-'),
    Source: String(item.source || '-'),
    Amount: formatCurrency(Number(item.amount || 0))
  }));

  return (
    <>
      <SiteHeader phone={settings.phone} />
      <SectionPage
        title={t('income.title')}
        subtitle={t('income.subtitle')}
        summary={[
          { label: 'Monthly', value: formatCurrency(monthly) },
          { label: 'Yearly', value: formatCurrency(yearly) },
          { label: 'Entries', value: formatNumber(records.length) }
        ]}
        columns={['Date', 'Title', 'Source', 'Amount']}
        rows={rows}
      />
      <SiteFooter address={settings.address} phone={settings.phone} />
    </>
  );
}
