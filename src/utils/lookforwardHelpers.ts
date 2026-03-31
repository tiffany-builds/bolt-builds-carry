import { parseDateString } from './dateFormatting';

export function formatLookforwardDate(startDate: string, endDate?: string | null): string {
  const start = parseDateString(startDate);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (!endDate || startDate === endDate) {
    return `${start.getDate()} ${months[start.getMonth()]}`;
  }

  const end = parseDateString(endDate);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${months[start.getMonth()]}`;
  }
  return `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}`;
}

export function getDaysUntil(dateStr: string): string {
  if (!dateStr) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDateString(dateStr);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days === 0) return "That's today! 🎉";
  if (days === 1) return "Tomorrow ✨";
  if (days < 7) return `${days} days away`;
  if (days < 14) return `Just over a week away`;
  if (days < 30) return `${Math.round(days / 7)} weeks away`;
  if (days < 60) return `About a month away`;
  return `${Math.round(days / 30)} months away`;
}
