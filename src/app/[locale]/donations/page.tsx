export const dynamic = 'force-dynamic';

import { getDonationRecords, getSiteSettings } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SectionPage } from '@/components/section-page';
import { getTranslations } from 'next-intl/server';
import { formatCurrency } from '@/lib/utils';

export default async function DonationsPage() {
  const [settings, t, common, records] = await Promise.all([getSiteSettings(), getTranslations('pages'), getTranslations('common'), getDonationRecords()]);

  const sumType = (type: string) => records.filter((item: any) => item.type === type).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const rows = records.map((item: any) => ({
    date: `${item.month || '-'}-${item.year || '-'}`,
    donor: String(item.donorName || '-'),
    type: String(item.type || '-'),
    amount: formatCurrency(Number(item.amount || 0))
  }));

  const columns = [common('date'), common('donor'), common('type'), common('amount')];

  const normalizedRows = rows.map((item) => ({
    [common('date')]: item.date,
    [common('donor')]: item.donor,
    [common('type')]: item.type,
    [common('amount')]: item.amount
  }));

  return (
    <>
      <SiteHeader phone={settings.phone} />
      <SectionPage
        brandLabel={`${common('brandTop')} ${common('brandBottom')}`}
        title={t('donations.title')}
        subtitle={t('donations.subtitle')}
        summary={[
          { label: common('friday'), value: formatCurrency(sumType('Friday')) },
          { label: common('box'), value: formatCurrency(sumType('Box')) },
          { label: common('ramadan'), value: formatCurrency(sumType('Ramadan')) },
          { label: common('general'), value: formatCurrency(sumType('General')) }
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
