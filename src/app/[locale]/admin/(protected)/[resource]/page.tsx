'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { getResourceConfig } from '@/lib/admin-ui';
import { ResourceForm } from '@/components/resource-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

function formatDateValue(value: unknown) {
  if (!value) {
    return '-';
  }

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

function addMonths(value: unknown, months: number) {
  if (!value) {
    return '-';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return formatDateValue(nextDate);
}

function statusClass(status: unknown) {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'clear') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300';
  }

  if (normalized === 'due') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300';
  }

  if (normalized === 'partial') {
    return 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300';
  }

  return 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300';
}

function statusCount(statuses: Record<string, unknown>[], expectedStatus: string) {
  return statuses.filter((record) => String(record.paymentStatus || '').toLowerCase() === expectedStatus).length;
}

function percent(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export default function AdminResourcePage() {
  const params = useParams<{ resource: string }>();
  const resource = getResourceConfig(params.resource);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | undefined>();
  const [formResetToken, setFormResetToken] = useState(0);
  const [shopView, setShopView] = useState<'details' | 'form'>('details');
  const [saveError, setSaveError] = useState<string | null>(null);

  function getNewRecordDefaults(resourceKey: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const todayKey = now.toISOString().slice(0, 10);

    if (resourceKey === 'income-records' || resourceKey === 'expense-records' || resourceKey === 'donations' || resourceKey === 'ramadan-donations' || resourceKey === 'ramadan-expenses') {
      return { month: currentMonth, year: currentYear, amount: 0 };
    }

    if (resourceKey === 'fitrah-records') {
      return { year: currentYear, amount: 0, membersCount: 1 };
    }

    if (resourceKey === 'prayer-times') {
      return { dateKey: todayKey };
    }

    if (resourceKey === 'projects') {
      return { status: 'Incomplete', targetAmount: 0, collectedAmount: 0 };
    }

    if (resourceKey === 'gallery') {
      return { mediaType: 'image', order: 0 };
    }

    if (resourceKey === 'hero-slides') {
      return { order: 0, active: true };
    }

    if (resourceKey === 'shop-records') {
      return {
        buyDate: todayKey,
        monthsDue: 0,
        paymentStatus: 'Clear',
        buyRate: 0,
        debtAmount: 0,
        monthlyRent: 0
      };
    }

    if (resourceKey === 'staff-records') {
      return {
        dateKey: todayKey
      };
    }

    return {};
  }

  useEffect(() => {
    if (!resource) return;
    fetch(resource.apiPath, { credentials: 'include' }).then((response) => response.json()).then((data) => {
      const nextItems = data.items || [];
      setItems(nextItems);
      setSelected(undefined);
      setSaveError(null);
      if (resource.key === 'settings') {
        setSelected(nextItems[0] || {});
      }

      if (resource.key === 'shop-records') {
        setShopView('details');
      }
    });
  }, [resource]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!items[0] || resource?.key === 'shop-records') return [];
    const hiddenKeys = new Set(['_id', '__v', 'addedBy', 'createdAt', 'updatedAt']);

    return Object.keys(items[0]).filter((key) => !hiddenKeys.has(key)).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue }) => {
        const value = String(getValue() ?? '');

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
  }, [items]);

  if (!resource) {
    return <Card>Unknown resource</Card>;
  }

  const currentResource = resource;
  const isSettingsResource = currentResource.key === 'settings';
  const isShopRecordsResource = currentResource.key === 'shop-records';

  async function save(values: Record<string, unknown>) {
    setSaveError(null);
    if (isSettingsResource && !selected?._id) {
      return;
    }

    const normalizedValues = Object.fromEntries(
      currentResource.fields.map((field) => {
        const value = values[field.name];

        if (field.type === 'number') {
          return [field.name, Number(value ?? 0)];
        }

        if (field.type === 'checkbox') {
          return [field.name, Boolean(value)];
        }

        if (field.type === 'date') {
          return [field.name, value ? String(value).slice(0, 10) : undefined];
        }

        if (field.type === 'select') {
          return [field.name, value == null ? '' : String(value)];
        }

        return [field.name, value];
      })
    );
    const method = selected?._id ? 'PATCH' : 'POST';
    const path = selected?._id ? `${currentResource.apiPath}/${selected._id}` : currentResource.apiPath;
    const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(normalizedValues), credentials: 'include' });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string; details?: unknown } | null;
      setSaveError(payload?.message || 'Unable to save record');
      return;
    }

    setSelected(undefined);
    setShopView('details');
    const refreshed = await fetch(currentResource.apiPath, { credentials: 'include' }).then((response) => response.json());
    setItems(refreshed.items || []);
    if (isSettingsResource) {
      setSelected((refreshed.items || [])[0] || {});
    } else {
      setFormResetToken((current) => current + 1);
    }
  }

  async function remove(id: string) {
    await fetch(`${currentResource.apiPath}/${id}`, { method: 'DELETE', credentials: 'include' });
    const refreshed = await fetch(currentResource.apiPath, { credentials: 'include' }).then((response) => response.json());
    setItems(refreshed.items || []);
  }

  function openNewShopRecord() {
    setSelected({
      ...getNewRecordDefaults('shop-records')
    });
    setShopView('form');
  }

  function editShopRecord(record: Record<string, unknown>) {
    setSelected(record);
    setShopView('form');
  }

  function openShopDetails() {
    setSelected(undefined);
    setShopView('details');
  }

  const totalShopAmount = items.reduce((sum, record) => sum + Number(record.buyRate || 0), 0);
  const totalDebtAmount = items.reduce((sum, record) => sum + Number(record.debtAmount || 0), 0);
  const totalMonthlyRentAmount = items.reduce((sum, record) => sum + Number(record.monthlyRent || 0), 0);
  const clearShopCount = statusCount(items, 'clear');
  const dueShopCount = statusCount(items, 'due');
  const partialShopCount = statusCount(items, 'partial');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">{resource.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage {currentResource.title.toLowerCase()} with full CRUD.</p>
        </div>
        {!isSettingsResource ? (
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
            {isShopRecordsResource ? (
              <Button
                variant={shopView === 'details' ? 'default' : 'ghost'}
                size="sm"
                disabled={shopView === 'details'}
                onClick={() => {
                  if (shopView === 'details') {
                    return;
                  }

                  openShopDetails();
                }}
              >
                View Details
              </Button>
            ) : null}
            <Button
              variant={isShopRecordsResource && shopView === 'form' ? 'default' : isShopRecordsResource ? 'ghost' : 'default'}
              disabled={isShopRecordsResource && shopView === 'form'}
              onClick={() => {
                if (isShopRecordsResource) {
                  openNewShopRecord();
                  return;
                }

                setSelected(getNewRecordDefaults(currentResource.key));
              }}
            >
              New Record
            </Button>
          </div>
        ) : null}
      </div>

      {isShopRecordsResource ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Total Shops</div>
                <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{items.length}</div>
                <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-white/10">
                  <div className="h-2 rounded-full bg-emerald-600" style={{ width: '100%' }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Monthly Rent Total</div>
                <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalMonthlyRentAmount, 'PKR', 'en')}</div>
                <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-white/10">
                  <div className="h-2 rounded-full bg-amber-500" style={{ width: `${Math.min(100, percent(totalMonthlyRentAmount, Math.max(totalMonthlyRentAmount, 1)))}%` }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Debt Total</div>
                <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalDebtAmount, 'PKR', 'en')}</div>
                <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-white/10">
                  <div className="h-2 rounded-full bg-rose-500" style={{ width: `${Math.min(100, percent(totalDebtAmount, Math.max(totalShopAmount || totalDebtAmount, 1)))}%` }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Rent Status</div>
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span>Clear</span>
                      <span>{clearShopCount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${percent(clearShopCount, items.length)}%` }} /></div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span>Due</span>
                      <span>{dueShopCount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-2 rounded-full bg-amber-500" style={{ width: `${percent(dueShopCount, items.length)}%` }} /></div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span>Partial</span>
                      <span>{partialShopCount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-2 rounded-full bg-sky-500" style={{ width: `${percent(partialShopCount, items.length)}%` }} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {shopView === 'form' ? (
            <Card>
              <CardHeader>
                <CardTitle>{selected?._id ? 'Edit Shop Record' : 'New Shop Record'}</CardTitle>
                <CardDescription>Enter shop details, rent cycle, and payment status.</CardDescription>
              </CardHeader>
              <CardContent>
                {saveError ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">{saveError}</div> : null}
                <ResourceForm fields={currentResource.fields} defaultValues={selected} onSubmit={save} resetToken={formResetToken} submitLabel={selected?._id ? 'Update' : 'Save'} />
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelected(undefined);
                      setShopView('details');
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {shopView === 'details' && items.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((record, index) => {
                const status = String(record.paymentStatus || '');
                const rentAfterMonths = Number(record.monthsDue || 6);

                return (
                  <Card key={String(record._id || index)} className="overflow-hidden">
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">#{index + 1}</p>
                          <CardTitle className="mt-1 text-xl">{String(record.shopName || '-')}</CardTitle>
                          <CardDescription>{String(record.ownerName || '-')}</CardDescription>
                        </div>
                        <Badge className={statusClass(status)}>{status || 'Unknown'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Contact Number</div>
                          <div className="mt-1 font-medium">{String(record.contactNumber || '-')}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Buy Date</div>
                          <div className="mt-1 font-medium">{formatDateValue(record.buyDate)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Buy Rate (Rs)</div>
                          <div className="mt-1 font-medium">{formatCurrency(Number(record.buyRate || 0), 'PKR', 'en')}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Debt (Rs)</div>
                          <div className="mt-1 font-medium">{formatCurrency(Number(record.debtAmount || 0), 'PKR', 'en')}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Monthly Rent (Rs)</div>
                          <div className="mt-1 font-medium">{formatCurrency(Number(record.monthlyRent || 0), 'PKR', 'en')}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Rent Due After Months</div>
                          <div className="mt-1 font-medium">{rentAfterMonths}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5 sm:col-span-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Next Rent Date</div>
                          <div className="mt-1 font-medium">{addMonths(record.buyDate, rentAfterMonths)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5 sm:col-span-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Note</div>
                          <div className="mt-1 whitespace-pre-wrap font-medium">{String(record.note || '-')}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => editShopRecord(record)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => remove(String(record._id))}>Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-slate-500 dark:text-slate-400">No shop records found yet.</CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <ResourceForm fields={currentResource.fields} defaultValues={selected} onSubmit={save} resetToken={formResetToken} submitLabel={isSettingsResource ? 'Update' : 'Save'} />
        </Card>
      )}

      {!isSettingsResource && !isShopRecordsResource && columns.length ? (
        <DataTable
          columns={[
            ...columns,
            {
              id: 'actions',
              header: 'Actions',
              cell: ({ row }) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelected(row.original)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => remove(String(row.original._id))}>Delete</Button>
                </div>
              )
            }
          ]}
          data={items}
          searchKey={currentResource.searchKeys[0]}
        />
      ) : null}
    </div>
  );
}
