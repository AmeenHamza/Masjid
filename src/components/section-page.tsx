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

      <Card className="overflow-hidden border-slate-200/80 p-0 dark:border-white/10">
        <div className="border-b border-slate-200/80 bg-slate-50 px-6 py-5 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{recordsLabel}</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-slate-200/80 bg-slate-50 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5">
                {columns.map((column) => (
                  <TableHead key={column} className="px-6 py-4 text-left font-bold text-slate-700 dark:text-slate-300">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row, rowIndex) => {
                  const isEvenRow = rowIndex % 2 === 0;
                  return (
                    <TableRow
                      key={rowIndex}
                      className={`border-b border-slate-100 transition-colors dark:border-white/5 ${isEvenRow ? 'bg-white dark:bg-slate-950/30' : 'bg-slate-50/50 dark:bg-white/[0.02]'} hover:bg-blue-50/50 dark:hover:bg-white/5`}
                    >
                      {columns.map((column) => {
                        const cellValue = row[column] || '-';
                        const isStatusCell = column.toLowerCase().includes('status') || column.toLowerCase().includes('payment');
                        
                        // Determine badge color based on status value
                        let badgeClass = '';
                        if (isStatusCell) {
                          const statusLower = String(cellValue).toLowerCase();
                          if (statusLower === 'clear') {
                            badgeClass = 'inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
                          } else if (statusLower === 'due') {
                            badgeClass = 'inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
                          } else if (statusLower === 'partial') {
                            badgeClass = 'inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300';
                          }
                        }

                        return (
                          <TableCell
                            key={column}
                            className={`px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100 ${column.toLowerCase().includes('serial') ? 'w-12 text-center text-slate-600 dark:text-slate-400' : ''}`}
                          >
                            {badgeClass ? (
                              <span className={badgeClass}>{cellValue}</span>
                            ) : (
                              cellValue
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-12 text-center text-slate-500 dark:text-slate-400">
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
