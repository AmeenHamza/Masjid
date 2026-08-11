'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
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
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const emptyValues = useMemo(() => buildEmptyValues(fields), [fields]);
  const normalizedDefaultValues = useMemo(() => normalizeDefaultValues(fields, defaultValues), [defaultValues, fields]);

  const mediaType = String(watch('mediaType') ?? defaultValues?.mediaType ?? 'image');

  useEffect(() => {
    const hasDefaults = Boolean(normalizedDefaultValues && Object.keys(normalizedDefaultValues).length > 0);
    reset(hasDefaults ? { ...emptyValues, ...normalizedDefaultValues } : emptyValues);
    setUploadErrors({});
  }, [emptyValues, normalizedDefaultValues, reset, resetToken]);

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
          const isUploading = uploadingField === field.name;
          const isDraggingOver = dragOverField === field.name;
          const hasError = Boolean(uploadErrors[field.name]);

          return (
            <div key={field.name} className="sm:col-span-2">
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <input
                ref={(element) => {
                  fileInputRefs.current[field.name] = element;
                }}
                type="file"
                accept={field.accept || 'image/*'}
                onChange={(event) => {
                  if (isDisabled) return;
                  void handleMediaUpload(field.name, event.target.files?.[0] ?? null);
                  event.target.value = '';
                }}
                className="hidden"
                disabled={isDisabled}
              />
              <input type="hidden" {...register(field.name)} />

              {mediaUrl && !isUploading ? (
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900/40">
                  {mediaType === 'video' ? (
                    <video
                      src={mediaUrl}
                      className="h-48 w-full object-cover sm:h-60"
                      controls
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img src={mediaUrl} alt="Uploaded media preview" className="h-48 w-full object-cover sm:h-60" />
                  )}
                  {!isDisabled ? (
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-slate-950/80 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[field.name]?.click()}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-white"
                      >
                        <ImagePlus className="h-3.5 w-3.5" /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue(field.name, '', { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={isDisabled ? -1 : 0}
                  onClick={() => !isDisabled && !isUploading && fileInputRefs.current[field.name]?.click()}
                  onKeyDown={(event) => {
                    if ((event.key === 'Enter' || event.key === ' ') && !isDisabled && !isUploading) {
                      event.preventDefault();
                      fileInputRefs.current[field.name]?.click();
                    }
                  }}
                  onDragOver={(event) => {
                    if (isDisabled) return;
                    event.preventDefault();
                    setDragOverField(field.name);
                  }}
                  onDragLeave={() => setDragOverField((current) => (current === field.name ? null : current))}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragOverField(null);
                    if (isDisabled || isUploading) return;
                    void handleMediaUpload(field.name, event.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
                    isDisabled
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5'
                      : hasError
                        ? 'cursor-pointer border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-950/20'
                        : isDraggingOver
                          ? 'cursor-pointer border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/20'
                          : 'cursor-pointer border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-white/15 dark:bg-white/5 dark:hover:border-emerald-400/60'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className={`h-7 w-7 ${hasError ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`} />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Click to upload <span className="font-normal text-slate-500 dark:text-slate-400">or drag and drop</span>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {mediaType === 'video' ? 'MP4, WebM, or other video files' : 'PNG, JPG, WEBP, or other image files'}
                      </p>
                    </>
                  )}
                </div>
              )}

              {uploadErrors[field.name] ? (
                <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{uploadErrors[field.name]}</p>
              ) : null}
            </div>
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
