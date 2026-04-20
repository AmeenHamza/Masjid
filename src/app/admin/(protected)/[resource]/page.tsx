'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import { getResourceConfig } from '@/lib/admin-ui';
import { ResourceForm } from '@/components/resource-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminResourcePage() {
  const params = useParams<{ resource: string }>();
  const resource = getResourceConfig(params.resource);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadItems() {
    if (!resource) return;

    setLoading(true);
    try {
      const response = await fetch(resource.apiPath, { credentials: 'include' });
      const data = await response.json();
      setItems(data.items || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!items[0]) return [];
    return Object.keys(items[0]).filter((key) => key !== '_id' && key !== '__v').map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue }) => String(getValue())
    }));
  }, [items]);

  if (!resource) {
    return <Card>Unknown resource</Card>;
  }

  const currentResource = resource;

  async function save(values: Record<string, unknown>) {
    setSaving(true);
    const isUpdate = Boolean(selected?._id);

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
      toast.success(isUpdate ? 'Updated successfully' : 'Saved successfully');
    } catch {
      toast.error('Unable to save record');
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
      toast.success('Deleted successfully');
    } catch {
      toast.error('Unable to delete record');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{resource.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage {currentResource.title.toLowerCase()} with live create, update and delete actions.</p>
        </div>
        <Button onClick={() => setSelected({})}>New Record</Button>
      </div>

      <Card className="border-emerald-900/10 bg-white/80 shadow-lg dark:border-white/10 dark:bg-slate-950/70">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{selected?._id ? 'Edit Record' : 'Create Record'}</h2>
          {saving ? (
            <span className="inline-flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </span>
          ) : null}
        </div>
        <ResourceForm
          fields={currentResource.fields}
          defaultValues={selected}
          onSubmit={save}
          isSubmitting={saving}
          submitLabel={selected?._id ? 'Update' : 'Save'}
        />
      </Card>

      {loading ? (
        <Card className="flex items-center justify-center py-12">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading records...
          </div>
        </Card>
      ) : columns.length ? (
        <DataTable
          columns={[
            ...columns,
            {
              id: 'actions',
              header: 'Actions',
              cell: ({ row }) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelected(row.original)}>Edit</Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === String(row.original._id)}
                    onClick={() => remove(String(row.original._id))}
                  >
                    {deletingId === String(row.original._id) ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              )
            }
          ]}
          data={items}
          searchKey={currentResource.searchKeys[0]}
        />
      ) : (
        <Card className="py-10 text-center text-slate-600 dark:text-slate-300">No records found yet.</Card>
      )}
    </div>
  );
}
