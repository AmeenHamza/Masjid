'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { buildPrintFooterHtml, drawPdfFooter, drawPdfHeader, PRINT_FOOTER_STYLES, PRINT_HEADER_CONTACT_LINE, resolvePageSizeCss, resolvePdfFormat } from '@/lib/print-footer';

type SiteSettings = {
  masjidName: string;
  address?: string;
  paperSize?: 'A4' | 'Letter' | 'Legal' | 'A5' | 'Custom';
  paperWidth?: number;
  paperHeight?: number;
};

type PrayerKey = 'fajr' | 'zohar' | 'asr' | 'maghrib' | 'isha';
type AttendanceStatus = 'Present' | 'Absent';

type AttendanceDay = {
  dateKey: string;
  recordId: string | null;
  prayers: Record<PrayerKey, AttendanceStatus>;
  note: string;
};

type MonthResponse = {
  ok: boolean;
  role: string;
  staffName: string | null;
  month: number;
  year: number;
  days: AttendanceDay[];
  summary: { daysCounted: number; fajr: number; zohar: number; asr: number; maghrib: number; isha: number };
};

const prayerLabels: Record<PrayerKey, { en: string; ur: string }> = {
  fajr: { en: 'Fajr', ur: 'فجر' },
  zohar: { en: 'Zohar', ur: 'ظہر' },
  asr: { en: 'Asr', ur: 'عصر' },
  maghrib: { en: 'Maghrib', ur: 'مغرب' },
  isha: { en: 'Isha', ur: 'عشاء' }
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function statusBadgeClass(status: AttendanceStatus) {
  if (status === 'Present') return 'bg-emerald-100 text-emerald-800';
  return 'bg-rose-100 text-rose-700';
}

function formatDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

interface StaffAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'Imam' | 'Muazzin' | 'Khadim';
  staffName: string | null;
  locale?: 'en' | 'ur';
}

