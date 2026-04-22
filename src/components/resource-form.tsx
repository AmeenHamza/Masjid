'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import type { FieldConfig } from '@/lib/admin-ui';

type Props = {
  fields: FieldConfig[];
  defaultValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  resetToken?: number;
};

function buildEmptyValues(fields: FieldConfig[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => [field.name, field.type === 'checkbox' ? false : '']));
}

export function ResourceForm({ fields, defaultValues, onSubmit, submitLabel = 'Save', isSubmitting = false, resetToken = 0 }: Props) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<Record<string, unknown>>({ defaultValues });
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const emptyValues = useMemo(() => buildEmptyValues(fields), [fields]);

  const mediaType = String(watch('mediaType') ?? defaultValues?.mediaType ?? 'image');

  useEffect(() => {
    const hasDefaults = Boolean(defaultValues && Object.keys(defaultValues).length > 0);
    reset(hasDefaults ? { ...emptyValues, ...defaultValues } : emptyValues);
    setUploadErrors({});
  }, [defaultValues, emptyValues, reset]);

  useEffect(() => {
    reset(emptyValues);
    setUploadErrors({});
  }, [emptyValues, reset, resetToken]);

  async function handleMediaUpload(fieldName: string, file: File | null) {
    if (!file) {
      return;
    }

    if (mediaType !== 'image') {
      setUploadErrors((prev) => ({ ...prev, [fieldName]: 'Video upload will be available soon. Please select Image for now.' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadErrors((prev) => ({ ...prev, [fieldName]: 'Please select an image file.' }));
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
        if (field.type === 'textarea') {
          return (
            <label key={field.name} className="sm:col-span-2">
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <Textarea {...register(field.name)} className="min-h-[110px]" />
            </label>
          );
        }

        if (field.type === 'select') {
          return (
            <label key={field.name} className="min-w-0">
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <Select {...register(field.name)} className="w-full">
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
              <input type="checkbox" className="h-5 w-5" {...register(field.name)} />
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
                  void handleMediaUpload(field.name, event.target.files?.[0] ?? null);
                }}
                className="w-full"
              />
              <input type="hidden" {...register(field.name)} />
              {uploadingField === field.name ? <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">Uploading image...</p> : null}
              {uploadErrors[field.name] ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{uploadErrors[field.name]}</p> : null}
              {mediaUrl ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-slate-900/40">
                  {mediaType === 'image' ? (
                    <img src={mediaUrl} alt="Uploaded media preview" className="h-44 w-full rounded-lg object-cover sm:h-56" />
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-300">Video preview will be enabled when video upload support is released.</p>
                  )}
                </div>
              ) : null}
            </label>
          );
        }

        return (
          <label key={field.name} className="min-w-0">
            <div className="mb-2 text-sm font-semibold">{field.label}</div>
            <Input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'} {...register(field.name)} className="w-full" />
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
