'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type PrayerKey = 'fajr' | 'zohar' | 'asr' | 'maghrib' | 'isha';
type AttendanceStatus = 'Present' | 'Absent';

type AttendanceDay = {
  dateKey: string;
  recordId: string | null;
  prayers: Record<PrayerKey, AttendanceStatus>;
  note: string;
};

type MonthResponse = {
  ok: boolean;
  role: string;
  staffName: string | null;
  month: number;
  year: number;
  days: AttendanceDay[];
  summary: { daysCounted: number; fajr: number; zohar: number; asr: number; maghrib: number; isha: number };
};

const prayerLabels: Record<PrayerKey, { en: string; ur: string }> = {
  fajr: { en: 'Fajr', ur: 'فجر' },
  zohar: { en: 'Zohar', ur: 'ظہر' },
  asr: { en: 'Asr', ur: 'عصر' },
  maghrib: { en: 'Maghrib', ur: 'مغرب' },
  isha: { en: 'Isha', ur: 'عشاء' }
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function statusBadgeClass(status: AttendanceStatus) {
  if (status === 'Present') return 'bg-emerald-100 text-emerald-800';
  return 'bg-rose-100 text-rose-700';
}

function formatDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

interface StaffAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'Imam' | 'Muazzin' | 'Khadim';
  staffName: string | null;
  locale?: 'en' | 'ur';
}

export function StaffAttendanceModal({ open, onOpenChange, role, staffName, locale = 'en' }: StaffAttendanceModalProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MonthResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    fetch(`/api/public/staff-attendance/history?role=${role}&month=${month}&year=${year}`)
      .then((res) => res.json())
      .then((json) => {
        if (mounted) setData(json as MonthResponse);
      })
      .catch(() => {
        if (mounted) setData(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, role, month, year]);

  const yearOptions = useMemo(() => {
    const current = now.getFullYear();
    return [current - 1, current, current + 1];
  }, [now]);

  const roleLabel = locale === 'ur'
    ? role === 'Imam' ? 'امام' : role === 'Muazzin' ? 'موذن' : 'خادم'
    : role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="sticky top-0 z-10 border-b bg-white pb-4">
          <DialogTitle className="text-xl font-bold text-emerald-900">
            {roleLabel} {locale === 'ur' ? 'کی حاضری' : 'Attendance'} {staffName ? `— ${staffName}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>{name}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {yearOptions.map((yearOption) => (
                <option key={yearOption} value={yearOption}>{yearOption}</option>
              ))}
            </select>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-emerald-700" /> : null}
          </div>

          {data && data.staffName ? (
            <Card className="border-emerald-200 bg-emerald-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-emerald-900">
                {locale === 'ur' ? 'اس مہینے کی کل حاضری' : 'This month\u2019s totals'}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-800 sm:grid-cols-5">
                {(Object.keys(prayerLabels) as PrayerKey[]).map((key) => (
                  <div key={key} className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
                    <div className="font-semibold text-emerald-800">{locale === 'ur' ? prayerLabels[key].ur : prayerLabels[key].en}</div>
                    <div className="text-slate-600">{data.summary[key]} / {data.summary.daysCounted}</div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {!loading && data && data.days.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                {locale === 'ur' ? 'اس مہینے کا کوئی ریکارڈ نہیں ملا۔' : 'No attendance found for this month.'}
              </p>
            ) : null}

            {data?.days.map((day) => (
              <div key={day.dateKey} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 text-sm font-semibold text-slate-800">{formatDateLabel(day.dateKey)}</div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {(Object.keys(prayerLabels) as PrayerKey[]).map((key) => (
                    <span
                      key={key}
                      className={`inline-flex flex-col items-center rounded-lg px-2 py-1 text-xs font-semibold ${statusBadgeClass(day.prayers[key])}`}
                    >
                      <span>{locale === 'ur' ? prayerLabels[key].ur : prayerLabels[key].en}</span>
                      <span>{day.prayers[key]}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 mt-4 border-t bg-white pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {locale === 'ur' ? 'بند کریں' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
