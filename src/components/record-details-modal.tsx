'use client';

import { useMemo, useState } from 'react';
import { Download, Loader2, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { FieldConfig } from '@/lib/admin-ui';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  record: Record<string, unknown> | null;
  fields?: FieldConfig[];
  historyRecords?: Record<string, unknown>[];
  enableMonthFilter?: boolean;
  onEditRecord?: (record: Record<string, unknown>) => void;
};

type DetailItem = {
  name: string;
  label: string;
  value: unknown;
  type?: FieldConfig['type'];
};

type DetailSection = {
  title: string;
  items: DetailItem[];
  cardClassName: string;
  titleClassName: string;
};

const hiddenKeys = new Set(['_id', '__v', 'addedBy', 'createdAt', 'updatedAt']);

function humanizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: unknown) {
  if (!value) return '-';

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function renderValue(item: DetailItem) {
  const value = item.value;

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (item.type === 'date') {
    return formatDate(value);
  }

  if (item.type === 'checkbox') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'string' && (item.type === 'url' || item.name.toLowerCase().includes('url') || /^https?:\/\//i.test(value))) {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="break-all text-emerald-700 underline decoration-dotted underline-offset-2 hover:text-emerald-600">
        {value}
      </a>
    );
  }

  if (typeof value === 'object') {
    return <pre className="whitespace-pre-wrap break-words font-sans text-sm text-slate-800">{JSON.stringify(value, null, 2)}</pre>;
  }

  return <span className="whitespace-pre-wrap break-words text-slate-800">{String(value)}</span>;
}

function valueAsText(item: DetailItem) {
  const value = item.value;

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (item.type === 'date') {
    return formatDate(value);
  }

  if (item.type === 'checkbox') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function splitSections(items: DetailItem[]) {
  const basicItems = items.filter((item) => {
    const key = item.name.toLowerCase();
    return ['name', 'title', 'donor', 'family', 'owner', 'shop', 'contact', 'source', 'category', 'type'].some((segment) => key.includes(segment));
  });
  const financialItems = items.filter((item) => {
    const key = item.name.toLowerCase();
    return ['date', 'amount', 'rate', 'rent', 'debt', 'month', 'year', 'members', 'memberscount', 'status'].some((segment) => key.includes(segment));
  });
  const noteItems = items.filter((item) => item.name.toLowerCase().includes('note'));
  const remainingItems = items.filter((item) => !basicItems.includes(item) && !financialItems.includes(item) && !noteItems.includes(item));

  return { basicItems, financialItems, remainingItems, noteItems };
}

function buildSections(items: DetailItem[]): DetailSection[] {
  const { basicItems, financialItems, remainingItems, noteItems } = splitSections(items);
  return [
    { title: 'Basic Information', items: basicItems, cardClassName: 'border-emerald-200 bg-emerald-50', titleClassName: 'text-emerald-900' },
    { title: 'Financial Details', items: financialItems, cardClassName: 'border-blue-200 bg-blue-50', titleClassName: 'text-blue-900' },
    { title: 'Details', items: remainingItems, cardClassName: 'border-purple-200 bg-purple-50', titleClassName: 'text-purple-900' },
    { title: 'Notes', items: noteItems, cardClassName: 'border-gray-200 bg-gray-50', titleClassName: 'text-gray-900' }
  ].filter((section) => section.items.length > 0);
}

function buildPdf(title: string, items: DetailItem[], historyRecords: Record<string, unknown>[]) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const marginTop = 15;
  const lineHeight = 6;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let yPosition = marginTop;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(title, marginLeft, yPosition);
  yPosition += 10;

  pdf.setDrawColor(0, 100, 0);
  pdf.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  const sections = buildSections(items);

  for (const section of sections) {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = marginTop;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(section.title, marginLeft, yPosition);
    yPosition += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    for (const item of section.items) {
      const label = `${item.label}:`;
      const value = valueAsText(item);
      const splitValue = pdf.splitTextToSize(value, contentWidth - 55);

      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = marginTop;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text(label, marginLeft, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(splitValue as string[], marginLeft + 48, yPosition);
      yPosition += Math.max(splitValue.length, 1) * lineHeight;
    }

    yPosition += 4;
  }

  if (historyRecords.length > 0) {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = marginTop;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Daily Attendance History', marginLeft, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    for (const entry of historyRecords) {
      if (yPosition > pageHeight - 35) {
        pdf.addPage();
        yPosition = marginTop;
      }

      const line = `${formatHistoryDate(entry.dateKey ?? entry.createdAt)} | Fajr: ${String(entry.fajrAttendance ?? '-')} | Zohar: ${String(entry.zoharAttendance ?? '-')} | Asr: ${String(entry.asrAttendance ?? '-')} | Maghrib: ${String(entry.maghribAttendance ?? '-')} | Isha: ${String(entry.ishaAttendance ?? '-')}`;
      const wrapped = pdf.splitTextToSize(line, contentWidth);
      pdf.text(wrapped as string[], marginLeft, yPosition);
      yPosition += Math.max(1, wrapped.length) * lineHeight;
    }
  }

  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, marginLeft, pageHeight - 10);

  return pdf;
}

