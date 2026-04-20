'use client';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table';
import { Button } from './ui/button';
import { Input } from './ui/input';

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchKey?: string;
};

export function DataTable<TData extends Record<string, unknown>>({ columns, data, searchKey }: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState('');

  const filteredData = useMemo(() => {
    if (!searchKey || !globalFilter) return data;
    const term = globalFilter.toLowerCase();
    return data.filter((row) => String(row[searchKey]).toLowerCase().includes(term));
  }, [data, globalFilter, searchKey]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  function exportCsv() {
    const rows = [columns.map((column) => String(column.header ?? '')).join(',')];
    filteredData.forEach((row) => {
      rows.push(columns.map((column) => String(row[(column as { accessorKey?: string }).accessorKey || ''] ?? '')).join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'export.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} placeholder="Search..." className="sm:max-w-xs" />
        <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left dark:bg-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/10">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
