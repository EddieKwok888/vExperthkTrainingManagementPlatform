export const HK_PUBLIC_HOLIDAYS = [
  // 2025 Holidays (Common reference, just in case)
  '2025-01-01', '2025-01-29', '2025-01-30', '2025-01-31', '2025-04-04',
  '2025-04-18', '2025-04-19', '2025-04-21', '2025-05-01', '2025-05-05',
  '2025-05-31', '2025-07-01', '2025-10-01', '2025-10-07', '2025-10-29',
  '2025-12-25', '2025-12-26',

  // 2026 Holidays (As requested)
  '2026-01-01',
  '2026-02-17',
  '2026-02-18',
  '2026-02-19',
  '2026-04-03',
  '2026-04-04',
  '2026-04-06',
  '2026-04-07',
  '2026-05-01',
  '2026-05-25',
  '2026-06-19',
  '2026-07-01',
  '2026-09-26',
  '2026-10-01',
  '2026-10-19',
  '2026-12-25',
  '2026-12-26'
];

export function isWeekendOrHoliday(dateString: string): { isInvalid: boolean; reason?: string } {
  if (!dateString) return { isInvalid: false };
  
  const dateObj = new Date(dateString);
  const dayOfWeek = dateObj.getDay();
  
  // 0 is Sunday, 6 is Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isInvalid: true, reason: 'Weekends (Saturday/Sunday) Cannot be selected / 星期六及星期日不可選' };
  }

  if (HK_PUBLIC_HOLIDAYS.includes(dateString)) {
    return { isInvalid: true, reason: 'Public Holidays Cannot be selected / 公眾假期不可選' };
  }

  return { isInvalid: false };
}