function formatHistoryDate(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function RecordDetailsModal({ open, onOpenChange, title, record, fields, historyRecords = [], enableMonthFilter = false, onEditRecord }: Props) {
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const filteredHistoryRecords = useMemo(() => {
    if (!enableMonthFilter) return historyRecords;
    return historyRecords.filter((entry) => {
      const raw = String(entry.dateKey ?? entry.createdAt ?? '').trim();
      const date = /^\d{4}-\d{2}-\d{2}/.test(raw) ? new Date(`${raw.slice(0, 10)}T00:00:00Z`) : new Date(raw);
      if (Number.isNaN(date.getTime())) return false;
      return date.getUTCMonth() + 1 === filterMonth && date.getUTCFullYear() === filterYear;
    });
  }, [enableMonthFilter, historyRecords, filterMonth, filterYear]);

  const totals = useMemo(() => {
    const t = { fajr: 0, zohar: 0, asr: 0, maghrib: 0, isha: 0 };
    for (const entry of filteredHistoryRecords) {
      if (String(entry.fajrAttendance ?? '') === 'Present') t.fajr++;
      if (String(entry.zoharAttendance ?? '') === 'Present') t.zohar++;
      if (String(entry.asrAttendance ?? '') === 'Present') t.asr++;
      if (String(entry.maghribAttendance ?? '') === 'Present') t.maghrib++;
      if (String(entry.ishaAttendance ?? '') === 'Present') t.isha++;
    }
    return t;
  }, [filteredHistoryRecords]);
  const items = useMemo(() => {
    if (!record) return [] as DetailItem[];

    const seen = new Set<string>();
    const nextItems: DetailItem[] = [];

    for (const field of fields ?? []) {
      if (hiddenKeys.has(field.name)) continue;
      seen.add(field.name);
      nextItems.push({
        name: field.name,
        label: field.label,
        value: record[field.name],
        type: field.type
      });
    }

    for (const key of Object.keys(record)) {
      if (hiddenKeys.has(key) || seen.has(key)) continue;
      nextItems.push({
        name: key,
        label: humanizeKey(key),
        value: record[key]
      });
    }

    return nextItems;
  }, [fields, record]);

  const sections = useMemo(() => buildSections(items), [items]);

  function handlePrint() {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20mm; }
            .no-print { display: none; }
          }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; color: #222; }
          .print-header { text-align: center; margin-bottom: 10px; }
          .site-name { font-size: 20px; font-weight: 700; color: #0f766e; }
          .site-address { font-size: 12px; color: #444; margin-top: 4px; }
          .container { max-width: 800px; margin: 0 auto; padding: 18px; border-radius: 6px; }
          h1 { color: #075985; margin: 8px 0 16px 0; font-size: 16px; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 14px; font-weight: 700; color: #065f46; margin-bottom: 10px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .detail-label { font-weight: 600; color: #333; margin-bottom: 4px; }
          .detail-value { color: #444; padding-left: 8px; white-space: pre-wrap; word-break: break-word; }
          .notes-section { grid-column: 1 / -1; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; }
          .print-footer { margin-top: 18px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="print-header">
            <div class="site-name">${title}</div>
          </div>
          <h1>${title}</h1>
          ${sections
            .map((section) => `
              <div class="section">
                <div class="section-title">${section.title}</div>
                <div class="details-grid">
                  ${section.items
                    .map((item) => `
                      <div class="${section.title === 'Notes' ? 'notes-section' : ''}">
                        <div class="detail-label">${item.label}</div>
                        <div class="detail-value">${valueAsText(item)}</div>
                      </div>
                    `)
                    .join('')}
                </div>
              </div>
            `)
            .join('')}
          ${filteredHistoryRecords.length > 0 ? `
            <div class="section">
              <div class="section-title">Daily Attendance History</div>
              <div class="details-grid" style="grid-template-columns: 1fr;">
                ${filteredHistoryRecords
                  .map((entry) => `
                    <div>
                      <div class="detail-label">${formatHistoryDate(entry.dateKey ?? entry.createdAt)}</div>
                      <div class="detail-value">
                        Fajr: ${String(entry.fajrAttendance ?? '-')} | Zohar: ${String(entry.zoharAttendance ?? '-')} | Asr: ${String(entry.asrAttendance ?? '-')} | Maghrib: ${String(entry.maghribAttendance ?? '-')} | Isha: ${String(entry.ishaAttendance ?? '-')}
                      </div>
                    </div>
                  `)
                  .join('')}
              </div>
            </div>
          ` : ''}
          <div class="print-footer">Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  async function generatePDF() {
    setIsLoadingPdf(true);
    try {
      const pdf = buildPdf(title, items, filteredHistoryRecords);
      pdf.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } finally {
      setIsLoadingPdf(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="sticky top-0 z-10 border-b bg-white pb-4">
          <DialogTitle className="text-2xl font-bold text-emerald-900">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pr-6">
          {sections.map((section) => (
            <Card key={section.title} className={`${section.cardClassName} p-6`}>
              <h3 className={`mb-4 text-lg font-semibold ${section.titleClassName}`}>{section.title}</h3>
              {section.title === 'Notes' ? (
                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div key={item.name}>
                      <div className="mb-1 block text-sm font-medium text-gray-700">{item.label}</div>
                      <div className="text-gray-900 whitespace-pre-wrap">{renderValue(item)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {section.items.map((item) => (
                    <DetailField key={item.name} label={item.label} value={renderValue(item)} />
                  ))}
                </div>
              )}
            </Card>
          ))}

          {historyRecords.length > 0 ? (
            <Card className="border-amber-200 bg-amber-50 p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-amber-900">Daily Attendance History</h3>
                {enableMonthFilter ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={filterMonth}
                      onChange={(event) => setFilterMonth(Number(event.target.value))}
                      className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-sm"
                    >
                      {Array.from({ length: 12 }, (_, index) => index + 1).map((monthOption) => (
                        <option key={monthOption} value={monthOption}>
                          {new Date(0, monthOption - 1).toLocaleString('en-US', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filterYear}
                      onChange={(event) => setFilterYear(Number(event.target.value))}
                      className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-sm"
                    >
                      {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((yearOption) => (
                        <option key={yearOption} value={yearOption}>{yearOption}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
              <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-1">
                {filteredHistoryRecords.length === 0 ? (
                  <p className="py-6 text-center text-sm text-amber-700">No attendance found for the selected month.</p>
                ) : null}
                {filteredHistoryRecords.map((entry) => (
                  <div key={String(entry._id ?? Math.random())} className="rounded-xl border border-amber-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-800">
                        {formatHistoryDate(entry.dateKey ?? entry.createdAt)}
                      </div>
                      {onEditRecord ? (
                        <Button variant="outline" size="sm" onClick={() => onEditRecord(entry)}>
                          Edit
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-700 md:grid-cols-5">
                      <span>Fajr: {String(entry.fajrAttendance ?? '-')}</span>
                      <span>Zohar: {String(entry.zoharAttendance ?? '-')}</span>
                      <span>Asr: {String(entry.asrAttendance ?? '-')}</span>
                      <span>Maghrib: {String(entry.maghribAttendance ?? '-')}</span>
                      <span>Isha: {String(entry.ishaAttendance ?? '-')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
              ) : null}

              {historyRecords.length > 0 ? (
                <Card className="border-emerald-200 bg-emerald-50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-emerald-900">Attendance Summary</h3>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-5 text-sm text-slate-800">
                    <div className="font-medium">Days Recorded</div>
                    <div>{filteredHistoryRecords.length}</div>
                    <div className="font-medium">Fajr Present</div>
                    <div>{totals.fajr}</div>
                    <div className="font-medium">Zohar Present</div>
                    <div>{totals.zohar}</div>
                    <div className="font-medium">Asr Present</div>
                    <div>{totals.asr}</div>
                    <div className="font-medium">Maghrib Present</div>
                    <div>{totals.maghrib}</div>
                    <div className="font-medium">Isha Present</div>
                    <div>{totals.isha}</div>
                  </div>
                </Card>
              ) : null}
        </div>

        <DialogFooter className="sticky bottom-0 mt-6 gap-2 border-t bg-white pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={generatePDF} disabled={isLoadingPdf} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {isLoadingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="font-medium text-slate-900">{value}</div>
    </div>
  );
}