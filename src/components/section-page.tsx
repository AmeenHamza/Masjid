import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

type SectionPageProps = {
  brandLabel: string;
  title: string;
  subtitle: string;
  summary: Array<{ label: string; value: string }>;
  rows: Array<Record<string, string>>;
  columns: string[];
  recordsLabel: string;
  noRecordsLabel: string;
};

export function SectionPage({ brandLabel, title, subtitle, summary, rows, columns, recordsLabel, noRecordsLabel }: SectionPageProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">{brandLabel}</p>
        <h1 className="mt-3 text-4xl font-black">{title}</h1>
        <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label} className="p-5">
            <div className="text-sm text-slate-500 dark:text-slate-400">{item.label}</div>
            <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">{item.value}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <h2 className="text-lg font-bold">{recordsLabel}</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column) => (
                      <TableCell key={column}>{row[column] || '-'}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-10 text-center text-slate-500">
                    {noRecordsLabel}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </main>
  );
}
