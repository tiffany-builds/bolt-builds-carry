import { registerPlugin } from '@capacitor/core';

interface CalendarPlugin {
  requestPermission(): Promise<{ granted: boolean }>;
  addEvent(options: {
    title: string;
    date: string;
    time?: string;
  }): Promise<{ eventId: string }>;
  removeEvent(options: { eventId: string }): Promise<void>;
}

export const Calendar = registerPlugin<CalendarPlugin>('Calendar');

export async function requestCalendarPermission(): Promise<boolean> {
  try {
    const { granted } = await Calendar.requestPermission();
    return granted;
  } catch {
    return false;
  }
}

export async function addItemToCalendar(item: {
  title: string;
  date: string | null;
  time: string | null;
}): Promise<string | null> {
  if (!item.date) return null;
  try {
    const { eventId } = await Calendar.addEvent({
      title: item.title,
      date: item.date,
      time: item.time || undefined,
    });
    return eventId || null;
  } catch {
    return null;
  }
}

export async function removeItemFromCalendar(eventId: string): Promise<void> {
  try {
    await Calendar.removeEvent({ eventId });
  } catch {
    // fail silently
  }
}
