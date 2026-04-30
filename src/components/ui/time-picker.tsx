import { useEffect, useState } from 'react';

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function TimePicker({ value, onChange, className = '' }: TimePickerProps) {
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [isOpen, setIsOpen] = useState(false);

  // Parse input value (e.g., "01:30" or "13:30") on mount or value change
  useEffect(() => {
    if (value && typeof value === 'string' && value.includes(':')) {
      const [h, m] = value.split(':');
      const hour24 = parseInt(h, 10);
      const minute = parseInt(m, 10);

      if (!isNaN(hour24) && !isNaN(minute)) {
        // Convert to 12-hour format
        const isPM = hour24 >= 12;
        let hour12 = hour24 % 12;
        if (hour12 === 0) hour12 = 12;

        setHours(String(hour12).padStart(2, '0'));
        setMinutes(String(minute).padStart(2, '0'));
        setPeriod(isPM ? 'PM' : 'AM');
      }
    }
  }, [value]);

  // Auto-detect device time on component mount
  useEffect(() => {
    const now = new Date();
    const deviceHour = now.getHours();
    const deviceMinutes = now.getMinutes();
    const deviceIsPM = deviceHour >= 12;

    let deviceHour12 = deviceHour % 12;
    if (deviceHour12 === 0) deviceHour12 = 12;

    setHours(String(deviceHour12).padStart(2, '0'));
    setMinutes(String(deviceMinutes).padStart(2, '0'));
    setPeriod(deviceIsPM ? 'PM' : 'AM');
  }, []);

  const handleConfirm = () => {
    // Convert 12-hour format to 24-hour format
    let hour24 = parseInt(hours, 10);
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }

    const timeString = `${String(hour24).padStart(2, '0')}:${minutes}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const incrementHours = () => {
    let h = parseInt(hours, 10) + 1;
    if (h > 12) h = 1;
    setHours(String(h).padStart(2, '0'));
  };

  const decrementHours = () => {
    let h = parseInt(hours, 10) - 1;
    if (h < 1) h = 12;
    setHours(String(h).padStart(2, '0'));
  };

  const incrementMinutes = () => {
    let m = (parseInt(minutes, 10) + 1) % 60;
    if (m === 0) m = 60;
    setMinutes(String(m).padStart(2, '0'));
  };

  const decrementMinutes = () => {
    let m = parseInt(minutes, 10) - 1;
    if (m < 1) m = 60;
    setMinutes(String(m).padStart(2, '0'));
  };

  const togglePeriod = () => {
    setPeriod(period === 'AM' ? 'PM' : 'AM');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 text-left font-semibold text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 w-full"
      >
        <span>
          {hours}:{minutes} {period}
        </span>
        <span className="text-slate-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border border-slate-200 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-slate-950">
          <div className="space-y-4">
            {/* Hour Picker */}
            <div>
              <div className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Hour
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-100 p-2 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={decrementHours}
                  className="h-8 w-8 rounded bg-slate-200 text-sm font-bold hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  −
                </button>
                <div className="text-2xl font-bold">{hours}</div>
                <button
                  type="button"
                  onClick={incrementHours}
                  className="h-8 w-8 rounded bg-slate-200 text-sm font-bold hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Minute Picker */}
            <div>
              <div className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Minutes (1-60)
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-100 p-2 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={decrementMinutes}
                  className="h-8 w-8 rounded bg-slate-200 text-sm font-bold hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  −
                </button>
                <div className="text-2xl font-bold">{minutes}</div>
                <button
                  type="button"
                  onClick={incrementMinutes}
                  className="h-8 w-8 rounded bg-slate-200 text-sm font-bold hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* AM/PM Toggle */}
            <div>
              <div className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Period
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={togglePeriod}
                  className={`flex-1 rounded-lg py-2 font-bold transition-colors ${
                    period === 'AM'
                      ? 'bg-amber-400 text-slate-950 dark:bg-amber-400'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={togglePeriod}
                  className={`flex-1 rounded-lg py-2 font-bold transition-colors ${
                    period === 'PM'
                      ? 'bg-amber-400 text-slate-950 dark:bg-amber-400'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-slate-300 py-2 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-amber-400 py-2 font-bold text-slate-950 hover:bg-amber-300 dark:bg-amber-400 dark:hover:bg-amber-300"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
