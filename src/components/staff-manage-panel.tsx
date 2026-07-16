'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type PrayerKey = 'fajr' | 'zohar' | 'asr' | 'maghrib' | 'isha';
type AttendanceStatus = 'Present' | 'Absent';

type StaffOption = { staffName: string; role: string };

type StaffManagePanelProps = {
  apiPath: string;
  onSaved: () => void | Promise<void>;
  createRequestToken: number;
};

const PRAYER_KEYS: PrayerKey[] = ['fajr', 'zohar', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: 'Fajr',
  zohar: 'Zohar',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha'
};

const FIELD_BY_PRAYER: Record<PrayerKey, string> = {
  fajr: 'fajrAttendance',
  zohar: 'zoharAttendance',
  asr: 'asrAttendance',
  maghrib: 'maghribAttendance',
  isha: 'ishaAttendance'
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function StaffManagePanel({ apiPath, onSaved, createRequestToken }: StaffManagePanelProps) {
  // ---- Attendance form state ----
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffOption | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(todayKey());
  const [prayerStatus, setPrayerStatus] = useState<Record<PrayerKey, AttendanceStatus>>({
    fajr: 'Present',
    zohar: 'Present',
    asr: 'Present',
    maghrib: 'Present',
    isha: 'Present'
  });
  const [attendanceNote, setAttendanceNote] = useState('');
  const [savingAttendance, setSavingAttendance] = useState(false);

  // ---- New Staff dialog state ----
  const [newStaffOpen, setNewStaffOpen] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [savingNewStaff, setSavingNewStaff] = useState(false);

  // ---- Add Role dialog state ----
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const loadStaffList = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const response = await fetch('/api/admin/staff-list', { credentials: 'include' });
      const data = await response.json().catch(() => null) as { ok?: boolean; items?: StaffOption[] } | null;
      if (!response.ok || !data?.ok) throw new Error('Failed');
      setStaffOptions(data.items ?? []);
    } catch {
      // silent — the list simply stays empty; toast when required actions fail.
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const response = await fetch('/api/admin/staff-roles', { credentials: 'include' });
      const data = await response.json().catch(() => null) as { ok?: boolean; roles?: string[] } | null;
      if (!response.ok || !data?.ok) throw new Error('Failed');
      setRoles(data.roles ?? []);
    } catch {
      setRoles(['Imam', 'Muazzin', 'Khadim']);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    void loadStaffList();
    void loadRoles();
  }, [loadStaffList, loadRoles]);

  // If the currently selected staff no longer exists after a refresh
  // (e.g. deleted), clear the selection so the role field doesn't
  // display stale data.
  useEffect(() => {
    if (!selectedStaff) return;
    const stillExists = staffOptions.some(
      (option) => option.staffName.toLowerCase() === selectedStaff.staffName.toLowerCase()
    );
    if (!stillExists) {
      setSelectedStaff(null);
      setStaffSearch('');
    }
  }, [staffOptions, selectedStaff]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Header "New Record" button pushes an updated createRequestToken so we
  // open the dedicated New Staff dialog rather than the attendance form.
  useEffect(() => {
    if (createRequestToken > 0) {
      setNewStaffOpen(true);
      void loadRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createRequestToken]);

  const filteredStaff = useMemo(() => {
    const query = staffSearch.trim().toLowerCase();
    if (!query) return staffOptions;
    return staffOptions.filter((option) =>
      option.staffName.toLowerCase().includes(query) || option.role.toLowerCase().includes(query)
    );
  }, [staffOptions, staffSearch]);

  function handleSelectStaff(option: StaffOption) {
    setSelectedStaff(option);
    setStaffSearch(option.staffName);
    setDropdownOpen(false);
  }

  function togglePrayer(prayer: PrayerKey, status: AttendanceStatus) {
    setPrayerStatus((prev) => ({ ...prev, [prayer]: status }));
  }

  async function submitAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStaff) {
      toast.error('Please select a staff member.');
      return;
    }
    if (!attendanceDate) {
      toast.error('Please select a date.');
      return;
    }

    setSavingAttendance(true);
    try {
      const payload: Record<string, unknown> = {
        staffName: selectedStaff.staffName,
        role: selectedStaff.role,
        dateKey: attendanceDate,
        note: attendanceNote
      };
      PRAYER_KEYS.forEach((prayer) => {
        payload[FIELD_BY_PRAYER[prayer]] = prayerStatus[prayer];
      });

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null;
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to save attendance.');
      }
      toast.success('Attendance saved successfully.');
      setAttendanceNote('');
      setPrayerStatus({ fajr: 'Present', zohar: 'Present', asr: 'Present', maghrib: 'Present', isha: 'Present' });
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save attendance.');
    } finally {
      setSavingAttendance(false);
    }
  }

  async function submitNewStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = newStaffName.trim();
    const trimmedRole = newStaffRole.trim();
    if (!trimmedName) {
      toast.error('Please enter a staff name.');
      return;
    }
    if (!trimmedRole) {
      toast.error('Please select a role.');
      return;
    }

    setSavingNewStaff(true);
    try {
      // Every staff record must have a dateKey. Use today as the hire/start
      // date; all prayers default to Absent (admin will edit later via the
      // attendance form).
      const payload: Record<string, unknown> = {
        staffName: trimmedName,
        role: trimmedRole,
        dateKey: todayKey(),
        fajrAttendance: 'Absent',
        zoharAttendance: 'Absent',
        asrAttendance: 'Absent',
        maghribAttendance: 'Absent',
        ishaAttendance: 'Absent',
        note: ''
      };
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null;
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to save staff member.');
      }
      toast.success('New staff member added.');
      setNewStaffName('');
      setNewStaffRole('');
      setNewStaffOpen(false);
      await loadStaffList();
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save staff member.');
    } finally {
      setSavingNewStaff(false);
    }
  }

  async function submitNewRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newRoleName.trim();
    if (!trimmed) {
      toast.error('Please enter a role name.');
      return;
    }
    setSavingRole(true);
    try {
      const response = await fetch('/api/admin/staff-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
        credentials: 'include'
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null;
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to add role.');
      }
      toast.success('Role added.');
      setNewRoleName('');
      setAddRoleOpen(false);
      await loadRoles();
      setNewStaffRole(trimmed);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to add role.');
    } finally {
      setSavingRole(false);
    }
  }

  return (
    <>
      <Card className="border-emerald-900/10 bg-white/85 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Update Attendance</h2>
            <p className="mt-1 text-sm text-slate-600">Select a staff member, pick the date, then mark each prayer.</p>
          </div>
          {savingAttendance ? (
            <span className="inline-flex items-center gap-2 text-sm text-emerald-700">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </span>
          ) : null}
        </div>

        <form className="space-y-5" onSubmit={submitAttendance}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="min-w-0 md:col-span-2" ref={dropdownRef}>
              <div className="mb-2 text-sm font-semibold">Staff Name</div>
              <div className="relative">
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:border-emerald-500">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={staffSearch}
                    onChange={(event) => {
                      setStaffSearch(event.target.value);
                      setDropdownOpen(true);
                      if (selectedStaff && event.target.value !== selectedStaff.staffName) {
                        setSelectedStaff(null);
                      }
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder={loadingStaff ? 'Loading staff...' : 'Search staff by name or role'}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none"
                  />
                  {loadingStaff ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
                </div>
                {dropdownOpen ? (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {filteredStaff.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        {staffOptions.length === 0
                          ? 'No staff added yet. Use "New Record" to add one.'
                          : 'No matching staff.'}
                      </div>
                    ) : (
                      filteredStaff.map((option) => (
                        <button
                          type="button"
                          key={`${option.staffName}-${option.role}`}
                          onClick={() => handleSelectStaff(option)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-slate-800 hover:bg-emerald-50"
                        >
                          <span className="font-medium">{option.staffName}</span>
                          <span className="text-xs text-emerald-700">{option.role || '-'}</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-2 text-sm font-semibold">Role</div>
              <Input
                value={selectedStaff?.role ?? ''}
                readOnly
                disabled
                placeholder="Auto-filled from staff"
                className="w-full cursor-not-allowed bg-slate-100"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="min-w-0">
              <div className="mb-2 text-sm font-semibold">Date</div>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">Attendance</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {PRAYER_KEYS.map((prayer) => {
                const status = prayerStatus[prayer];
                return (
                  <div
                    key={prayer}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="mb-2 text-sm font-semibold text-slate-800">{PRAYER_LABELS[prayer]}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => togglePrayer(prayer, 'Present')}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          status === 'Present'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-emerald-50'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePrayer(prayer, 'Absent')}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          status === 'Absent'
                            ? 'bg-rose-600 text-white shadow'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-rose-50'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">Note</div>
            <Textarea
              value={attendanceNote}
              onChange={(event) => setAttendanceNote(event.target.value)}
              className="min-h-[90px]"
              placeholder="Optional note"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button type="submit" disabled={savingAttendance || !selectedStaff}>
              {savingAttendance ? 'Saving...' : 'Save Attendance'}
            </Button>
            {selectedStaff ? (
              <span className="text-xs text-slate-500">
                Saving for <strong>{selectedStaff.staffName}</strong> ({selectedStaff.role})
              </span>
            ) : null}
          </div>
        </form>
      </Card>

      <Dialog open={newStaffOpen} onOpenChange={setNewStaffOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Staff Member</DialogTitle>
            <DialogDescription>Add a staff member. Attendance is added separately from the main page.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitNewStaff}>
            <div>
              <div className="mb-2 text-sm font-semibold">Staff Name</div>
              <Input
                value={newStaffName}
                onChange={(event) => setNewStaffName(event.target.value)}
                placeholder="Enter full name"
                className="w-full"
                autoFocus
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Role</span>
                <button
                  type="button"
                  onClick={() => setAddRoleOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New Role
                </button>
              </div>
              <select
                value={newStaffRole}
                onChange={(event) => setNewStaffRole(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">{loadingRoles ? 'Loading roles...' : 'Select a role'}</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewStaffOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingNewStaff}>
                {savingNewStaff ? 'Saving...' : 'Save Staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addRoleOpen} onOpenChange={setAddRoleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>Create a custom role. It will appear in every role dropdown across the system.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitNewRole}>
            <div>
              <div className="mb-2 text-sm font-semibold">Role Name</div>
              <Input
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
                placeholder="e.g. Naib Imam"
                className="w-full"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddRoleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingRole}>
                {savingRole ? 'Saving...' : 'Save Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
