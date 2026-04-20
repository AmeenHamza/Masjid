'use client';

import { useEffect } from 'react';
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
};

export function ResourceForm({ fields, defaultValues, onSubmit, submitLabel = 'Save', isSubmitting = false }: Props) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<Record<string, unknown>>({ defaultValues });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field) => {
        if (field.type === 'textarea') {
          return (
            <label key={field.name} className="sm:col-span-2">
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <Textarea {...register(field.name)} defaultValue={defaultValues?.[field.name] as string | undefined} className="min-h-[110px]" />
            </label>
          );
        }

        if (field.type === 'select') {
          return (
            <label key={field.name} className="min-w-0">
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <Select {...register(field.name)} defaultValue={String(defaultValues?.[field.name] ?? '')} className="w-full">
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
              <input type="checkbox" className="h-5 w-5" defaultChecked={Boolean(defaultValues?.[field.name])} onChange={(event) => setValue(field.name, event.target.checked)} />
              <span className="text-sm font-semibold">{field.label}</span>
            </label>
          );
        }

        return (
          <label key={field.name} className="min-w-0">
            <div className="mb-2 text-sm font-semibold">{field.label}</div>
            <Input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'} {...register(field.name)} defaultValue={String(defaultValues?.[field.name] ?? '')} className="w-full" />
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
