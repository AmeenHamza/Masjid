import { GroupedRecordPanel } from '@/components/grouped-record-panel';

export default function RamadanAdminPage() {
  return (
    <GroupedRecordPanel
      title="Ramadan"
      subtitle="Manage Ramadan donation, Ramadan expense, fitrah, and zakat records from one place."
      tabs={[
        {
          key: 'ramadan-donation',
          label: 'Ramadan Donation',
          resourceKey: 'ramadan-donations',
          description: 'Ramadan donation records with donor name, amount, month, year, and note.',
          defaultValues: { amount: 0 }
        },
        {
          key: 'ramadan-expense',
          label: 'Ramadan Expense',
          resourceKey: 'ramadan-expenses',
          description: 'Ramadan expense records with title, amount, month, year, and note.',
          defaultValues: { amount: 0 }
        },
        {
          key: 'fitrah',
          label: 'Fitrah',
          resourceKey: 'fitrah-records',
          description: 'Fitrah records with family name, member count, amount, year, and note.',
          defaultValues: { type: 'Fitrah', year: new Date().getFullYear(), amount: 0, membersCount: 1 },
          extraValues: { type: 'Fitrah' },
          hideFields: ['type']
        },
        {
          key: 'zakat',
          label: 'Zakat',
          resourceKey: 'fitrah-records',
          description: 'Zakat records with family/payer name, member count, amount, year, and note.',
          defaultValues: { type: 'Zakat', year: new Date().getFullYear(), amount: 0, membersCount: 1 },
          extraValues: { type: 'Zakat' },
          hideFields: ['type']
        }
      ]}
    />
  );
}
