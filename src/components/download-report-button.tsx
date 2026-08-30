'use client';

import { Download } from 'lucide-react';
import { buildMonthlyReportPdf, type ReportColumn, type ReportTotal } from '@/lib/monthly-report-pdf';
import type { PaperSettings } from '@/lib/print-footer';

type Props = {
  siteTitle: string;
  reportTitle: string;
  periodLabel: string;
  columns: ReportColumn[];
  rows: Array<Record<string, unknown>>;
  totals?: ReportTotal[];
  paperSettings?: PaperSettings | null;
  fileName: string;
  label: string;
  // Extra gate on top of "there's data to show" - e.g. requiring two
  // filters to both be set to a specific (matching) value before a report
  // is allowed to generate. Shown as a small hint under the button.
  disabledReason?: string | null;
};

export function DownloadReportButton({ siteTitle, reportTitle, periodLabel, columns, rows, totals, paperSettings, fileName, label, disabledReason }: Props) {
  const isDisabled = !rows.length || Boolean(disabledReason);

  function handleClick() {
    const pdf = buildMonthlyReportPdf({ siteTitle, reportTitle, periodLabel, columns, rows, totals, paperSettings });
    pdf.save(fileName);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {label}
      </button>
      {disabledReason ? <span className="text-xs text-amber-700 dark:text-amber-400">{disabledReason}</span> : null}
    </div>
  );
}
