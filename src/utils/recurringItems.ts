import { supabase } from '../lib/supabase';
import { getTodayDateString } from './dateFormatting';

interface RecurringItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  emoji: string | null;
  time: string | null;
  recurring: boolean;
  recurring_pattern: string | null;
  recurring_day_of_week: number | null;
  user_id: string;
  type: string;
}

function getNextOccurrences(
  dayOfWeek: number,
  weeksAhead: number = 4
): string[] {
  const dates: string[] = [];

  const now = new Date();
  const todayLocal = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const todayDayOfWeek = todayLocal.getDay();

  for (let week = 0; week < weeksAhead; week++) {
    let daysUntil = dayOfWeek - todayDayOfWeek;
    if (daysUntil < 0) daysUntil += 7;
    const totalDays = daysUntil + (week * 7);

    const targetDate = new Date(
      todayLocal.getFullYear(),
      todayLocal.getMonth(),
      todayLocal.getDate() + totalDays
    );

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    dates.push(dateStr);
  }

  return [...new Set(dates)];
}

function getNextDailyOccurrences(daysAhead: number = 14, startDate?: string | null): string[] {
  const dates: string[] = [];
  const startFrom = startDate
    ? new Date(startDate + 'T00:00:00')
    : new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const baseDate = startFrom > today ? startFrom : today;

  for (let i = 0; i < daysAhead; i++) {
    const target = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + i);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

function getNextMonthlyOccurrences(monthsAhead: number = 3): string[] {
  const dates: string[] = [];
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < monthsAhead; i++) {
    const target = new Date(todayLocal.getFullYear(), todayLocal.getMonth() + i, todayLocal.getDate());
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

async function instanceExists(
  userId: string,
  parentId: string,
  date: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('id')
      .eq('user_id', userId)
      .eq('recurring_parent_id', parentId)
      .eq('date', date);

    if (error) return false;
    return data !== null && data.length > 0;
  } catch {
    return false;
  }
}

export async function generateRecurringInstances(userId: string): Promise<void> {
  const today = getTodayDateString();
  const lastRun = localStorage.getItem(`carry_recurring_last_run_${userId}`);
  if (lastRun === today) return;
  localStorage.setItem(`carry_recurring_last_run_${userId}`, today);

  try {
    const { data: recurringItems, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .eq('recurring', true)
      .is('recurring_parent_id', null);

    if (error || !recurringItems) return;

    for (const item of recurringItems as RecurringItem[]) {
      if (item.recurring_pattern === 'weekly' && item.recurring_day_of_week !== null) {
        const dates = getNextOccurrences(item.recurring_day_of_week, 4);

        for (const date of dates) {
          const exists = await instanceExists(userId, item.id, date);
          if (!exists) {
            await supabase.from('items').insert({
              user_id: userId,
              title: item.title,
              description: item.description,
              category: item.category,
              emoji: item.emoji,
              completed: false,
              time_frame: 'anytime',
              date: date,
              time: item.time,
              has_date_time: true,
              type: item.type,
              recurring: false,
              recurring_parent_id: item.id,
            });
          }
        }
      }

      if (item.recurring_pattern === 'daily') {
        const dates = getNextDailyOccurrences(14, (item as any).date);
        for (const dateStr of dates) {
          const exists = await instanceExists(userId, item.id, dateStr);
          if (!exists) {
            await supabase.from('items').insert({
              user_id: userId,
              title: item.title,
              description: item.description,
              category: item.category,
              emoji: item.emoji,
              completed: false,
              time_frame: 'anytime',
              date: dateStr,
              time: item.time,
              has_date_time: true,
              type: item.type,
              recurring: false,
              recurring_parent_id: item.id,
            });
          }
        }
      }

      if (item.recurring_pattern === 'monthly') {
        const dates = getNextMonthlyOccurrences(3);
        for (const dateStr of dates) {
          const exists = await instanceExists(userId, item.id, dateStr);
          if (!exists) {
            await supabase.from('items').insert({
              user_id: userId,
              title: item.title,
              description: item.description,
              category: item.category,
              emoji: item.emoji,
              completed: false,
              time_frame: 'anytime',
              date: dateStr,
              time: item.time,
              has_date_time: true,
              type: item.type,
              recurring: false,
              recurring_parent_id: item.id,
            });
          }
        }
      }
    }
  } catch (err) {
  }
}
