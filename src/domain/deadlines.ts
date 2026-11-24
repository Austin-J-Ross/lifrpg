export const DAY = 86400000;
export function daysPastDeadline(deadline: number, now: number) {
  function calendarDay(timestamp: number) {
    const date = new Date(timestamp);
    const utc = new Date(0);
    return utc.setUTCFullYear(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
  }
  return Math.max(0, (calendarDay(now) - calendarDay(deadline)) / DAY);
}
export function localDateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
export function deadlineForDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 9999) return NaN;
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(23, 59, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return NaN;
  return date.getTime();
}
export function dayDeadline(offset: number, now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() + offset);
  return deadlineForDate(localDateValue(date));
}
