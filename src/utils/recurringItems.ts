import { supabase } from '../lib/supabase';
import { getTodayDateString } from './dateFormatting';

// How repeating items work in Carry:
// - The "master" item (recurring = true, no recurring_parent_id) holds the rule and is the first occurrence.
// - Copies (recurring_parent_id = master id) are created for upcoming dates. Never on the master's own date.
// - Missed copies (date in the past, not ticked) are hidden, so they never pile up.
// - "Just this one" sets skipped = true, so the copy stays gone and is never recreated.
// - Boxes show each series once (its next occurrence); the timeline shows every day.

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(s: string, n: number): string {
  const d = parseDate(s);
  return toDateStr(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

// Same day number in another month, clamped (31 Jan -> 28 or 29 Feb)
function clampedDate(year: number, monthIndex: number, day: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return toDateStr(new Date(year, monthIndex, Math.min(day, lastDay)));
}

export function repeatLabel(pattern: string | null | undefined, dayOfWeek: number | null | undefined, durationDays?: number | null): string {
  if (pattern === 'daily') return durationDays ? `Every day for ${durationDays} days` : 'Every day';
  if (pattern === 'weekly') return dayOfWeek !== null && dayOfWeek !== undefined ? `Every ${DAY_NAMES[dayOfWeek]}` : 'Every week';
  if (pattern === 'monthly') return 'Every month';
  if (pattern === 'yearly') return 'Every year';
  return 'Repeats';
}

function occurrences(item: any, start: string, today: string): string[] {
  const pattern = item.recurring_pattern;
  const dates: string[] = [];

  if (pattern === 'weekly') {
    const dow = item.recurring_day_of_week ?? parseDate(start).getDay();
    let d = today;
    while (parseDate(d).getDay() !== dow) d = addDays(d, 1);
    for (let w = 0; w < 4; w++) dates.push(addDays(d, w * 7));
  } else if (pattern === 'daily') {
    const from = start > today ? start : today;
    let to = addDays(today, 13);
    if (item.recurring_duration_days) {
      const lastDay = addDays(start, item.recurring_duration_days - 1);
      if (lastDay < to) to = lastDay;
    }
    for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d);
  } else if (pattern === 'monthly') {
    const dom = parseDate(start).getDate();
    const t = parseDate(today);
    for (let i = 0; i < 4 && dates.length < 3; i++) {
      const c = clampedDate(t.getFullYear(), t.getMonth() + i, dom);
      if (c >= today) dates.push(c);
    }
  } else if (pattern === 'yearly') {
    const s = parseDate(start);
    const t = parseDate(today);
    const horizon = addDays(today, 400);
    for (const y of [t.getFullYear(), t.getFullYear() + 1]) {
      const c = clampedDate(y, s.getMonth(), s.getDate());
      if (c >= today && c <= horizon) dates.push(c);
    }
  }

  return [...new Set(dates)].filter(d => d >= start);
}

async function getExistingInstanceDates(userId: string, parentId: string, dates: string[]): Promise<Set<string>> {
  try {
    // Includes ticked and skipped copies, so neither is ever recreated
    const { data, error } = await supabase
      .from('items')
      .select('date')
      .eq('user_id', userId)
      .eq('recurring_parent_id', parentId)
      .in('date', dates);
    if (error || !data) return new Set(dates); // on error, create nothing rather than duplicates
    return new Set(data.map((row: any) => row.date));
  } catch {
    return new Set(dates);
  }
}

// Creates the upcoming copies for the given master items and returns the new rows
export async function createCopiesFor(userId: string, masters: any[]): Promise<any[]> {
  const today = getTodayDateString();
  const created: any[] = [];
  for (const item of masters) {
    if (!item || !item.recurring || item.recurring_parent_id) continue;
    const start = item.date || (item.created_at ? String(item.created_at).slice(0, 10) : today);
    // The master item is the first occurrence, so never add a copy on its own date
    const dates = occurrences(item, start, today).filter(d => d !== item.date);
    if (dates.length === 0) continue;

    const existingDates = await getExistingInstanceDates(userId, item.id, dates);
    const missingDates = dates.filter(d => !existingDates.has(d));
    if (missingDates.length === 0) continue;

    const rowsToInsert = missingDates.map(dateStr => ({
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
      // Copied so each copy can show "Every Thursday" even if the master is ticked off
      recurring_pattern: item.recurring_pattern,
      recurring_day_of_week: item.recurring_day_of_week,
    }));

    const { data } = await supabase.from('items').insert(rowsToInsert).select();
    if (data) created.push(...data);
  }
  return created;
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
    await createCopiesFor(userId, recurringItems as any[]);
  } catch (err) {
  }
}

function seriesKey(item: any): string | null {
  if (item.recurring_parent_id) return item.recurring_parent_id;
  if (item.recurring) return item.id;
  return null;
}

// Run on every load: hides skipped items and missed repeats, and labels repeats
export function prepareItems<T>(items: T[]): T[] {
  const today = getTodayDateString();
  const masters: Record<string, any> = {};
  for (const i of items as any[]) {
    if (i.recurring && !i.recurring_parent_id) masters[i.id] = i;
  }
  // A "for N days" repeat that has finished is hidden completely, master included
  const finished = new Set<string>();
  for (const id in masters) {
    const m = masters[id];
    if (m.recurring_duration_days) {
      const start = m.date || (m.created_at ? String(m.created_at).slice(0, 10) : today);
      if (addDays(start, m.recurring_duration_days - 1) < today) finished.add(id);
    }
  }
  const out: any[] = [];
  for (const i of items as any[]) {
    if (i.skipped) continue;
    const key = seriesKey(i);
    if (key && finished.has(key)) continue;
    if (key && i.date && i.date < today) continue; // missed repeat: let it go quietly
    if (key) {
      const m = masters[key] || i;
      i.repeat_label = repeatLabel(m.recurring_pattern ?? i.recurring_pattern, m.recurring_day_of_week ?? i.recurring_day_of_week, m.recurring_duration_days);
    }
    out.push(i);
  }
  return out as T[];
}

// For boxes and counts: each repeating series appears once, as its next occurrence
export function collapseSeries<T>(items: T[]): T[] {
  const best: Record<string, any> = {};
  for (const i of items as any[]) {
    const key = seriesKey(i);
    if (!key) continue;
    const cur = best[key];
    const d = i.date || '9999-12-31';
    if (!cur || d < (cur.date || '9999-12-31')) best[key] = i;
  }
  return (items as any[]).filter(i => {
    const key = seriesKey(i);
    return !key || best[key] === i;
  }) as T[];
}
