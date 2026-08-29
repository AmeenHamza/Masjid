import jsPDF from 'jspdf';
import { drawPdfHeader, drawPdfFooter, PRINT_GREEN_RGB, resolvePdfFormat, type PaperSettings } from './print-footer';
import { containsArabicScript, drawWrappedPdfText, wrapArabicText } from './pdf-urdu-text';
import { formatCurrency } from './utils';

export type ReportColumnType = 'text' | 'number' | 'date' | 'amount';

export type ReportColumn = {
  key: string;
  label: string;
  type?: ReportColumnType;
};

export type ReportTotal = {
  label: string;
  value: number;
};

export type MonthlyReportOptions = {
  siteTitle: string;
  reportTitle: string;
  periodLabel: string;
  columns: ReportColumn[];
  rows: Array<Record<string, unknown>>;
  totals?: ReportTotal[];
  paperSettings?: PaperSettings | null;
};

function formatDateCell(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '-';
  const isDateKey = /^\d{4}-\d{2}-\d{2}/.test(raw);
  const date = isDateKey ? new Date(`${raw.slice(0, 10)}T00:00:00Z`) : new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: isDateKey ? 'UTC' : undefined
  }).format(date);
}

function formatCell(value: unknown, type?: ReportColumnType) {
  if (value === null || value === undefined || value === '') return '-';
  if (type === 'amount') return formatCurrency(Number(value) || 0);
  if (type === 'date') return formatDateCell(value);
  return String(value);
}

export function buildMonthlyReportPdf(options: MonthlyReportOptions) {
  const { siteTitle, reportTitle, periodLabel, columns, rows, totals = [], paperSettings = null } = options;

  const { format, orientation } = resolvePdfFormat(paperSettings, 'landscape');
  const pdf = new jsPDF({ orientation, unit: 'mm', format });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginLeft = 12;
  const marginRight = 12;
  const marginTop = 12;
  const bottomReserve = 34 + totals.length * 6;
  let yPosition = marginTop;

  yPosition = drawPdfHeader(pdf, { siteTitle, pageWidth, startY: yPosition + 2 });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(0, 0, 0);
  pdf.text(reportTitle, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text(periodLabel, pageWidth / 2, yPosition, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  yPosition += 6;

  pdf.setDrawColor(...PRINT_GREEN_RGB);
  pdf.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 6;

  const contentWidth = pageWidth - marginLeft - marginRight;
  const colWidth = contentWidth / columns.length;
  const headerRowHeight = 9;
  const lineHeight = 4.2;
  const cellPaddingV = 3;

  function drawTableHeader(y: number) {
    pdf.setFillColor(241, 245, 249);
    pdf.rect(marginLeft, y, contentWidth, headerRowHeight, 'F');
    pdf.setDrawColor(203, 213, 225);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);
    columns.forEach((col, index) => {
      const x = marginLeft + index * colWidth;
      pdf.rect(x, y, colWidth, headerRowHeight);
      pdf.text(col.label, x + colWidth / 2, y + headerRowHeight / 2 + 3, { align: 'center' });
    });
    pdf.setTextColor(0, 0, 0);
    return y + headerRowHeight;
  }

  yPosition = drawTableHeader(yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);

  if (rows.length === 0) {
    pdf.setTextColor(100, 100, 100);
    pdf.text('No records found for this period.', pageWidth / 2, yPosition + 8, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    yPosition += 14;
  } else {
    rows.forEach((row) => {
      const cellTexts = columns.map((col) => formatCell(row[col.key], col.type));
      const cellLineCounts = cellTexts.map((text) =>
        containsArabicScript(text) ? wrapArabicText(text, 8.5, colWidth - 4).length : (pdf.splitTextToSize(text, colWidth - 4) as string[]).length
      );
      const maxLines = Math.max(1, ...cellLineCounts);
      const rowHeight = maxLines * lineHeight + cellPaddingV;

      if (yPosition + rowHeight > pageHeight - bottomReserve) {
        pdf.addPage();
        yPosition = marginTop;
        yPosition = drawTableHeader(yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(0, 0, 0);
      }

      columns.forEach((col, index) => {
        const x = marginLeft + index * colWidth;
        pdf.rect(x, yPosition, colWidth, rowHeight);
        drawWrappedPdfText(pdf, cellTexts[index], x + colWidth / 2, yPosition + cellPaddingV / 2 + lineHeight - 1, 8.5, colWidth - 4, lineHeight, 'center');
      });

      yPosition += rowHeight;
    });
  }

  if (totals.length > 0) {
    yPosition += 6;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    totals.forEach((total) => {
      pdf.setTextColor(...PRINT_GREEN_RGB);
      pdf.text(`${total.label}: ${formatCurrency(total.value)}`, pageWidth - marginRight, yPosition, { align: 'right' });
      yPosition += 6;
    });
    pdf.setTextColor(0, 0, 0);
  }

  drawPdfFooter(pdf, { marginLeft, marginRight, pageWidth, pageHeight });

  return pdf;
}
