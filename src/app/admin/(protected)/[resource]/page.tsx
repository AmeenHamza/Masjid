'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import { getResourceConfig } from '@/lib/admin-ui';
import { ResourceForm } from '@/components/resource-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ShopDetailsModal } from '@/components/shop-details-modal';
import { RecordDetailsModal } from '@/components/record-details-modal';

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

function getShopKey(record: Record<string, unknown> | null | undefined) {
  if (!record || typeof record !== 'object') {
    return '';
  }

  const shopName = String((record as Record<string, unknown>).shopName ?? '').trim();
  const ownerName = String((record as Record<string, unknown>).ownerName ?? '').trim();
  return [shopName, ownerName].filter(Boolean).join('|');
}

function getLatestShopRecord(records: Record<string, unknown>[], shopKey: string) {
  const matches = records.filter((record) => getShopKey(record) === shopKey);
  return matches.sort((a, b) => ((Number(b.year || 0) * 100) + Number(b.month || 0)) - ((Number(a.year || 0) * 100) + Number(a.month || 0)))[0];
}

function getNextMonthYear(month: number, year: number) {
  if (month === 12) {
    return { month: 1, year: year + 1 };
  }

  return { month: month + 1, year };
}

function getNewRecordDefaults(resourceKey: string) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const todayKey = now.toISOString().slice(0, 10);

  if (resourceKey === 'income-records' || resourceKey === 'expense-records' || resourceKey === 'donations' || resourceKey === 'ramadan-donations' || resourceKey === 'ramadan-expenses') {
    if (resourceKey === 'income-records') {
      return { date: todayKey, month: currentMonth, year: currentYear, amount: 0 };
    }

    if (resourceKey === 'donations' || resourceKey === 'ramadan-donations' || resourceKey === 'ramadan-expenses') {
      return { date: todayKey, month: currentMonth, year: currentYear, amount: 0 };
    }

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
      date: todayKey,
      buyDate: todayKey,
      monthsDue: 0,
      paymentStatus: 'Clear',
      buyRate: 0,
      debtAmount: 0,
      monthlyRent: 0,
      month: currentMonth,
      year: currentYear
    };
  }

  if (resourceKey === 'staff-records') {
    return {
      dateKey: todayKey
    };
  }

  return {};
}

