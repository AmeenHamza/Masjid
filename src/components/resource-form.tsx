'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import { TimePicker } from './ui/time-picker';
import type { FieldConfig } from '@/lib/admin-ui';

type Props = {
  fields: FieldConfig[];
  defaultValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  resetToken?: number;
  disabledFields?: string[];
};

function buildEmptyValues(fields: FieldConfig[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => [field.name, field.type === 'checkbox' ? false : '']));
}

function normalizeDateValue(value: unknown) {
  if (!value) {
    return '';
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
}

function normalizeDefaultValues(fields: FieldConfig[], defaultValues?: Record<string, unknown>) {
  if (!defaultValues) {
    return undefined;
  }

  return Object.fromEntries(fields.map((field) => {
    const value = defaultValues[field.name];

    if (field.type === 'checkbox') {
      return [field.name, Boolean(value)];
    }

    if (field.type === 'date') {
      return [field.name, normalizeDateValue(value)];
    }

    if (field.type === 'select') {
      return [field.name, value == null ? '' : String(value)];
    }

    return [field.name, value ?? ''];
  }));
}

export function ResourceForm({ fields, defaultValues, onSubmit, submitLabel = 'Save', isSubmitting = false, resetToken = 0, disabledFields = [] }: Props) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<Record<string, unknown>>({ defaultValues });
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [staffOptions, setStaffOptions] = useState<Array<{ name: string; role: string }>>([]);
  const [showNewStaffInput, setShowNewStaffInput] = useState(false);

  const emptyValues = useMemo(() => buildEmptyValues(fields), [fields]);
  const normalizedDefaultValues = useMemo(() => normalizeDefaultValues(fields, defaultValues), [defaultValues, fields]);

  const mediaType = String(watch('mediaType') ?? defaultValues?.mediaType ?? 'image');

  useEffect(() => {
    const hasDefaults = Boolean(normalizedDefaultValues && Object.keys(normalizedDefaultValues).length > 0);
    reset(hasDefaults ? { ...emptyValues, ...normalizedDefaultValues } : emptyValues);
    setUploadErrors({});
  }, [emptyValues, normalizedDefaultValues, reset, resetToken]);

  useEffect(() => {
    let mounted = true;
    async function loadStaffs() {
      try {
        const res = await fetch('/api/admin/staff-records', { credentials: 'include' });
        const payload = await res.json().catch(() => null) as { items?: Record<string, unknown>[] } | null;
        if (!mounted || !payload?.items) return;

        const map = new Map<string, string>();
        for (const item of payload.items) {
          const name = String(item.staffName ?? '').trim();
          const role = String(item.role ?? '').trim();
          if (!name) continue;
          if (!map.has(name)) {
            map.set(name, role || '');
          }
        }

        const arr = Array.from(map.entries()).map(([name, role]) => ({ name, role }));
        setStaffOptions(arr);
      } catch {
        setStaffOptions([]);
      }
    }

    void loadStaffs();
    return () => { mounted = false; };
  }, []);

  async function handleMediaUpload(fieldName: string, file: File | null) {
    if (!file) {
      return;
    }

    if (mediaType === 'image') {
      if (!file.type.startsWith('image/')) {
        setUploadErrors((prev) => ({ ...prev, [fieldName]: 'Please select an image file.' }));
        return;
      }
    } else if (mediaType === 'video') {
      if (!file.type.startsWith('video/')) {
        setUploadErrors((prev) => ({ ...prev, [fieldName]: 'Please select a video file.' }));
        return;
      }
    } else {
      setUploadErrors((prev) => ({ ...prev, [fieldName]: 'Unsupported media type' }));
      return;
    }

    setUploadingField(fieldName);
    setUploadErrors((prev) => ({ ...prev, [fieldName]: '' }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', mediaType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const payload = (await response.json()) as { ok?: boolean; url?: string; message?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.message || 'Upload failed');
      }

      setValue(fieldName, payload.url, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setUploadErrors((prev) => ({ ...prev, [fieldName]: message }));
    } finally {
      setUploadingField(null);
    }
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field) => {
        const isDisabled = disabledFields.includes(field.name);

        if (field.type === 'textarea') {
          return (
            <label key={field.name} className="sm:col-span-2">
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <Textarea {...register(field.name)} className="min-h-[110px]" disabled={isDisabled} />
            </label>
          );
        }

        if (field.type === 'select') {
          return (
            <label key={field.name} className="min-w-0">
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <Select {...register(field.name)} className="w-full" disabled={isDisabled}>
                <option value="">Select...</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </label>
          );
        }

        if (field.type === 'checkbox') {
          return (
            <label key={field.name} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5 sm:col-span-2">
              <input type="checkbox" className="h-5 w-5" {...register(field.name)} disabled={isDisabled} />
              <span className="text-sm font-semibold">{field.label}</span>
            </label>
          );
        }

        if (field.type === 'media-upload') {
          const mediaUrl = String(watch(field.name) ?? '');

          return (
            <label key={field.name} className="sm:col-span-2">
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <Input
                type="file"
                accept={field.accept || 'image/*'}
                onChange={(event) => {
                  if (isDisabled) {
                    return;
                  }
                  void handleMediaUpload(field.name, event.target.files?.[0] ?? null);
                }}
                className="w-full"
                disabled={isDisabled}
              />
              <input type="hidden" {...register(field.name)} />
              {uploadingField === field.name ? <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">Uploading image...</p> : null}
              {uploadErrors[field.name] ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{uploadErrors[field.name]}</p> : null}
              {mediaUrl ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-slate-900/40">
                      {mediaType === 'image' ? (
                        <img src={mediaUrl} alt="Uploaded media preview" className="h-44 w-full rounded-lg object-cover sm:h-56" />
                      ) : (
                        <video
                          src={mediaUrl}
                          className="h-44 w-full rounded-lg object-cover sm:h-56"
                          controls
                          muted
                          autoPlay
                          loop
                          playsInline
                        />
                      )}
                </div>
              ) : null}
            </label>
          );
        }

        if (field.type === 'time') {
          return (
            <label key={field.name} className="min-w-0">
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <div className="relative">
                <TimePicker
                  value={String(watch(field.name) ?? '')}
                  onChange={(value) => {
                    if (isDisabled) {
                      return;
                    }
                    setValue(field.name, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                  }}
                  className="w-full"
                />
                <input type="hidden" {...register(field.name)} />
              </div>
            </label>
          );
        }

        if (field.name === 'staffName' && field.type === 'text') {
          return (
            <label key={field.name} className="min-w-0">
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <select
                {...register(field.name, {
                  onChange: (e: any) => {
                    const val = String(e.target.value ?? '');
                    if (val === '__new__') {
                      setShowNewStaffInput(true);
                      setValue(field.name, '', { shouldDirty: true, shouldTouch: true });
                      setValue('role', '', { shouldDirty: true, shouldTouch: true });
                      return;
                    }
                    setShowNewStaffInput(false);
                    setValue(field.name, val, { shouldDirty: true, shouldTouch: true });
                    const found = staffOptions.find((s) => s.name === val);
                    if (found && found.role) {
                      setValue('role', found.role, { shouldDirty: true, shouldTouch: true });
                    }
                  }
                })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                disabled={isDisabled}
              >
                <option value="">Select...</option>
                {staffOptions.map((opt) => (
                  <option key={opt.name} value={opt.name}>{opt.name}{opt.role ? ` — ${opt.role}` : ''}</option>
                ))}
                <option value="__new__">Add new...</option>
              </select>

              {showNewStaffInput ? (
                <div className="mt-2">
                  <Input type="text" placeholder="Enter new staff name" {...register(field.name)} className="w-full" disabled={isDisabled} />
                </div>
              ) : null}
            </label>
          );
        }

        return (
          <label key={field.name} className="min-w-0">
            <div className="mb-2 text-sm font-semibold">{field.label}</div>
            <Input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'} {...register(field.name)} className="w-full" disabled={isDisabled} />
          </label>
        );
      })}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
