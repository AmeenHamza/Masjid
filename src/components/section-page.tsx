import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AutoRefresh } from './auto-refresh';

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
      <AutoRefresh />
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 lg:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">{brandLabel}</p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">{subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
            {summary.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{item.label}</div>
                <div className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-emerald-300">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
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
                  <TableCell colSpan={columns.length} className="py-10 text-center text-slate-500 dark:text-slate-400">
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
