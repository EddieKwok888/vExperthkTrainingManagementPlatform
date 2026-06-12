import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get the current time but artificially shifted so that local JS methods (.getHours(), .getDate(), etc.) return HK time values.
// WARNING: The internal timestamp of this Date object will be shifted. Do not save this directly to DB as a timestamp.
export function getHkTime() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 8)); // UTC+8
}

// Safely parse an ISO date string (YYYY-MM-DD) as midnight in HK Time
export function parseHkDate(dateString: string) {
  if (!dateString) return getHkTime();
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getHkDateString(date: Date = getHkTime()) {
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
