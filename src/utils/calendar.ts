import { supabase } from '../lib/supabase';

export async function requestCalendarPermission(): Promise<boolean> {
  return true;
}

export async function addItemToCalendar(item: {
  title: string;
  date: string | null;
  time: string | null;
  emoji?: string | null;
}): Promise<string | null> {
  if (!item.date) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-calendar-event`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        title: item.title,
        date: item.date,
        time: item.time || null,
        emoji: item.emoji || null,
      }),
    });
    if (!response.ok) return null;
    const icsText = await response.text();
    const encoded = encodeURIComponent(icsText);
    const dataUrl = `data:text/calendar;charset=utf8,${encoded}`;
    window.open(dataUrl, '_blank');
    return 'ics';
  } catch {
    return null;
  }
}

export async function removeItemFromCalendar(_eventId: string): Promise<void> {
  // Cannot remove via ICS
}
