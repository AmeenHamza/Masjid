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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { ShopDetailsModal } from '@/components/shop-details-modal';
import { RecordDetailsModal } from '@/components/record-details-modal';
import { StaffManagePanel } from '@/components/staff-manage-panel';
import { buildMonthlyReportPdf, type ReportColumn } from '@/lib/monthly-report-pdf';

const reportMonthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function buildPeriodLabel(month: number, year: number) {
  if (month && year) return `${reportMonthNames[month - 1]} ${year}`;
  if (year) return `Year ${year}`;
  if (month) return reportMonthNames[month - 1];
  return 'All Records';
}

function formatDateValue(value: unknown) {
  if (!value) {
    return '-';
  }

  const rawValue = String(value).trim();
  const isDateKey = /^\d{4}-\d{2}-\d{2}$/.test(rawValue);
  const date = isDateKey ? new Date(`${rawValue}T00:00:00Z`) : new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return rawValue;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: isDateKey ? 'UTC' : undefined
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

function getShopRecordForMonthYear(records: Record<string, unknown>[], shopKey: string, month: number, year: number) {
  const matches = records.filter((record) =>
    getShopKey(record) === shopKey &&
    Number(record.month || 0) === month &&
    Number(record.year || 0) === year
  );
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
    if (resourceKey === 'income-records' || resourceKey === 'expense-records') {
      return { date: todayKey, month: currentMonth, year: currentYear, amount: 0 };
    }

    return { date: todayKey, month: currentMonth, year: currentYear, amount: 0 };
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

function prayerRecordSortRank(record: Record<string, unknown>) {
  const dateKey = String(record.dateKey ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return new Date(`${dateKey}T00:00:00Z`).getTime();
  }

  const createdAt = new Date(String(record.createdAt ?? 0)).getTime();
  return Number.isNaN(createdAt) ? 0 : createdAt;
}

export default function AdminResourcePage() {
  const params = useParams<{ resource: string }>();
  const resource = getResourceConfig(params.resource);
  const t = useTranslations('admin');
  const tToast = useTranslations('toast');
  const tCommon = useTranslations('common');
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [filterMonth, setFilterMonth] = useState<number>(0);
  const [filterYear, setFilterYear] = useState<number>(0);
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterShopName, setFilterShopName] = useState<string>('');
  const [filterOwnerName, setFilterOwnerName] = useState<string>('');
  const [selected, setSelected] = useState<Record<string, unknown> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formResetToken, setFormResetToken] = useState(0);
  const [prayerTimesDialogOpen, setPrayerTimesDialogOpen] = useState(false);
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
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentPreviousBalance, setPaymentPreviousBalance] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [serialSearchInput, setSerialSearchInput] = useState('');
  const [isSerialSearching, setIsSerialSearching] = useState(false);
  const [serialSearchError, setSerialSearchError] = useState<string | null>(null);
  const [staffCreateRequestToken, setStaffCreateRequestToken] = useState(0);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [reportSiteTitle, setReportSiteTitle] = useState('Masjid');
  const [reportPaperSettings, setReportPaperSettings] = useState<{ paperSize?: 'A4' | 'Letter' | 'Legal' | 'A5' | 'Custom'; paperWidth?: number; paperHeight?: number }>({});

  useEffect(() => {
    fetch('/api/public/settings')
      .then((res) => res.json())
      .then((data) => {
        setReportSiteTitle(data?.masjidName || 'Masjid');
        setReportPaperSettings({ paperSize: data?.paperSize, paperWidth: data?.paperWidth, paperHeight: data?.paperHeight });
      })
      .catch(() => {});
  }, []);

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
    setEditingPaymentId(null);
    const latestShopRecord = getLatestShopRecord(items, shopKey);
    const shop = latestShopRecord as Record<string, unknown> | undefined;
    setPaymentPreviousBalance(shop ? String(shop.debtAmount ?? 0) : '');
    setPaymentAmount('');
    setPaymentNote('');
    const now = new Date();
    const defaultMonth = Number(shop?.month || now.getMonth() + 1);
    const defaultYear = Number(shop?.year || now.getFullYear());
    const nextMonthYear = getNextMonthYear(defaultMonth, defaultYear);
    setPaymentMonth(shop ? nextMonthYear.month : now.getMonth() + 1);
    setPaymentYear(shop ? nextMonthYear.year : now.getFullYear());
    setPaymentDate(now.toISOString().slice(0, 10));
    setPaymentError(null);
  }

  // Loads one specific past payment record into the "Update Shop Rent
  // Payment" form for correction, instead of always starting a fresh
  // payment - lets a wrong entry for an individual month be fixed in place.
  function startEditPayment(record: Record<string, unknown>) {
    setShopDetailsOpen(false);
    setPaymentShopId(getShopKey(record));
    setEditingPaymentId(String(record._id));
    setPaymentPreviousBalance(String(record.previousBalance ?? 0));
    setPaymentAmount(String(record.paymentAmount ?? 0));
    setPaymentNote(String(record.note ?? ''));
    setPaymentMonth(Number(record.month) || new Date().getMonth() + 1);
    setPaymentYear(Number(record.year) || new Date().getFullYear());
    const rawDate = String(record.date || record.buyDate || '');
    setPaymentDate(rawDate ? rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setPaymentError(null);
  }

  function cancelEditPayment() {
    handlePaymentShopChange('');
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

    const previousBalance = Number(paymentPreviousBalance || 0);
    const currentMonthlyRent = Number(shop.monthlyRent || 0);
    const totalDueBeforePayment = previousBalance + currentMonthlyRent;
    const paidAmount = Number(paymentAmount || 0);
    const paymentAmountToSave = paidAmount <= 0 ? 0 : Math.min(paidAmount, totalDueBeforePayment);
    const remainingBalance = Math.max(0, totalDueBeforePayment - paymentAmountToSave);

    let computedStatus: 'Clear' | 'Due' | 'Partial';
    if (paymentAmountToSave <= 0) {
      computedStatus = 'Due';
    } else if (remainingBalance === 0) {
      computedStatus = 'Clear';
    } else {
      computedStatus = 'Partial';
    }

    const payload = {
      shopName: String(shop.shopName || ''),
      ownerName: String(shop.ownerName || ''),
      buyDate: String(shop.buyDate ?? shop.date ?? new Date().toISOString().slice(0, 10)),
      monthlyRent: currentMonthlyRent,
      month: paymentMonth,
      year: paymentYear,
      previousBalance,
      paymentAmount: paymentAmountToSave,
      date: paymentDate,
      note: paymentNote?.trim() ? String(paymentNote).trim() : String(shop.note ?? ''),
      paymentStatus: computedStatus
    };

    try {
      // Always POST, even when correcting an existing entry: the API
      // matches on shopName + ownerName + month + year and updates that
      // exact record in place (with full previous/next-month balance
      // cascade recalculation) rather than creating a duplicate. A PATCH
      // straight to the record's id would skip that cascade entirely and
      // leave every other month's cumulative balance stale.
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
      setEditingPaymentId(null);
      setPaymentPreviousBalance('');
      setPaymentAmount('');
      setPaymentNote('');
      setPaymentMonth(new Date().getMonth() + 1);
      setPaymentYear(new Date().getFullYear());
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentError(null);
      toast.success(tToast('updatedSuccessfully'));
    } catch {
      setPaymentError('Unable to update shop payment.');
    } finally {
      setIsPaymentSubmitting(false);
    }
  }

  async function searchShopBySerial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSerialSearchError(null);

    const trimmed = serialSearchInput.trim();
    if (!trimmed) {
      setSerialSearchError('Please enter a serial number.');
      return;
    }

    setIsSerialSearching(true);
    try {
      const response = await fetch(`${currentResource.apiPath}?serial=${encodeURIComponent(trimmed)}`, {
        credentials: 'include'
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; item?: Record<string, unknown> | null; found?: boolean; message?: string } | null;

      if (!response.ok || !data?.ok || !data.found || !data.item) {
        setSerialSearchError('This record does not exist in the system. Please check the serial number and try again.');
        return;
      }

      const foundRecord = data.item;
      setSelectedShopForDetails(foundRecord);
      setShopDetailsOpen(true);
      toast.success('Record found.');
    } catch {
      setSerialSearchError('Unable to search right now. Please try again.');
    } finally {
      setIsSerialSearching(false);
    }
  }

  useEffect(() => {
    void loadItems();
    setFilterMonth(0);
    setFilterYear(0);
    setFilterClass('');
    setFilterShopName('');
    setFilterOwnerName('');
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
          accessorKey: 'serialNumber',
          header: 'Serial No.',
          cell: ({ getValue }: { getValue: () => unknown }) => (
            <span className="block max-w-[160px] break-words font-medium text-amber-700">{String(getValue() ?? '-')}</span>
          )
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
          header: 'Tenant Name',
          cell: ({ getValue }: { getValue: () => unknown }) => (
            <span className="block max-w-[260px] break-words">{String(getValue() ?? '')}</span>
          )
        },
        {
          accessorKey: 'vacated',
          header: 'Status',
          cell: ({ row }: { row: { original: Record<string, unknown> } }) => (
            row.original.vacated ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Vacated</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
            )
          )
        },
        {
          accessorKey: 'paymentAmount',
          header: 'Payment Received',
          cell: ({ getValue }: { getValue: () => unknown }) => (
            <span className="block max-w-[260px] break-words">{formatCurrency(Number(getValue() ?? 0))}</span>
          )
        },
        {
          id: 'lastPayment',
          header: 'Last Recorded',
          cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
            const month = row.original.month;
            const year = row.original.year;
            if (!month || !year) return <span>-</span>;
            const monthLabel = new Date(0, Number(month) - 1).toLocaleString('en-US', { month: 'short' });
            return <span className="whitespace-nowrap">{monthLabel} {String(year)}</span>;
          }
        },
        {
          accessorKey: 'debtAmount',
          header: 'Shop Balance',
          cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
            const amount = Number(row.original.debtAmount ?? 0);
            const monthlyRent = Number(row.original.monthlyRent ?? 0);
            // Red if more than a month's rent is owed, green if fully clear,
            // amber for anything owed in between.
            const colorClass = amount <= 0
              ? 'text-emerald-700'
              : monthlyRent > 0 && amount > monthlyRent
                ? 'text-rose-600'
                : 'text-amber-600';
            return (
              <span className={`block whitespace-nowrap font-semibold ${colorClass}`}>
                {formatCurrency(amount)}
              </span>
            );
          }
        }
      ];
    }

    const fieldByName = new Map(resource?.fields.map((field) => [field.name, field]) ?? []);

    return Object.keys(items[0]).filter((key) => !hiddenKeys.has(key)).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const rawValue = getValue();

        if (fieldByName.get(key)?.type === 'date') {
          return <span className="block max-w-[260px] break-words">{formatDateValue(rawValue)}</span>;
        }

        const value = String(rawValue ?? '');

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
  const isPrayerTimesResource = currentResource.key === 'prayer-times';
  const isNewStaffCreation = currentResource.key === 'staff-records' && newStaffMode && !selected?._id;
  // Brand-new staff creation only takes name, role, start date and a note —
  // attendance is fully automatic, so those five per-prayer fields are only
  // ever shown/edited later through "Add Attendance" or "Edit".
  const staffCreateOnlyFieldNames = new Set(['staffName', 'role', 'dateKey', 'note']);
  const mainFormFields = isNewStaffCreation
    ? currentResource.fields.filter((field) => staffCreateOnlyFieldNames.has(field.name))
    : currentResource.fields;
  const selectedPaymentShop = getLatestShopRecord(items, paymentShopId) as Record<string, unknown> | undefined;
  const currentDueAmount = Number(paymentPreviousBalance || String(selectedPaymentShop?.debtAmount ?? 0)) + Number(selectedPaymentShop?.monthlyRent ?? 0);
  const managingResourcesText = t('managingResources', { resource: currentResource.title.toLowerCase() });
  const selectedPaymentMonthLabel = paymentMonth ? new Date(0, paymentMonth - 1).toLocaleString('en-US', { month: 'long' }) : '-';

  // Month/Year filter: shown for any resource whose records actually carry
  // month + year fields, except shop-records and staff-records which already
  // have their own dedicated filtering/grouping flows.
  const supportsMonthYearFilter = currentResource.key !== 'shop-records'
    && currentResource.key !== 'staff-records'
    && currentResource.fields.some((field) => field.name === 'month')
    && currentResource.fields.some((field) => field.name === 'year');
  const isMadrasaResource = currentResource.key === 'madrasa-records';

  const filterYearOptions = useMemo(() => {
    const years = new Set<number>();
    items.forEach((item) => {
      const year = Number(item.year);
      if (Number.isInteger(year) && year > 0) years.add(year);
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  const filterClassOptions = useMemo(() => {
    if (!isMadrasaResource) return [] as string[];
    const values = new Set<string>();
    items.forEach((item) => {
      const value = String(item.class ?? '').trim();
      if (value) values.add(value);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items, isMadrasaResource]);

  const filteredItems = useMemo(() => {
    if (isMadrasaResource) {
      if (!filterClass) return items;
      return items.filter((item) => String(item.class ?? '').trim() === filterClass);
    }
    if (!supportsMonthYearFilter) return items;
    return items.filter((item) => {
      const matchesMonth = !filterMonth || Number(item.month) === filterMonth;
      const matchesYear = !filterYear || Number(item.year) === filterYear;
      return matchesMonth && matchesYear;
    });
  }, [items, isMadrasaResource, filterClass, supportsMonthYearFilter, filterMonth, filterYear]);
  const latestPrayerTimesRecord = useMemo(() => {
    if (!isPrayerTimesResource) {
      return undefined;
    }

    return [...items].sort((a, b) => prayerRecordSortRank(b) - prayerRecordSortRank(a))[0];
  }, [isPrayerTimesResource, items]);
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

  // Shop records aren't covered by the generic month/year filter above (the
  // main table shows one summary row per shop, not raw payments), so the
  // monthly rent report gets its own filtered view straight off the raw
  // payment records.
  const filterShopNameOptions = useMemo(() => {
    if (currentResource.key !== 'shop-records') return [] as string[];
    const values = new Set<string>();
    items.forEach((item) => {
      const value = String(item.shopName ?? '').trim();
      if (value) values.add(value);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items, currentResource.key]);

  const filterOwnerNameOptions = useMemo(() => {
    if (currentResource.key !== 'shop-records') return [] as string[];
    const values = new Set<string>();
    items.forEach((item) => {
      if (filterShopName && String(item.shopName ?? '').trim() !== filterShopName) return;
      const value = String(item.ownerName ?? '').trim();
      if (value) values.add(value);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items, currentResource.key, filterShopName]);

  const shopReportItems = useMemo(() => {
    if (currentResource.key !== 'shop-records') return [];
    return items.filter((item) => {
      const matchesMonth = !filterMonth || Number(item.month) === filterMonth;
      const matchesYear = !filterYear || Number(item.year) === filterYear;
      const matchesShop = !filterShopName || String(item.shopName ?? '').trim() === filterShopName;
      const matchesOwner = !filterOwnerName || String(item.ownerName ?? '').trim() === filterOwnerName;
      return matchesMonth && matchesYear && matchesShop && matchesOwner;
    });
  }, [items, currentResource.key, filterMonth, filterYear, filterShopName, filterOwnerName]);

  // Selecting a specific Name is what confirms the report is for a real
  // tenant, not just whatever happens to be currently filtered - Shop is
  // optional on top of that (narrows a tenant with multiple shops down to
  // one of them, or covers all of that tenant's shops when left on "All").
  const shopReportReady = Boolean(filterOwnerName) && shopReportItems.length > 0;
  const shopReportTotalReceived = shopReportItems.reduce((sum, item) => sum + Number(item.paymentAmount || 0), 0);
  const shopReportTotalBalance = shopReportItems.reduce((sum, item) => sum + Number(item.debtAmount || 0), 0);

  function downloadShopMonthlyReport() {
    const periodLabel = buildPeriodLabel(filterMonth, filterYear);
    const columns: ReportColumn[] = [
      { key: 'serialNumber', label: 'Serial No.' },
      { key: 'shopName', label: 'Shop Name' },
      { key: 'ownerName', label: 'Rental Name' },
      { key: 'previousBalance', label: 'Previous Balance', type: 'amount' },
      { key: 'date', label: 'Payment Date', type: 'date' },
      { key: 'debtAmount', label: 'Remaining Balance', type: 'amount' }
    ];
    const totalRentReceived = shopReportItems.reduce((sum, item) => sum + Number(item.paymentAmount || 0), 0);
    const totalOutstanding = shopReportItems.reduce((sum, item) => sum + Number(item.debtAmount || 0), 0);
    const pdf = buildMonthlyReportPdf({
      siteTitle: reportSiteTitle,
      reportTitle: 'Shop Rent Report',
      periodLabel,
      columns,
      rows: shopReportItems.map((item) => ({ ...item, date: item.date || item.buyDate })),
      totals: [
        { label: 'Total Rent Received', value: totalRentReceived },
        { label: 'Total Outstanding Balance', value: totalOutstanding }
      ],
      paperSettings: reportPaperSettings
    });
    pdf.save(`shop-rent-report-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  function downloadResourceMonthlyReport() {
    const periodLabel = isMadrasaResource
      ? (filterClass ? `Class: ${filterClass}` : 'All Classes')
      : buildPeriodLabel(filterMonth, filterYear);
    const columns: ReportColumn[] = currentResource.fields.map((field) => ({
      key: field.name,
      label: field.label,
      type: field.name.toLowerCase() === 'amount' ? 'amount' : field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'
    }));
    const hasAmountField = currentResource.fields.some((field) => field.name.toLowerCase() === 'amount');
    const totalAmount = hasAmountField ? filteredItems.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    const pdf = buildMonthlyReportPdf({
      siteTitle: reportSiteTitle,
      reportTitle: `${currentResource.title} Report`,
      periodLabel,
      columns,
      rows: filteredItems,
      totals: hasAmountField ? [{ label: 'Total Amount', value: totalAmount }] : [],
      paperSettings: reportPaperSettings
    });
    pdf.save(`${currentResource.key}-report-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  async function save(values: Record<string, unknown>) {
    setSaving(true);
    const isUpdate = Boolean(selected?._id);

    // Settings is a singleton - block creating a second document once one
    // already exists, but the very first save (no settings row yet) must be
    // allowed to go through as a create, or the site could never be
    // configured for the first time at all.
    if (isSettingsResource && !isUpdate && items.length > 0) {
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

    if (currentResource.key === 'shop-records' && isUpdate && selected && !Object.prototype.hasOwnProperty.call(normalizedValues, 'buyDate') && selected.buyDate) {
      (normalizedValues as Record<string, unknown>).buyDate = selected.buyDate;
    }

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
      setPrayerTimesDialogOpen(false);
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
      if (currentResource.key === 'shop-records') {
        const shopRecord = items.find((item) => String(item._id ?? '') === id);
        const shopKey = getShopKey(shopRecord);
        const shopIds = shopKey
          ? items
              .filter((item) => getShopKey(item) === shopKey)
              .map((item) => String(item._id ?? ''))
              .filter(Boolean)
          : [id];

        const deleteResponses = await Promise.all(
          shopIds.map((shopId) =>
            fetch(`${currentResource.apiPath}/${shopId}`, { method: 'DELETE', credentials: 'include' })
          )
        );

        if (deleteResponses.some((response) => !response.ok)) {
          throw new Error('Delete failed');
        }
      } else if (currentResource.key === 'staff-records') {
        const staffRecord = items.find((item) => String(item._id ?? '') === id);
        const staffName = String(staffRecord?.staffName ?? '').trim();
        const role = String(staffRecord?.role ?? '').trim();
        const staffIds = staffName
          ? items
              .filter((item) => String(item.staffName ?? '').trim() === staffName && String(item.role ?? '').trim() === role)
              .map((item) => String(item._id ?? ''))
              .filter(Boolean)
          : [id];

        const deleteResponses = await Promise.all(
          staffIds.map((staffId) =>
            fetch(`${currentResource.apiPath}/${staffId}`, { method: 'DELETE', credentials: 'include' })
          )
        );

        if (deleteResponses.some((response) => !response.ok)) {
          throw new Error('Delete failed');
        }
      } else {
        const response = await fetch(`${currentResource.apiPath}/${id}`, { method: 'DELETE', credentials: 'include' });
        if (!response.ok) {
          throw new Error('Delete failed');
        }
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
        {!isSettingsResource ? (
          isPrayerTimesResource ? (
            <Button
              onClick={() => {
                setSelected(latestPrayerTimesRecord ?? getNewRecordDefaults(currentResource.key));
                setPrayerTimesDialogOpen(true);
              }}
              className="w-full sm:w-auto"
            >
              Change Period Time
            </Button>
          ) : (
            <Button onClick={() => {
              if (currentResource.key === 'staff-records') {
                // For staff, "New Record" opens a dedicated New Staff
                // dialog handled by StaffManagePanel (name + role only).
                setSelected(undefined);
                setDisabledFields([]);
                setNewStaffMode(false);
                setStaffCreateRequestToken((token) => token + 1);
              } else {
                setSelected(getNewRecordDefaults(currentResource.key));
                setDisabledFields([]);
                setNewStaffMode(false);
              }
            }} className="w-full sm:w-auto">{t('newRecord')}</Button>
          )
        ) : null}
      </div>

      {currentResource.key === 'shop-records' ? (
        <Card className="border-emerald-900/10 bg-white/85 p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <label className="min-w-0">
              <div className="mb-2 text-sm font-semibold">Shop</div>
              <select
                value={filterShopName}
                onChange={(event) => setFilterShopName(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">All Shops</option>
                {filterShopNameOptions.map((shopName) => (
                  <option key={shopName} value={shopName}>{shopName}</option>
                ))}
              </select>
            </label>
            <label className="min-w-0">
              <div className="mb-2 text-sm font-semibold">Name</div>
              <select
                value={filterOwnerName}
                onChange={(event) => setFilterOwnerName(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">All Names</option>
                {filterOwnerNameOptions.map((ownerName) => (
                  <option key={ownerName} value={ownerName}>{ownerName}</option>
                ))}
              </select>
            </label>
            <label className="min-w-0">
              <div className="mb-2 text-sm font-semibold">Month</div>
              <select
                value={filterMonth}
                onChange={(event) => setFilterMonth(Number(event.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value={0}>All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
                ))}
              </select>
            </label>
            <label className="min-w-0">
              <div className="mb-2 text-sm font-semibold">Year</div>
              <select
                value={filterYear}
                onChange={(event) => setFilterYear(Number(event.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value={0}>All Years</option>
                {filterYearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
            {(filterMonth || filterYear || filterShopName || filterOwnerName) ? (
              <Button variant="outline" size="sm" onClick={() => { setFilterMonth(0); setFilterYear(0); setFilterShopName(''); setFilterOwnerName(''); }}>
                Clear Filter
              </Button>
            ) : null}
            <div className="flex flex-col gap-1">
              <Button size="sm" onClick={downloadShopMonthlyReport} disabled={!shopReportReady} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                Download Monthly Rent Report (PDF)
              </Button>
              {!shopReportReady ? (
                <span className="text-xs text-amber-700">Select a Name to generate a report.</span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span>{shopReportItems.length} payment record(s) for this period</span>
              <span className="font-semibold text-emerald-700">Total Received: {formatCurrency(shopReportTotalReceived)}</span>
              <span className="font-semibold text-amber-700">Total Balance: {formatCurrency(shopReportTotalBalance)}</span>
            </div>
          </div>
        </Card>
      ) : null}

      {currentResource.key === 'shop-records' ? (
        <Card className="border-amber-900/10 bg-white/85 shadow-lg">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Search by Serial Number</h2>
            {isSerialSearching ? (
              <span className="inline-flex items-center gap-2 text-sm text-amber-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching...
              </span>
            ) : null}
          </div>
          {serialSearchError ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{serialSearchError}</div>
          ) : null}
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={searchShopBySerial}>
            <input
              value={serialSearchInput}
              onChange={(event) => setSerialSearchInput(event.target.value)}
              placeholder="e.g. SR-000123"
              className="w-full flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none"
            />
            <Button type="submit" disabled={isSerialSearching} className="sm:w-auto">
              {isSerialSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </Card>
      ) : null}

      {isPrayerTimesResource ? (
        <Card className="border-emerald-900/10 bg-white/85 shadow-lg">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Current Prayer Times</h2>
          </div>
          {latestPrayerTimesRecord ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Date</div>
                <div className="mt-2 text-xl font-black text-slate-900">{formatDateValue(latestPrayerTimesRecord.dateKey)}</div>
              </div>
              {(['fajr', 'zohar', 'asr', 'maghrib', 'isha', 'juma'] as const).map((key) => (
                <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{key.toUpperCase()}</div>
                  <div className="mt-2 text-xl font-black text-slate-900">{String(latestPrayerTimesRecord[key] ?? '-')}</div>
                </div>
              ))}
              {latestPrayerTimesRecord.notes ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 xl:col-span-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Notes</div>
                  <div className="mt-2 whitespace-pre-wrap text-slate-900">{String(latestPrayerTimesRecord.notes)}</div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              No prayer times saved yet. Use Change Period Time to create the first record.
            </div>
          )}
        </Card>
      ) : null}

      {currentResource.key === 'shop-records' ? (
        <Card className="border-emerald-900/10 bg-white/85 shadow-lg">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{editingPaymentId ? 'Edit Shop Rent Entry' : 'Update Shop Rent Payment'}</h2>
            {isPaymentSubmitting ? (
              <span className="inline-flex items-center gap-2 text-sm text-emerald-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Updating...
              </span>
            ) : null}
          </div>
          {editingPaymentId ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Editing an existing entry for {selectedPaymentMonthLabel} {paymentYear}. Correct the fields below and save, or cancel to add a new payment instead.
            </div>
          ) : null}
          {paymentError ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{paymentError}</div> : null}
          <form className="space-y-4" onSubmit={saveShopPayment}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="min-w-0">
                <div className="mb-2 text-sm font-semibold">Select Shop</div>
                <select
                  value={paymentShopId}
                  onChange={(event) => handlePaymentShopChange(event.target.value)}
                  disabled={Boolean(editingPaymentId)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total Due Before Payment</div>
                <div className="mt-2 text-xl font-black text-slate-900">{formatCurrency(currentDueAmount)}</div>
                <div className="mt-2 text-sm text-slate-600">Entry will be saved for {selectedPaymentMonthLabel} {paymentYear}</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Previous Balance</div>
                <input
                  value={paymentPreviousBalance}
                  onChange={(event) => setPaymentPreviousBalance(event.target.value)}
                  type="number"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                />
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
                <div className="mb-2 text-sm font-semibold">Payment Received Date</div>
                <p className="mb-1.5 -mt-1 text-xs text-slate-500">When the tenant actually paid (can be weeks or months after the rent month below).</p>
                <input
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>
              <label className="min-w-0">
                <div className="mb-2 text-sm font-semibold">Payment Amount (Rs)</div>
                <input
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>
              <label className="min-w-0">
                <div className="mb-2 text-sm font-semibold">Rent For Month</div>
                <p className="mb-1.5 -mt-1 text-xs text-slate-500">
                  {editingPaymentId ? 'Locked while editing - delete and re-add the entry to move it to a different month.' : "Which month's rent this payment covers - independent of the date above."}
                </p>
                <select
                  value={paymentMonth}
                  onChange={(event) => setPaymentMonth(Number(event.target.value))}
                  disabled={Boolean(editingPaymentId)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="min-w-0">
                <div className="mb-2 text-sm font-semibold">Rent For Year</div>
                <input
                  value={paymentYear}
                  onChange={(event) => setPaymentYear(Number(event.target.value))}
                  type="number"
                  disabled={Boolean(editingPaymentId)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                />
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
                {isPaymentSubmitting ? 'Updating...' : editingPaymentId ? 'Save Corrected Entry' : 'Save Payment Update'}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEditPayment}>
                {editingPaymentId ? 'Cancel Edit' : 'Reset'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {currentResource.key === 'staff-records' ? (
        <StaffManagePanel
          apiPath={currentResource.apiPath}
          onSaved={loadItems}
          createRequestToken={staffCreateRequestToken}
        />
      ) : isPrayerTimesResource ? null : (
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
            fields={mainFormFields}
            defaultValues={selected}
            onSubmit={save}
            isSubmitting={saving}
            resetToken={formResetToken}
            disabledFields={disabledFields}
            submitLabel={isSettingsResource ? t('update') : (selected?._id ? t('update') : tCommon('save'))}
          />
        </Card>
      )}

      {isPrayerTimesResource ? (
        <Dialog open={prayerTimesDialogOpen} onOpenChange={setPrayerTimesDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selected?._id ? 'Update Prayer Times' : 'Create Prayer Times'}</DialogTitle>
              <DialogDescription>Update the single active prayer timing record for the site.</DialogDescription>
            </DialogHeader>
            <ResourceForm
              fields={currentResource.fields}
              defaultValues={selected}
              onSubmit={save}
              isSubmitting={saving}
              resetToken={formResetToken}
              disabledFields={disabledFields}
              submitLabel={selected?._id ? 'Update' : 'Save'}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      {supportsMonthYearFilter ? (
        <Card className="border-emerald-900/10 bg-white/85 p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <label className="min-w-0">
              <div className="mb-2 text-sm font-semibold">Month</div>
              <select
                value={filterMonth}
                onChange={(event) => setFilterMonth(Number(event.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value={0}>All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
                ))}
              </select>
            </label>
            <label className="min-w-0">
              <div className="mb-2 text-sm font-semibold">Year</div>
              <select
                value={filterYear}
                onChange={(event) => setFilterYear(Number(event.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value={0}>All Years</option>
                {filterYearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
            {(filterMonth || filterYear) ? (
              <Button variant="outline" size="sm" onClick={() => { setFilterMonth(0); setFilterYear(0); }}>
                Clear Filter
              </Button>
            ) : null}
            <Button size="sm" onClick={downloadResourceMonthlyReport} disabled={!filteredItems.length} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              Download Report (PDF)
            </Button>
            <span className="text-sm text-slate-500">{filteredItems.length} of {items.length} records</span>
          </div>
        </Card>
      ) : null}

      {isMadrasaResource ? (
        <Card className="border-emerald-900/10 bg-white/85 p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <label className="min-w-0">
              <div className="mb-2 text-sm font-semibold">Class</div>
              <select
                value={filterClass}
                onChange={(event) => setFilterClass(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">All Classes</option>
                {filterClassOptions.map((classValue) => (
                  <option key={classValue} value={classValue}>{classValue}</option>
                ))}
              </select>
            </label>
            {filterClass ? (
              <Button variant="outline" size="sm" onClick={() => setFilterClass('')}>
                Clear Filter
              </Button>
            ) : null}
            <Button size="sm" onClick={downloadResourceMonthlyReport} disabled={!filteredItems.length} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              Download Report (PDF)
            </Button>
            <span className="text-sm text-slate-500">{filteredItems.length} of {items.length} records</span>
          </div>
        </Card>
      ) : null}

      {!isSettingsResource && loading ? (
        <Card className="flex items-center justify-center py-12">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('loadingRecords')}
          </div>
        </Card>
      ) : !isSettingsResource && !isPrayerTimesResource && columns.length ? (
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
                    {resource?.key === 'staff-records' ? null : (
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
                  : filteredItems
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
              onEditRecord={startEditPayment}
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
              enableMonthFilter={resource?.key === 'staff-records'}
              onEditRecord={undefined}
            />
          )}
        </>
      ) : !isSettingsResource ? (
        <Card className="py-10 text-center text-slate-600">{t('noRecordsFound')}</Card>
      ) : null}
    </div>
  );
}
