import { GroupedRecordPanel } from '@/components/grouped-record-panel';

export default function RamadanAdminPage() {
  return (
    <GroupedRecordPanel
      title="Ramadan"
      subtitle="Manage Ramadan donation, Ramadan expense, and fitrah records from one place."
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
          defaultValues: { year: new Date().getFullYear(), amount: 0, membersCount: 1 }
        }
      ]}
    />
  );
}
