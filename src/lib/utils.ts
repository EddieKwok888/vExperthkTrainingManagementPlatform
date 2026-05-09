import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getHkDateString(date: Date = new Date()) {
  return date.toLocaleDateString('en-CA', { // en-CA gives YYYY-MM-DD
    timeZone: 'Asia/Hong_Kong'
  });
}

export function formatHkDate(date: any, includeTime = false) {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  
  return d.toLocaleString('en-HK', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: includeTime ? '2-digit' : undefined,
    minute: includeTime ? '2-digit' : undefined,
    second: includeTime ? '2-digit' : undefined,
    hour12: false
  });
}
