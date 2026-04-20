import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Switch({ className, ...props }: SwitchProps) {
  return <input type="checkbox" className={cn('h-5 w-9 cursor-pointer rounded-full border border-slate-300 bg-slate-200 accent-emerald-700 dark:border-white/10 dark:bg-slate-700', className)} {...props} />;
}
