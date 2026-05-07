'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface RamadanYearSelectorProps {
  availableYears: number[];
  selectedYear: number;
  view: string;
  commonTranslations: { year?: string };
}

export function RamadanYearSelector({
  availableYears,
  selectedYear,
  view,
  commonTranslations
}: RamadanYearSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleYearChange = (newYear: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', view);
    params.set('year', String(newYear));
    router.push(`/ramadan?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="year-select" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {commonTranslations.year || 'Year'}:
      </label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={(e) => handleYearChange(Number(e.target.value))}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
