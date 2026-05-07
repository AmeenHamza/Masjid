'use client';

import { useEffect, useMemo, useState } from 'react';
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
        throw new Error('Save failed');
      }

      setSelected(undefined);
      await loadItems();
      if (!isSettingsResource) {
        setFormResetToken((current) => current + 1);
      }
      toast.success(isUpdate ? tToast('updatedSuccessfully') : tToast('savedSuccessfully'));
    } catch {
      toast.error(tToast('unableToSaveRecord'));
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
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{t('managingResources').replace('{{resource}}', currentResource.title.toLowerCase())}</p>
        </div>
        {!isSettingsResource ? <Button onClick={() => setSelected({})} className="w-full sm:w-auto">{t('newRecord')}</Button> : null}
      </div>

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
                    {resource?.key === 'shop-records' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedShopForDetails(row.original);
                          setShopDetailsOpen(true);
                        }}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSelected(row.original)}>{tCommon('edit')}</Button>
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
            data={items}
            searchKey={currentResource.searchKeys[0]}
          />
          {resource?.key === 'shop-records' && (
            <ShopDetailsModal
              open={shopDetailsOpen}
              onOpenChange={setShopDetailsOpen}
              shopData={selectedShopForDetails as any}
            />
          )}
        </>
      ) : !isSettingsResource ? (
        <Card className="py-10 text-center text-slate-600">{t('noRecordsFound')}</Card>
      ) : null}
    </div>
  );
}
