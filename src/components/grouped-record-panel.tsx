'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { DataTable } from './data-table';
import { ResourceForm } from './resource-form';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getResourceConfig, type FieldConfig } from '@/lib/admin-ui';
import { RecordDetailsModal } from './record-details-modal';
import { buildMonthlyReportPdf, type ReportColumn } from '@/lib/monthly-report-pdf';

type GroupTab = {
  key: string;
  label: string;
  resourceKey: string;
  description: string;
  defaultValues?: Record<string, unknown>;
  extraValues?: Record<string, unknown>;
  hideFields?: string[];
};

type Props = {
  title: string;
  subtitle: string;
  tabs: GroupTab[];
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function buildPeriodLabel(month: number, year: number) {
  if (month && year) return `${monthNames[month - 1]} ${year}`;
  if (year) return `Year ${year}`;
  if (month) return monthNames[month - 1];
  return 'All Records';
}

function normalizeValue(field: FieldConfig, value: unknown) {
  if (field.type === 'number') return Number(value ?? 0);
  if (field.type === 'checkbox') return Boolean(value);
  if (field.type === 'date') return value ? String(value).slice(0, 10) : '';
  if (field.type === 'select') return value == null ? '' : String(value);
  return value;
}

function buildColumns(items: Record<string, unknown>[]) {
  const firstItem = items[0];
  if (!firstItem) return [] as ColumnDef<Record<string, unknown>>[];

  const hiddenKeys = new Set(['_id', '__v', 'addedBy', 'createdAt', 'updatedAt']);

  return Object.keys(firstItem)
    .filter((key) => !hiddenKeys.has(key))
    .map((key) => ({
      accessorKey: key,
      header: key,
      cell: (cell: CellContext<Record<string, unknown>, unknown>) => {
        const value = String(cell.getValue() ?? '');

        if (key.toLowerCase().includes('url')) {
          const displayText = value.length > 65 ? `${value.slice(0, 65)}...` : value;
          return (
            <a href={value} target="_blank" rel="noreferrer" className="block max-w-[260px] break-all text-xs text-emerald-700 underline decoration-dotted underline-offset-2 hover:text-emerald-600 dark:text-emerald-300" title={value}>
              {displayText}
            </a>
          );
        }

        return <span className="block max-w-[260px] break-words">{value}</span>;
      }
    }));
}

export function GroupedRecordPanel({ title, subtitle, tabs }: Props) {
  const [activeTabKey, setActiveTabKey] = useState(tabs[0]?.key ?? '');
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState<Record<string, unknown> | null>(null);
  const [formResetToken, setFormResetToken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(0);
  const [filterYear, setFilterYear] = useState(0);
  const [reportSettings, setReportSettings] = useState<{ masjidName?: string; paperSize?: 'A4' | 'Letter' | 'Legal' | 'A5' | 'Custom'; paperWidth?: number; paperHeight?: number }>({});

  useEffect(() => {
    fetch('/api/public/settings')
      .then((res) => res.json())
      .then((data) => setReportSettings({ masjidName: data?.masjidName, paperSize: data?.paperSize, paperWidth: data?.paperWidth, paperHeight: data?.paperHeight }))
      .catch(() => {});
  }, []);

  const activeTab = tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0];
  const resource = activeTab ? getResourceConfig(activeTab.resourceKey) : undefined;
  const fields = useMemo(() => {
    if (!resource) return [];
    const hiddenFields = new Set(activeTab?.hideFields ?? []);
    return resource.fields.filter((field) => !hiddenFields.has(field.name));
  }, [activeTab?.hideFields, resource]);
  const hasMonthField = resource?.fields.some((field) => field.name === 'month') ?? false;
  const hasYearField = resource?.fields.some((field) => field.name === 'year') ?? false;
  const filterYearOptions = useMemo(() => {
    const years = new Set<number>();
    items.forEach((item) => {
      const year = Number(item.year);
      if (Number.isInteger(year) && year > 0) years.add(year);
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesMonth = !hasMonthField || !filterMonth || Number(item.month) === filterMonth;
      const matchesYear = !hasYearField || !filterYear || Number(item.year) === filterYear;
      return matchesMonth && matchesYear;
    });
  }, [items, hasMonthField, hasYearField, filterMonth, filterYear]);
  const columns = useMemo(() => buildColumns(filteredItems), [filteredItems]);
  const defaultValues = selected || activeTab?.defaultValues;

  useEffect(() => {
    if (!resource) return;
    const currentResource = resource;
    let cancelled = false;

    async function load() {
      setSaveError(null);
      const response = await fetch(currentResource.apiPath, { credentials: 'include' });
      const payload = (await response.json()) as { items?: Record<string, unknown>[] };

      if (cancelled) {
        return;
      }

      setItems(payload.items || []);
      setSelected(undefined);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [resource]);

  async function save(values: Record<string, unknown>) {
    if (!resource) return;
    const currentResource = resource;

    setIsSubmitting(true);
    setSaveError(null);

    const payload = Object.fromEntries(fields.map((field) => [field.name, normalizeValue(field, values[field.name])])) as Record<string, unknown>;
    const mergedValues = {
      ...activeTab?.extraValues,
      ...payload
    };

    const method = selected?._id ? 'PATCH' : 'POST';
    const path = selected?._id ? `${currentResource.apiPath}/${selected._id}` : currentResource.apiPath;
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mergedValues),
      credentials: 'include'
    });

    if (!response.ok) {
      const payloadError = (await response.json().catch(() => null)) as { message?: string } | null;
      setSaveError(payloadError?.message || 'Unable to save record');
      setIsSubmitting(false);
      return;
    }

    const refreshed = await fetch(currentResource.apiPath, { credentials: 'include' }).then((response) => response.json()) as { items?: Record<string, unknown>[] };
    setItems(refreshed.items || []);
    setSelected(undefined);
    setFormResetToken((current) => current + 1);
    setIsSubmitting(false);
  }

  async function remove(id: string) {
    if (!resource) return;
    const currentResource = resource;

    await fetch(`${currentResource.apiPath}/${id}`, { method: 'DELETE', credentials: 'include' });
    const refreshed = await fetch(currentResource.apiPath, { credentials: 'include' }).then((response) => response.json()) as { items?: Record<string, unknown>[] };
    setItems(refreshed.items || []);
  }

  function downloadReport() {
    if (!resource || !activeTab) return;
    const periodLabel = buildPeriodLabel(filterMonth, filterYear);
    const reportColumns: ReportColumn[] = fields.map((field) => ({
      key: field.name,
      label: field.label,
      type: field.name.toLowerCase() === 'amount' ? 'amount' : field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'
    }));
    const hasAmountField = fields.some((field) => field.name.toLowerCase() === 'amount');
    const totalAmount = hasAmountField ? filteredItems.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    const pdf = buildMonthlyReportPdf({
      siteTitle: reportSettings.masjidName || 'Masjid',
      reportTitle: `${activeTab.label} Report`,
      periodLabel,
      columns: reportColumns,
      rows: filteredItems,
      totals: hasAmountField ? [{ label: 'Total Amount', value: totalAmount }] : [],
      paperSettings: reportSettings
    });
    pdf.save(`${activeTab.key}-report-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  if (!resource || !activeTab) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="grid gap-2 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/5 md:grid-cols-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTabKey(tab.key);
              setSelected(undefined);
              setSelectedForDetails(null);
              setDetailsOpen(false);
              setSaveError(null);
              setFilterMonth(0);
              setFilterYear(0);
            }}
            className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${activeTab.key === tab.key ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{selected?._id ? `Edit ${activeTab.label}` : `New ${activeTab.label}`}</CardTitle>
          <CardDescription>{activeTab.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {saveError ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">{saveError}</div> : null}
          <ResourceForm
            fields={fields}
            defaultValues={defaultValues}
            onSubmit={save}
            resetToken={formResetToken}
            submitLabel={selected?._id ? 'Update' : 'Save'}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 p-0 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50 px-6 py-5 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Records</h2>
          {hasMonthField || hasYearField ? (
            <div className="flex flex-wrap items-center gap-2">
              {hasMonthField ? (
                <select
                  value={filterMonth}
                  onChange={(event) => setFilterMonth(Number(event.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
                >
                  <option value={0}>All Months</option>
                  {monthNames.map((name, index) => (
                    <option key={name} value={index + 1}>{name}</option>
                  ))}
                </select>
              ) : null}
              {hasYearField ? (
                <select
                  value={filterYear}
                  onChange={(event) => setFilterYear(Number(event.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
                >
                  <option value={0}>All Years</option>
                  {filterYearOptions.map((yearOption) => (
                    <option key={yearOption} value={yearOption}>{yearOption}</option>
                  ))}
                </select>
              ) : null}
              {filterMonth || filterYear ? (
                <Button variant="outline" size="sm" onClick={() => { setFilterMonth(0); setFilterYear(0); }}>
                  Clear Filter
                </Button>
              ) : null}
              <Button size="sm" onClick={downloadReport} disabled={!filteredItems.length} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                Download Report (PDF)
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-400">{filteredItems.length} of {items.length} records</span>
            </div>
          ) : null}
        </div>
        <div className="p-4">
          {columns.length ? (
            <DataTable
              columns={[
                ...columns,
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (cell: CellContext<Record<string, unknown>, unknown>) => (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedForDetails(cell.row.original);
                          setDetailsOpen(true);
                        }}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelected(cell.row.original)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(String(cell.row.original._id))}>Delete</Button>
                    </div>
                  )
                }
              ]}
              data={filteredItems}
              searchKey={resource.searchKeys[0]}
            />
          ) : (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">No records found yet.</div>
          )}
        </div>
      </Card>

        <RecordDetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={`${activeTab.label} Details`}
          record={selectedForDetails}
          fields={fields}
        />
    </div>
  );
}
