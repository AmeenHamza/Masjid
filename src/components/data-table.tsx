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
    const csvColumns = columns.filter((column) => column.id !== 'actions');
    const rows = [csvColumns.map((column) => String(column.header ?? '')).join(',')];
    filteredData.forEach((row) => {
      rows.push(csvColumns.map((column) => String(row[(column as { accessorKey?: string }).accessorKey || ''] ?? '')).join(','));
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
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <Input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} placeholder="Search..." className="w-full" />
        <Button variant="outline" onClick={exportCsv} className="w-full sm:w-auto">Export CSV</Button>
      </div>
      <div className="grid gap-3 md:hidden">
        {table.getRowModel().rows.map((row) => (
          <div key={row.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
            <div className="grid gap-3">
              {row.getVisibleCells().map((cell) => {
                if (cell.column.id === 'actions') {
                  return (
                    <div key={cell.id} className="pt-1">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  );
                }

                return (
                  <div key={cell.id} className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-white/5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      {String(cell.column.columnDef.header ?? '')}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950 md:block">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50 text-left dark:bg-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
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
                  <td key={cell.id} className="px-4 py-3 align-top text-slate-700 dark:text-slate-200">
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
