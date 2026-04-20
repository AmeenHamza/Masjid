import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'default', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium transition disabled:pointer-events-none disabled:opacity-60',
        variant === 'default' && 'bg-emerald-700 text-white shadow-soft hover:bg-emerald-800',
        variant === 'secondary' && 'bg-amber-500 text-slate-950 hover:bg-amber-400',
        variant === 'outline' && 'border border-slate-300 bg-transparent text-current hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5',
        variant === 'ghost' && 'bg-transparent hover:bg-slate-100 dark:hover:bg-white/10',
        variant === 'destructive' && 'bg-rose-600 text-white hover:bg-rose-700',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-11 px-5 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        className
      )}
      {...props}
    />
  );
}
