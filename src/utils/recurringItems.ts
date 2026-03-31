import { supabase } from '../lib/supabase';

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let week = 0; week < weeksAhead; week++) {
    const date = new Date(today);
    let daysUntil = dayOfWeek - today.getDay();
    if (daysUntil < 0) daysUntil += 7;
    if (daysUntil === 0 && week === 0) daysUntil = 0;
    date.setDate(today.getDate() + daysUntil + (week * 7));

    const dateStr = date.toISOString().split('T')[0];
    if (dateStr >= today.toISOString().split('T')[0]) {
      dates.push(dateStr);
    }
  }
  return [...new Set(dates)];
}

async function instanceExists(
  userId: string,
  parentId: string,
  date: string
): Promise<boolean> {
  const { data } = await supabase
    .from('items')
    .select('id')
    .eq('user_id', userId)
    .eq('recurring_parent_id', parentId)
    .eq('date', date)
    .maybeSingle();
  return !!data;
}

export async function generateRecurringInstances(userId: string): Promise<void> {
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
        const today = new Date();
        for (let i = 0; i < 14; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];

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
    console.log('Error generating recurring instances:', err);
  }
}
