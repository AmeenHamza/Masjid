import { connectToDatabase } from '@/lib/db';
import { IncomeRecord } from '@/models/IncomeRecord';

function getRecordMonth(record: Record<string, any>) {
  const direct = Number(record.month);
  if (Number.isInteger(direct) && direct >= 1 && direct <= 12) return direct;
  const parsed = new Date(String(record.date || ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed.getMonth() + 1;
}

function getRecordYear(record: Record<string, any>) {
  const direct = Number(record.year);
  if (Number.isInteger(direct) && direct >= 0) return direct;
  const parsed = new Date(String(record.date || ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

function formatCurrency(n: number) {
  return `Rs ${n.toLocaleString('en-US')}`;
}

(async function(){
  try {
    await connectToDatabase();
    const allRecords = await IncomeRecord.find().sort({ createdAt: -1 }).limit(200).lean();
    console.log('Total income records fetched:', allRecords.length);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const selectedType = null; // no type filter
    const queryMonth = null; // emulate no month param
    const queryYear = 2026; // emulate year=2026

    const recordsFilteredByType = selectedType ? allRecords.filter((r: any) => String(r.source || '').trim() === selectedType) : allRecords;

    const years = Array.from(new Set(recordsFilteredByType.map((item: any) => getRecordYear(item) || currentYear))).filter((y) => Number.isInteger(y)).sort((a, b) => b - a);
    console.log('Years available:', years.slice(0,20));

    const selectedYear = queryYear ?? (years.length ? years[0] : currentYear);

    const monthsInSelectedYear = allRecords.filter((item: any) => getRecordYear(item) === selectedYear && (!selectedType || String(item.source || '').trim() === selectedType)).map((it: any) => getRecordMonth(it)).filter(Boolean) as number[];
    const defaultMonthForYear = monthsInSelectedYear.length ? Math.max(...monthsInSelectedYear) : currentMonth;

    const selectedMonth = queryMonth ?? defaultMonthForYear;

    console.log('selectedYear', selectedYear, 'selectedMonth', selectedMonth);

    const records = allRecords.filter((item: any) =>
      (!selectedType || String(item.source || '').trim() === selectedType) &&
      getRecordMonth(item) === selectedMonth &&
      getRecordYear(item) === selectedYear
    );

    const monthly = records.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
    const yearly = allRecords.filter((item: any) => getRecordYear(item) === selectedYear && (!selectedType || String(item.source || '').trim() === selectedType)).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

    console.log('monthly total:', formatCurrency(monthly));
    console.log('yearly total:', formatCurrency(yearly));
    console.log('matching records count:', records.length);
    for (const r of records) {
      console.log('-', `${getRecordMonth(r)}-${getRecordYear(r)}`, r.source || r.title, formatCurrency(Number(r.amount || 0)));
    }

  } catch (err) {
    console.error('Error running debug script:', err);
    process.exit(1);
  }
})();
