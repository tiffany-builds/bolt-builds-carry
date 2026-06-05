import { Browser } from '@capacitor/browser';
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

    const params = new URLSearchParams({
      title: item.title,
      date: item.date,
      time: item.time || '',
      emoji: item.emoji || '',
      token: token || '',
    });

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-calendar-event?${params.toString()}`;

    await Browser.open({ url });

    const timer = setTimeout(() => {
      Browser.close();
    }, 20000);

    Browser.addListener('browserFinished', () => {
      clearTimeout(timer);
      Browser.removeAllListeners();
    });

    return 'ics';
  } catch {
    return null;
  }
}

export async function removeItemFromCalendar(_eventId: string): Promise<void> {
  // Cannot remove via ICS
}
