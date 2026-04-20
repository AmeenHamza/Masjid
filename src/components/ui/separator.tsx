import * as React from 'react';
import { cn } from '@/lib/utils';

export function Separator({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('border-slate-200 dark:border-white/10', className)} {...props} />;
}
