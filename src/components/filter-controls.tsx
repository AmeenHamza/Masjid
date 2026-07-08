"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FilterControls({
  basePath,
  types = [],
  years = [],
  selectedType,
  selectedMonth,
  selectedYear,
  displayMonth,
  displayYear,
  labels
}: {
  basePath: string;
  types?: string[];
  years?: number[];
  selectedType?: string | null;
  selectedMonth?: number | null; // comes from query param (null if absent)
  selectedYear?: number | null; // comes from query param (null if absent)
  displayMonth?: number | null; // UI-only fallback when query month is absent
  displayYear?: number | null; // UI-only fallback when query year is absent
  labels?: { type?: string; month?: string; year?: string };
}) {
  const router = useRouter();
  const [type, setType] = useState<string>(selectedType ?? '');
  // Initialize month/year from query if present, otherwise use display fallback
  const [month, setMonth] = useState<string>(selectedMonth ? String(selectedMonth) : displayMonth ? String(displayMonth) : '');
  const [year, setYear] = useState<string>(selectedYear ? String(selectedYear) : displayYear ? String(displayYear) : '');

  useEffect(() => {
    setType(selectedType ?? '');
  }, [selectedType]);

  // When query values change, update inputs. If query is missing, keep display fallback.
  useEffect(() => {
    if (selectedMonth !== undefined && selectedMonth !== null) {
      setMonth(String(selectedMonth));
    } else if (displayMonth !== undefined && displayMonth !== null) {
      setMonth(String(displayMonth));
    }
  }, [selectedMonth, displayMonth]);

  useEffect(() => {
    if (selectedYear !== undefined && selectedYear !== null) {
      setYear(String(selectedYear));
    } else if (displayYear !== undefined && displayYear !== null) {
      setYear(String(displayYear));
    }
  }, [selectedYear, displayYear]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (month) params.set('month', month);
    if (year) params.set('year', year);
    const qs = params.toString();
    const path = typeof window !== 'undefined' ? window.location.pathname : basePath;
    router.push(qs ? `${path}?${qs}` : path);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
      <label className="min-w-0">
        <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{labels?.type ?? 'Type'}</div>
        <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
          <option value="">All Types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="min-w-0">
        <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{labels?.month ?? 'Month'}</div>
        <select name="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={String(m)}>{m}</option>)}
        </select>
      </label>
      <label className="min-w-0">
        <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{labels?.year ?? 'Year'}</div>
        <select name="year" value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
          <option value="">All Years</option>
          {years.length ? years.map((y) => <option key={y} value={String(y)}>{y}</option>) : <option value={String(new Date().getFullYear())}>{new Date().getFullYear()}</option>}
        </select>
      </label>
      <button type="submit" className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600">Filter</button>
    </form>
  );
}
