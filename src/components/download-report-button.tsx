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
};

export function DownloadReportButton({ siteTitle, reportTitle, periodLabel, columns, rows, totals, paperSettings, fileName, label }: Props) {
  function handleClick() {
    const pdf = buildMonthlyReportPdf({ siteTitle, reportTitle, periodLabel, columns, rows, totals, paperSettings });
    pdf.save(fileName);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!rows.length}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
