'use client';

import { useEffect, useState } from 'react';
import { Loader2, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StaffAttendanceModal } from '@/components/staff-attendance-modal';

type PrayerKey = 'fajr' | 'zohar' | 'asr' | 'maghrib' | 'isha';
type AttendanceStatus = 'Present' | 'Absent';
type StaffRole = 'Imam' | 'Muazzin' | 'Khadim';

type RoleTodayStatus = {
  role: StaffRole;
  staffName: string | null;
  dateKey: string;
  prayers: Record<PrayerKey, AttendanceStatus>;
};

const prayerOrder: PrayerKey[] = ['fajr', 'zohar', 'asr', 'maghrib', 'isha'];

const roleLabels: Record<StaffRole, { en: string; ur: string }> = {
  Imam: { en: 'Imam', ur: 'امام' },
  Muazzin: { en: 'Muazzin', ur: 'موذن' },
  Khadim: { en: 'Khadim', ur: 'خادم' }
};

const prayerLabels: Record<PrayerKey, { en: string; ur: string }> = {
  fajr: { en: 'Fajr', ur: 'فجر' },
  zohar: { en: 'Zohar', ur: 'ظہر' },
  asr: { en: 'Asr', ur: 'عصر' },
  maghrib: { en: 'Maghrib', ur: 'مغرب' },
  isha: { en: 'Isha', ur: 'عشاء' }
};

function statusDotClass(status: AttendanceStatus) {
  if (status === 'Present') return 'bg-emerald-500';
  return 'bg-rose-500';
}

export function StaffAttendanceSection({ locale = 'en' }: { locale?: 'en' | 'ur' }) {
  const [roles, setRoles] = useState<RoleTodayStatus[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<StaffRole | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/public/staff-attendance')
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setRoles(data?.roles ?? null);
      })
      .catch(() => {
        if (mounted) setRoles(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const heading = locale === 'ur' ? 'امام، موذن اور خادم کی آج کی حاضری' : "Today's Staff Attendance";

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-emerald-900/10 bg-white/80 p-6 text-sm text-slate-600 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> {locale === 'ur' ? 'لوڈ ہو رہا ہے...' : 'Loading...'}
        </div>
      </section>
    );
  }

  if (!roles || roles.every((role) => !role.staffName)) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <p className="mb-3 text-sm uppercase tracking-[0.3em] text-emerald-700">{heading}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((roleStatus) => (
          <Card key={roleStatus.role} className="border-emerald-900/10 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <User className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-700">{locale === 'ur' ? roleLabels[roleStatus.role].ur : roleLabels[roleStatus.role].en}</p>
                  <p className="text-sm font-bold text-slate-900">{roleStatus.staffName || (locale === 'ur' ? 'تاحال متعین نہیں' : 'Not assigned')}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-1.5">
              {prayerOrder.map((prayer) => (
                <div key={prayer} className="flex flex-col items-center gap-1" title={`${prayerLabels[prayer].en}: ${roleStatus.prayers[prayer]}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(roleStatus.prayers[prayer])}`} />
                  <span className="text-[10px] font-medium text-slate-500">{locale === 'ur' ? prayerLabels[prayer].ur : prayerLabels[prayer].en}</span>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              disabled={!roleStatus.staffName}
              onClick={() => setActiveRole(roleStatus.role)}
            >
              {locale === 'ur' ? 'تفصیل دیکھیں' : 'View Detail'}
            </Button>
          </Card>
        ))}
      </div>

      {activeRole ? (
        <StaffAttendanceModal
          open={Boolean(activeRole)}
          onOpenChange={(open) => setActiveRole(open ? activeRole : null)}
          role={activeRole}
          staffName={roles.find((role) => role.role === activeRole)?.staffName ?? null}
          locale={locale}
        />
      ) : null}
    </section>
  );
}
