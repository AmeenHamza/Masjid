import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'PKR', locale: 'en' | 'ur' = 'en') {
  if (locale === 'ur') {
    const formattedNumber = new Intl.NumberFormat('ur-PK', {
      maximumFractionDigits: 0
    }).format(value);
    return `${formattedNumber} روپے`;
  }

  const formattedNumber = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0
  }).format(value);

  if (currency === 'PKR') {
    return `Rs ${formattedNumber}`;
  }

  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-PK').format(value);
}

export function getPublicUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return new URL(path, baseUrl).toString();
}
