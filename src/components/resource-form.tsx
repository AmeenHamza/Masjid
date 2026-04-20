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
};

export function ResourceForm({ fields, defaultValues, onSubmit }: Props) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<Record<string, unknown>>({ defaultValues });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field) => {
        if (field.type === 'textarea') {
          return (
            <label key={field.name} className="md:col-span-2">
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <Textarea {...register(field.name)} defaultValue={defaultValues?.[field.name] as string | undefined} />
            </label>
          );
        }

        if (field.type === 'select') {
          return (
            <label key={field.name}>
              <div className="mb-2 text-sm font-semibold">{field.label}</div>
              <Select {...register(field.name)} defaultValue={String(defaultValues?.[field.name] ?? '')}>
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
            <label key={field.name} className="flex items-center gap-3 pt-8">
              <input type="checkbox" className="h-5 w-5" defaultChecked={Boolean(defaultValues?.[field.name])} onChange={(event) => setValue(field.name, event.target.checked)} />
              <span className="text-sm font-semibold">{field.label}</span>
            </label>
          );
        }

        return (
          <label key={field.name}>
            <div className="mb-2 text-sm font-semibold">{field.label}</div>
            <Input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'} {...register(field.name)} defaultValue={String(defaultValues?.[field.name] ?? '')} />
          </label>
        );
      })}
      <div className="md:col-span-2">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