export default function AdminResourcePage() {
  const params = useParams<{ resource: string }>();
  const resource = getResourceConfig(params.resource);
  const t = useTranslations('admin');
  const tToast = useTranslations('toast');
  const tCommon = useTranslations('common');
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formResetToken, setFormResetToken] = useState(0);
  const [shopDetailsOpen, setShopDetailsOpen] = useState(false);
  const [selectedShopForDetails, setSelectedShopForDetails] = useState<Record<string, unknown> | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState<Record<string, unknown> | null>(null);
  const [detailsHistoryRecords, setDetailsHistoryRecords] = useState<Record<string, unknown>[]>([]);
  const [disabledFields, setDisabledFields] = useState<string[]>([]);
  const [newStaffMode, setNewStaffMode] = useState(false);
  const [paymentShopId, setPaymentShopId] = useState<string>('');
  const [paymentMonth, setPaymentMonth] = useState<number>(new Date().getMonth() + 1);
  const [paymentYear, setPaymentYear] = useState<number>(new Date().getFullYear());
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentStatusForShop, setPaymentStatusForShop] = useState<'Clear' | 'Due' | 'Partial'>('Clear');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

  async function loadItems() {
    if (!resource) return;

    setLoading(true);
    try {
      const response = await fetch(resource.apiPath, { credentials: 'include' });
      const data = await response.json();
      const nextItems = data.items || [];
      setItems(nextItems);
      if (resource.key === 'settings') {
        setSelected(nextItems[0] || {});
      }
    } catch {
      toast.error(tToast('failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }

  function handlePaymentShopChange(shopKey: string) {
    setPaymentShopId(shopKey);
    const latestShopRecord = getLatestShopRecord(items, shopKey);
    const shop = latestShopRecord as Record<string, unknown> | undefined;
    setPaymentAmount(shop ? String(shop.monthlyRent ?? '') : '');
    setPaymentStatusForShop(shop ? (String(shop.paymentStatus || 'Clear') as 'Clear' | 'Due' | 'Partial') : 'Clear');
    setPaymentNote('');
    const now = new Date();
    const defaultMonth = Number(shop?.month || now.getMonth() + 1);
    const defaultYear = Number(shop?.year || now.getFullYear());
    const nextMonthYear = getNextMonthYear(defaultMonth, defaultYear);
    setPaymentMonth(shop ? nextMonthYear.month : now.getMonth() + 1);
    setPaymentYear(shop ? nextMonthYear.year : now.getFullYear());
    setPaymentError(null);
  }

  async function saveShopPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaymentError(null);
    setIsPaymentSubmitting(true);

    const latestShopRecord = getLatestShopRecord(items, paymentShopId);
    const shop = latestShopRecord as Record<string, unknown> | undefined;
    if (!shop) {
      setPaymentError('Please select a valid shop.');
      setIsPaymentSubmitting(false);
      return;
    }

    const previousDebt = Number(shop.debtAmount ?? 0);
    const currentMonthlyRent = Number(shop.monthlyRent || 0);
    const totalDueBeforePayment = previousDebt + currentMonthlyRent;
    const paidAmount = Number(paymentAmount || 0);

    if (paymentStatusForShop === 'Partial' && (Number.isNaN(paidAmount) || paidAmount <= 0)) {
      setPaymentError('Please enter a valid payment amount for partial status.');
      setIsPaymentSubmitting(false);
      return;
    }

    let computedStatus: 'Clear' | 'Due' | 'Partial' = paymentStatusForShop;
    let computedDebt = totalDueBeforePayment;
    let paymentAmountToSave = 0;

    if (paymentStatusForShop === 'Clear') {
      computedStatus = 'Clear';
      computedDebt = 0;
      paymentAmountToSave = totalDueBeforePayment;
    } else if (paymentStatusForShop === 'Partial') {
      if (paidAmount >= totalDueBeforePayment) {
        computedStatus = 'Clear';
        computedDebt = 0;
        paymentAmountToSave = totalDueBeforePayment;
      } else {
        computedStatus = 'Partial';
        computedDebt = totalDueBeforePayment - paidAmount;
        paymentAmountToSave = paidAmount;
      }
    } else {
      computedStatus = 'Due';
      computedDebt = totalDueBeforePayment;
      paymentAmountToSave = 0;
    }

    const payload = {
      shopName: String(shop.shopName || ''),
      ownerName: String(shop.ownerName || ''),
      contactNumber: String(shop.contactNumber || ''),
      debtAmount: computedDebt,
      monthlyRent: currentMonthlyRent,
      monthsDue: Number(shop.monthsDue || 0),
      month: paymentMonth,
      year: paymentYear,
      paymentStatus: computedStatus,
      paymentAmount: paymentAmountToSave,
      note: paymentNote?.trim() ? String(paymentNote).trim() : String(shop.note ?? ''),
      date: new Date().toISOString().slice(0, 10)
    };

    try {
      const response = await fetch(currentResource.apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const responseData = await response.json().catch(() => null) as { ok?: boolean; item?: Record<string, unknown>; message?: string } | null;
      if (!response.ok || !responseData?.ok) {
        setPaymentError(responseData?.message || 'Unable to update shop payment.');
        return;
      }

      await loadItems();
      setSelectedShopForDetails(responseData.item ?? shop);
      setShopDetailsOpen(true);
      setPaymentShopId('');
      setPaymentAmount('');
      setPaymentStatusForShop('Clear');
      setPaymentNote('');
      setPaymentMonth(new Date().getMonth() + 1);
      setPaymentYear(new Date().getFullYear());
      setPaymentError(null);
      toast.success(tToast('updatedSuccessfully'));
    } catch {
      setPaymentError('Unable to update shop payment.');
    } finally {
      setIsPaymentSubmitting(false);
    }
  }

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!resource || !items[0]) return [];
    const hiddenKeys = new Set(['_id', '__v', 'addedBy', 'createdAt', 'updatedAt']);

    if (resource.key === 'shop-records') {
      return [
        {
          id: 'serial',
          header: '#',
          cell: ({ row }: { row: { index: number } }) => row.index + 1
        },
        {
          accessorKey: 'shopName',
          header: 'Shop Name',
          cell: ({ getValue }: { getValue: () => unknown }) => (
            <span className="block max-w-[260px] break-words">{String(getValue() ?? '')}</span>
          )
        },
        {
          accessorKey: 'ownerName',
          header: 'Owner Name',
          cell: ({ getValue }: { getValue: () => unknown }) => (
            <span className="block max-w-[260px] break-words">{String(getValue() ?? '')}</span>
          )
        },
        {
          accessorKey: 'monthlyRent',
          header: 'Monthly Rent',
          cell: ({ getValue }: { getValue: () => unknown }) => (
            <span className="block max-w-[260px] break-words">{formatCurrency(Number(getValue() ?? 0))}</span>
          )
        },
        {
          accessorKey: 'paymentStatus',
          header: 'Payment Status',
          cell: ({ getValue }: { getValue: () => unknown }) => {
            const status = String(getValue() ?? '');
            return (
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  status === 'Clear'
                    ? 'bg-green-100 text-green-800'
                    : status === 'Due'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {status}
              </span>
            );
          }
        }
      ];
    }

    return Object.keys(items[0]).filter((key) => !hiddenKeys.has(key)).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const value = String(getValue() ?? '');

        if (key.toLowerCase().includes('url')) {
          const displayText = value.length > 65 ? `${value.slice(0, 65)}...` : value;
          return (
            <a href={value} target="_blank" rel="noreferrer" className="block max-w-[260px] break-all text-xs text-emerald-700 underline decoration-dotted underline-offset-2 hover:text-emerald-600" title={value}>
              {displayText}
            </a>
          );
        }

        return <span className="block max-w-[260px] break-words">{value}</span>;
      }
    }));
  }, [items, resource]);

  if (!resource) {
    return <Card>{t('unknownResource')}</Card>;
  }

  const currentResource = resource;
  const isSettingsResource = currentResource.key === 'settings';
  const selectedPaymentShop = getLatestShopRecord(items, paymentShopId) as Record<string, unknown> | undefined;
  const currentDueAmount = Number(selectedPaymentShop?.debtAmount ?? 0) + Number(selectedPaymentShop?.monthlyRent ?? 0);
  const managingResourcesText = t('managingResources', { resource: currentResource.title.toLowerCase() });
  const selectedPaymentMonthLabel = paymentMonth ? new Date(0, paymentMonth - 1).toLocaleString('en-US', { month: 'long' }) : '-';
  const shopSummaryItems = useMemo(() => {
    const grouped = new Map<string, Record<string, unknown>>();

    items.forEach((record) => {
      const key = getShopKey(record);
      if (!key) return;

      const existing = grouped.get(key);
      const currentRank = Number(record.year || 0) * 100 + Number(record.month || 0);
      const existingRank = existing ? Number(existing.year || 0) * 100 + Number(existing.month || 0) : -1;

      if (!existing || currentRank > existingRank) {
        grouped.set(key, record);
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      const aRank = Number(a.year || 0) * 100 + Number(a.month || 0);
      const bRank = Number(b.year || 0) * 100 + Number(b.month || 0);
      return bRank - aRank;
    });
  }, [items]);

  const staffSummaryItems = useMemo(() => {
    const grouped = new Map<string, Record<string, unknown>>();

    items.forEach((record) => {
      const name = String(record.staffName ?? '').trim();
      const role = String(record.role ?? '').trim();
      if (!name) return;
      const key = `${name}|${role}`;

      const existing = grouped.get(key);
      const currentRank = new Date(String(record.dateKey ?? record.createdAt ?? 0)).getTime();
      const existingRank = existing ? new Date(String(existing.dateKey ?? existing.createdAt ?? 0)).getTime() : -1;

      if (!existing || currentRank > existingRank) {
        grouped.set(key, record);
      }
    });

    return Array.from(grouped.values()).sort((a, b) => new Date(String(b.dateKey ?? b.createdAt ?? 0)).getTime() - new Date(String(a.dateKey ?? a.createdAt ?? 0)).getTime());
  }, [items]);

  async function save(values: Record<string, unknown>) {
    setSaving(true);
    const isUpdate = Boolean(selected?._id);

    if (isSettingsResource && !isUpdate) {
      toast.error(tToast('unableToSaveRecord'));
      setSaving(false);
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

        return [field.name, value];
      })
    );

    try {
      const method = isUpdate ? 'PATCH' : 'POST';
      const path = isUpdate ? `${currentResource.apiPath}/${selected?._id}` : currentResource.apiPath;
      const response = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedValues),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(errorPayload?.message || 'Save failed');
      }

      setSelected(undefined);
      setDisabledFields([]);
      setNewStaffMode(false);
      await loadItems();
      if (!isSettingsResource) {
        setFormResetToken((current) => current + 1);
      }
      toast.success(isUpdate ? tToast('updatedSuccessfully') : tToast('savedSuccessfully'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tToast('unableToSaveRecord'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeletingId(id);

    try {
      const response = await fetch(`${currentResource.apiPath}/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) {
        throw new Error('Delete failed');
      }

      await loadItems();
      toast.success(tToast('deletedSuccessfully'));
    } catch {
      toast.error(tToast('unableToDeleteRecord'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5 lg:space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{resource.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{managingResourcesText}</p>
        </div>
        {!isSettingsResource ? <Button onClick={() => {
          if (currentResource.key === 'staff-records') {
            const defaults = getNewRecordDefaults('staff-records');
            setSelected(defaults);
            const toDisable = currentResource.fields.map((f) => f.name).filter((n) => !['staffName', 'role'].includes(n));
            setDisabledFields(toDisable);
            setNewStaffMode(true);
          } else {
            setSelected(getNewRecordDefaults(currentResource.key));
            setDisabledFields([]);
            setNewStaffMode(false);
          }
        }} className="w-full sm:w-auto">{t('newRecord')}</Button> : null}
      </div>

      {currentResource.key === 'shop-records' ? (
        <Card className="border-emerald-900/10 bg-white/85 shadow-lg">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Update Shop Rent Payment</h2>
            {isPaymentSubmitting ? (
              <span className="inline-flex items-center gap-2 text-sm text-emerald-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Updating...
              </span>
            ) : null}
          </div>
          {paymentError ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{paymentError}</div> : null}
          <form className="space-y-4" onSubmit={saveShopPayment}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="min-w-0">
                <div className="mb-2 text-sm font-semibold">Select Shop</div>
                <select
                  value={paymentShopId}
                  onChange={(event) => handlePaymentShopChange(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Select a shop</option>
                  {Array.from(new Map(items.map((shop) => [getShopKey(shop), shop])).values()).map((shop) => {
                    const shopKey = getShopKey(shop);
                    return (
                      <option key={shopKey} value={shopKey}>{String(shop.shopName || '-')}{shop.ownerName ? ` — ${String(shop.ownerName)}` : ''}</option>
                    );
                  })}
                </select>
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current Due</div>
                <div className="mt-2 text-xl font-black text-slate-900">{formatCurrency(currentDueAmount)}</div>
                <div className="mt-2 text-sm text-slate-600">Entry will be saved for {selectedPaymentMonthLabel} {paymentYear}</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current Status</div>
                <div className="mt-2 font-medium text-slate-900">{String(selectedPaymentShop?.paymentStatus ?? '-')}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Monthly Rent</div>
                <div className="mt-2 font-medium text-slate-900">{formatCurrency(Number(selectedPaymentShop?.monthlyRent ?? 0))}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Last Recorded Month</div>
                <div className="mt-2 font-medium text-slate-900">{String(selectedPaymentShop?.month ?? '-')} / {String(selectedPaymentShop?.year ?? '-')}</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="min-w-0">
                <div className="mb-2 text-sm font-semibold">Payment Amount (Rs)</div>
                <input
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                  required={paymentStatusForShop === 'Partial'}
                />
              </label>

              <label className="min-w-0">
                <div className="mb-2 text-sm font-semibold">Month</div>
                <select
                  value={paymentMonth}
                  onChange={(event) => setPaymentMonth(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="min-w-0">
                <div className="mb-2 text-sm font-semibold">Year</div>
                <input
                  value={paymentYear}
                  onChange={(event) => setPaymentYear(Number(event.target.value))}
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>

              <label className="min-w-0">
                <div className="mb-2 text-sm font-semibold">Payment Status</div>
                <select
                  value={paymentStatusForShop}
                  onChange={(event) => setPaymentStatusForShop(event.target.value as 'Clear' | 'Due' | 'Partial')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Clear">Clear</option>
                  <option value="Partial">Partial</option>
                  <option value="Due">Due</option>
                </select>
              </label>
            </div>

            <label className="block">
              <div className="mb-2 text-sm font-semibold">Note</div>
              <textarea
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                rows={4}
              />
            </label>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" disabled={isPaymentSubmitting}>
                {isPaymentSubmitting ? 'Updating...' : 'Save Payment Update'}
              </Button>
              <Button type="button" variant="outline" onClick={() => handlePaymentShopChange('')}>
                Reset
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="border-emerald-900/10 bg-white/85 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{isSettingsResource ? t('viewRecord') : (selected?._id ? t('editRecord') : t('createRecord'))}</h2>
          {saving ? (
            <span className="inline-flex items-center gap-2 text-sm text-emerald-700">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('saving')}
            </span>
          ) : null}
        </div>
        <ResourceForm
          fields={currentResource.fields}
          defaultValues={selected}
          onSubmit={save}
          isSubmitting={saving}
          resetToken={formResetToken}
          disabledFields={disabledFields}
          submitLabel={isSettingsResource ? t('update') : (selected?._id ? t('update') : tCommon('save'))}
        />
      </Card>

      {!isSettingsResource && loading ? (
        <Card className="flex items-center justify-center py-12">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('loadingRecords')}
          </div>
        </Card>
      ) : !isSettingsResource && columns.length ? (
        <>
          <DataTable
            columns={[
              ...columns,
              {
                id: 'actions',
                header: t('actions'),
                cell: ({ row }) => (
                  <div className="flex gap-2">
                    {resource?.key === 'shop-records' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const shopHistory = items.filter((record) => getShopKey(record) === getShopKey(row.original));
                          setSelectedShopForDetails(row.original);
                          setShopDetailsOpen(true);
                        }}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedForDetails(row.original);
                          if (resource?.key === 'staff-records') {
                            const staffName = String(row.original.staffName ?? '');
                            const role = String(row.original.role ?? '');
                            const history = items
                              .filter((entry) => String(entry.staffName ?? '') === staffName && String(entry.role ?? '') === role)
                              .sort((a, b) => new Date(String(b.dateKey ?? b.createdAt ?? 0)).getTime() - new Date(String(a.dateKey ?? a.createdAt ?? 0)).getTime());
                            setDetailsHistoryRecords(history);
                          } else {
                            setDetailsHistoryRecords([]);
                          }
                          setDetailsOpen(true);
                        }}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        {t('viewDetails')}
                      </Button>
                    )}
                    {resource?.key === 'staff-records' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelected({
                            staffName: row.original.staffName,
                            role: row.original.role,
                            dateKey: new Date().toISOString().slice(0, 10),
                            fajrAttendance: 'Present',
                            zoharAttendance: 'Present',
                            asrAttendance: 'Present',
                            maghribAttendance: 'Present',
                            ishaAttendance: 'Present',
                            note: ''
                          });
                          setDisabledFields(['staffName', 'role']);
                          setNewStaffMode(false);
                        }}
                      >
                        Add Attendance
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelected(row.original);
                        setDisabledFields([]);
                        setNewStaffMode(false);
                      }}>{tCommon('edit')}</Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === String(row.original._id)}
                      onClick={() => remove(String(row.original._id))}
                    >
                      {deletingId === String(row.original._id) ? t('deleting') : tCommon('delete')}
                    </Button>
                  </div>
                )
              }
            ]}
            data={
              resource?.key === 'shop-records' ? shopSummaryItems : (
                resource?.key === 'staff-records'
                  ? (newStaffMode && selected ? [selected] : staffSummaryItems)
                  : items
              )
            }
            searchKey={currentResource.searchKeys[0]}
          />
          {resource?.key === 'shop-records' && (
            <ShopDetailsModal
              open={shopDetailsOpen}
              onOpenChange={setShopDetailsOpen}
              shopData={selectedShopForDetails as any}
              history={items.filter((record) => getShopKey(record) === getShopKey(selectedShopForDetails as Record<string, unknown>)) as any[]}
            />
          )}
          {resource?.key !== 'shop-records' && (
            <RecordDetailsModal
              open={detailsOpen}
              onOpenChange={setDetailsOpen}
              title={`${currentResource.title} Details`}
              record={selectedForDetails}
              fields={currentResource.fields}
              historyRecords={resource?.key === 'staff-records' ? detailsHistoryRecords : []}
            />
          )}
        </>
      ) : !isSettingsResource ? (
        <Card className="py-10 text-center text-slate-600">{t('noRecordsFound')}</Card>
      ) : null}
    </div>
  );
}