export function StaffAttendanceModal({ open, onOpenChange, role, staffName, locale = 'en' }: StaffAttendanceModalProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MonthResponse | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    fetch('/api/public/settings')
      .then((res) => res.json())
      .then((json) => {
        if (mounted) setSettings(json as SiteSettings);
      })
      .catch(() => {
        if (mounted) setSettings(null);
      });
    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    fetch(`/api/public/staff-attendance/history?role=${role}&month=${month}&year=${year}`)
      .then((res) => res.json())
      .then((json) => {
        if (mounted) setData(json as MonthResponse);
      })
      .catch(() => {
        if (mounted) setData(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, role, month, year]);

  const yearOptions = useMemo(() => {
    const current = now.getFullYear();
    return [current - 1, current, current + 1];
  }, [now]);

  const roleLabel = locale === 'ur'
    ? role === 'Imam' ? 'امام' : role === 'Muazzin' ? 'موذن' : 'خادم'
    : role;

  function handlePrint() {
    if (!data) return;
    const siteTitle = settings?.masjidName || 'Masjid';
    const monthLabel = monthNames[month - 1];

    const rowsHtml = data.days.length
      ? data.days.map((day) => `
          <tr>
            <td>${formatDateLabel(day.dateKey)}</td>
            ${(Object.keys(prayerLabels) as PrayerKey[]).map((key) => `<td class="${day.prayers[key] === 'Present' ? 'present' : 'absent'}">${day.prayers[key]}</td>`).join('')}
          </tr>
        `).join('')
      : `<tr><td colspan="6" class="empty">No attendance found for this month.</td></tr>`;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${roleLabel} Attendance - ${monthLabel} ${year}</title>
        <style>
          @page { size: ${resolvePageSizeCss(settings, 'portrait')}; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; color: #222; }
          .print-header { text-align: center; margin-bottom: 16px; }
          .site-name { font-size: 20px; font-weight: 700; color: #0f766e; }
          h1 { text-align: center; color: #075985; margin: 4px 0 4px 0; font-size: 16px; }
          .site-address { font-size: 12px; color: #444; margin-top: 4px; text-align: center; }
          .subtitle { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: center; font-size: 12px; }
          th { background: #f1f5f9; font-weight: 700; }
          td.present { color: #047857; font-weight: 600; }
          td.absent { color: #be123c; font-weight: 600; }
          td.empty { color: #64748b; padding: 20px; }
          .summary-title { margin-top: 20px; font-size: 13px; font-weight: 700; color: #075985; text-align: center; }
          .summary-table { margin-top: 8px; }
          .summary-table th.row-label, .summary-table td.row-label { text-align: left; background: #f1f5f9; font-weight: 700; }
          .summary-table td.present-count { color: #047857; font-weight: 700; }
          .summary-table td.absent-count { color: #be123c; font-weight: 700; }
          .print-footer { margin-top: 20px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 8px; }
          ${PRINT_FOOTER_STYLES}
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="site-name">${siteTitle}</div>
          <div class="site-address">${PRINT_HEADER_CONTACT_LINE}</div>
        </div>
        <h1>${roleLabel} Monthly Attendance${staffName ? ` - ${staffName}` : ''}</h1>
        <div class="subtitle">${monthLabel} ${year}</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Fajr</th>
              <th>Zohar</th>
              <th>Asr</th>
              <th>Maghrib</th>
              <th>Isha</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="summary-title">Monthly Summary (Total Days: ${data.summary.daysCounted})</div>
        <table class="summary-table">
          <thead>
            <tr>
              <th class="row-label">&nbsp;</th>
              ${(Object.keys(prayerLabels) as PrayerKey[]).map((key) => `<th>${prayerLabels[key].en}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-label">Present</td>
              ${(Object.keys(prayerLabels) as PrayerKey[]).map((key) => `<td class="present-count">${data.summary[key]}</td>`).join('')}
            </tr>
            <tr>
              <td class="row-label">Absent</td>
              ${(Object.keys(prayerLabels) as PrayerKey[]).map((key) => `<td class="absent-count">${data.summary.daysCounted - data.summary[key]}</td>`).join('')}
            </tr>
          </tbody>
        </table>
        ${buildPrintFooterHtml()}
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=700');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  function downloadPdf() {
    if (!data) return;
    const siteTitle = settings?.masjidName || 'Masjid';
    const monthLabel = monthNames[month - 1];

    const { format, orientation } = resolvePdfFormat(settings, 'portrait');
    const pdf = new jsPDF({ orientation, unit: 'mm', format });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = 15;
    const marginTop = 15;
    let yPosition = marginTop;

    yPosition = drawPdfHeader(pdf, { siteTitle, pageWidth, startY: yPosition + 3 });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    pdf.text(`${roleLabel} Monthly Attendance${staffName ? ` - ${staffName}` : ''}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${monthLabel} ${year}`, pageWidth / 2, yPosition, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    yPosition += 8;

    pdf.setDrawColor(0, 100, 0);
    pdf.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
    yPosition += 8;

    const prayerKeys = Object.keys(prayerLabels) as PrayerKey[];
    const dateColWidth = 32;
    const prayerColWidth = (pageWidth - marginLeft - marginRight - dateColWidth) / prayerKeys.length;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Date', marginLeft, yPosition);
    prayerKeys.forEach((key, index) => {
      pdf.text(prayerLabels[key].en, marginLeft + dateColWidth + index * prayerColWidth, yPosition);
    });
    yPosition += 2;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'normal');
    if (data.days.length === 0) {
      pdf.setTextColor(100, 100, 100);
      pdf.text('No attendance found for this month.', marginLeft, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 6;
    } else {
      data.days.forEach((day) => {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = marginTop;
        }
        pdf.setTextColor(0, 0, 0);
        pdf.text(formatDateLabel(day.dateKey), marginLeft, yPosition);
        prayerKeys.forEach((key, index) => {
          const status = day.prayers[key];
          if (status === 'Present') {
            pdf.setTextColor(4, 120, 87);
          } else {
            pdf.setTextColor(190, 18, 60);
          }
          pdf.text(status, marginLeft + dateColWidth + index * prayerColWidth, yPosition);
        });
        yPosition += 6;
      });
      pdf.setTextColor(0, 0, 0);
    }

    yPosition += 10;
    if (yPosition > pageHeight - 70) {
      pdf.addPage();
      yPosition = marginTop;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(7, 89, 133);
    pdf.text(`Monthly Summary (Total Days: ${data.summary.daysCounted})`, pageWidth / 2, yPosition, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    yPosition += 6;

    const labelColWidth = 28;
    const summaryColWidth = (pageWidth - marginLeft - marginRight - labelColWidth) / prayerKeys.length;
    const rowHeight = 8;
    const tableTop = yPosition;
    const tableRows: Array<{ label: string; values: number[]; color: [number, number, number] | null }> = [
      { label: '', values: [], color: null },
      { label: 'Present', values: prayerKeys.map((key) => data.summary[key]), color: [4, 120, 87] },
      { label: 'Absent', values: prayerKeys.map((key) => data.summary.daysCounted - data.summary[key]), color: [190, 18, 60] }
    ];

    pdf.setDrawColor(203, 213, 225);
    tableRows.forEach((row, rowIndex) => {
      const rowY = tableTop + rowIndex * rowHeight;
      pdf.rect(marginLeft, rowY, labelColWidth, rowHeight);
      prayerKeys.forEach((_, colIndex) => {
        pdf.rect(marginLeft + labelColWidth + colIndex * summaryColWidth, rowY, summaryColWidth, rowHeight);
      });
    });

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 65, 85);
    prayerKeys.forEach((key, colIndex) => {
      const x = marginLeft + labelColWidth + colIndex * summaryColWidth + summaryColWidth / 2;
      pdf.text(prayerLabels[key].en, x, tableTop + rowHeight / 2 + 3, { align: 'center' });
    });

    tableRows.slice(1).forEach((row, rowIndex) => {
      const rowY = tableTop + (rowIndex + 1) * rowHeight;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(51, 65, 85);
      pdf.text(row.label, marginLeft + 3, rowY + rowHeight / 2 + 3);
      row.values.forEach((value, colIndex) => {
        const x = marginLeft + labelColWidth + colIndex * summaryColWidth + summaryColWidth / 2;
        if (row.color) pdf.setTextColor(...row.color);
        pdf.text(String(value), x, rowY + rowHeight / 2 + 3, { align: 'center' });
      });
    });

    pdf.setTextColor(0, 0, 0);
    yPosition = tableTop + tableRows.length * rowHeight + 6;

    drawPdfFooter(pdf, { marginLeft, marginRight, pageWidth, pageHeight });

    pdf.save(`${roleLabel.toLowerCase()}-attendance-${monthLabel.toLowerCase()}-${year}.pdf`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="sticky top-0 z-10 border-b bg-white pb-4">
          <DialogTitle className="text-xl font-bold text-emerald-900">
            {roleLabel} {locale === 'ur' ? 'کی حاضری' : 'Attendance'} {staffName ? `— ${staffName}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>{name}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {yearOptions.map((yearOption) => (
                <option key={yearOption} value={yearOption}>{yearOption}</option>
              ))}
            </select>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-emerald-700" /> : null}
          </div>

          {data && data.staffName ? (
            <Card className="border-emerald-200 bg-emerald-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-emerald-900">
                {locale === 'ur' ? 'اس مہینے کی کل حاضری' : 'This month\u2019s totals'}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-800 sm:grid-cols-5">
                {(Object.keys(prayerLabels) as PrayerKey[]).map((key) => (
                  <div key={key} className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
                    <div className="font-semibold text-emerald-800">{locale === 'ur' ? prayerLabels[key].ur : prayerLabels[key].en}</div>
                    <div className="mt-1 text-emerald-700">{locale === 'ur' ? 'حاضر' : 'Present'}: {data.summary[key]}</div>
                    <div className="text-rose-700">{locale === 'ur' ? 'غیر حاضر' : 'Absent'}: {data.summary.daysCounted - data.summary[key]}</div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {!loading && data && data.days.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                {locale === 'ur' ? 'اس مہینے کا کوئی ریکارڈ نہیں ملا۔' : 'No attendance found for this month.'}
              </p>
            ) : null}

            {data?.days.map((day) => (
              <div key={day.dateKey} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 text-sm font-semibold text-slate-800">{formatDateLabel(day.dateKey)}</div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {(Object.keys(prayerLabels) as PrayerKey[]).map((key) => (
                    <span
                      key={key}
                      className={`inline-flex flex-col items-center rounded-lg px-2 py-1 text-xs font-semibold ${statusBadgeClass(day.prayers[key])}`}
                    >
                      <span>{locale === 'ur' ? prayerLabels[key].ur : prayerLabels[key].en}</span>
                      <span>{day.prayers[key]}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 mt-4 gap-2 border-t bg-white pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {locale === 'ur' ? 'بند کریں' : 'Close'}
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={!data} className="gap-2">
            <Printer className="h-4 w-4" />
            {locale === 'ur' ? 'پرنٹ' : 'Print'}
          </Button>
          <Button onClick={downloadPdf} disabled={!data} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Download className="h-4 w-4" />
            {locale === 'ur' ? 'پی ڈی ایف ڈاؤن لوڈ کریں' : 'Download PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
