export function formatDayLabel(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes}${ampm}`;
}

export function getWeekDays(): Date[] {
  const today = new Date();
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    weekDays.push(day);
  }
  return weekDays;
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function getDateForDayName(dayName: string): string | null {
  const days: Record<string, number> = {
    'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0
  };

  const today = new Date();
  const todayDay = today.getDay();
  const targetDay = days[dayName.toLowerCase()];

  if (targetDay === undefined) return null;

  let daysUntil = targetDay - todayDay;
  if (daysUntil <= 0) daysUntil += 7; // Always go forward

  const result = new Date(today);
  result.setDate(today.getDate() + daysUntil);

  // Format as YYYY-MM-DD using local time not UTC
  const year = result.getFullYear();
  const month = String(result.getMonth() + 1).padStart(2, '0');
  const date = String(result.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function getTodayDayName(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long' });
}
