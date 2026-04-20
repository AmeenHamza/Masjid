'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [intervalMs, router]);

  return null;
}
