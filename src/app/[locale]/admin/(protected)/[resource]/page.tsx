'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
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

  useEffect(() => {
    if (!resource) return;
    fetch(resource.apiPath, { credentials: 'include' }).then((response) => response.json()).then((data) => setItems(data.items || []));
  }, [resource]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!items[0]) return [];
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

  async function save(values: Record<string, unknown>) {
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
    const method = selected?._id ? 'PATCH' : 'POST';
    const path = selected?._id ? `${currentResource.apiPath}/${selected._id}` : currentResource.apiPath;
    await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(normalizedValues), credentials: 'include' });
    setSelected(undefined);
    const refreshed = await fetch(currentResource.apiPath, { credentials: 'include' }).then((response) => response.json());
    setItems(refreshed.items || []);
  }

  async function remove(id: string) {
    await fetch(`${currentResource.apiPath}/${id}`, { method: 'DELETE', credentials: 'include' });
    const refreshed = await fetch(currentResource.apiPath, { credentials: 'include' }).then((response) => response.json());
    setItems(refreshed.items || []);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">{resource.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage {currentResource.title.toLowerCase()} with full CRUD.</p>
        </div>
        <Button onClick={() => setSelected({})}>New</Button>
      </div>
      <Card>
        <ResourceForm fields={currentResource.fields} defaultValues={selected} onSubmit={save} />
      </Card>
      {columns.length ? (
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
