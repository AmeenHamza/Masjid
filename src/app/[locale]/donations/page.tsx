export const dynamic = 'force-dynamic';

import { getDonationRecords, getSiteSettings } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SectionPage } from '@/components/section-page';
import { getTranslations } from 'next-intl/server';
import { formatCurrency } from '@/lib/utils';

export default async function DonationsPage() {
  const [settings, t, records] = await Promise.all([getSiteSettings(), getTranslations('pages'), getDonationRecords()]);

  const sumType = (type: string) => records.filter((item: any) => item.type === type).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const rows = records.map((item: any) => ({
    Date: `${item.month || '-'}-${item.year || '-'}`,
    Donor: String(item.donorName || '-'),
    Type: String(item.type || '-'),
    Amount: formatCurrency(Number(item.amount || 0))
  }));

  return (
    <>
      <SiteHeader phone={settings.phone} />
      <SectionPage
        title={t('donations.title')}
        subtitle={t('donations.subtitle')}
        summary={[
          { label: 'Friday', value: formatCurrency(sumType('Friday')) },
          { label: 'Box', value: formatCurrency(sumType('Box')) },
          { label: 'Ramadan', value: formatCurrency(sumType('Ramadan')) },
          { label: 'General', value: formatCurrency(sumType('General')) }
        ]}
        columns={['Date', 'Donor', 'Type', 'Amount']}
        rows={rows}
      />
      <SiteFooter address={settings.address} phone={settings.phone} />
    </>
  );
}
