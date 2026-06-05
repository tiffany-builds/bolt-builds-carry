import { LocalNotifications } from '@capacitor/local-notifications';

const MORNING_BRIEFING_ID = 1001;
const REMINDER_ID_START = 2000;
const REMINDER_ID_END = 2999;

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleMorningBriefing(
  items: Array<{ date: string | null; has_date_time: boolean; title: string }>
): Promise<void> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const count = items.filter(item => item.date === tomorrowStr).length;

    await LocalNotifications.cancel({ notifications: [{ id: MORNING_BRIEFING_ID }] });

    if (count === 0) return;

    const scheduledAt = new Date(tomorrow);
    scheduledAt.setHours(7, 0, 0, 0);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: MORNING_BRIEFING_ID,
          title: 'Good morning ☀️',
          body: `You have ${count} ${count === 1 ? 'thing' : 'things'} on today`,
          schedule: { at: scheduledAt },
          sound: 'Hello.caf',
        },
      ],
    });
  } catch {
    // Notifications unavailable (e.g. web/browser) — fail silently
  }
}

export async function scheduleItemReminders(
  items: Array<{
    id: string;
    title: string;
    date: string | null;
    time: string | null;
    has_date_time: boolean;
    completed: boolean;
    emoji?: string | null;
  }>
): Promise<void> {
  try {
    const existingIds = Array.from(
      { length: REMINDER_ID_END - REMINDER_ID_START + 1 },
      (_, i) => ({ id: REMINDER_ID_START + i })
    );
    await LocalNotifications.cancel({ notifications: existingIds });

    const now = new Date();
    const eligible = items.filter(
      item => item.has_date_time && item.date && item.time && !item.completed
    );

    const toSchedule = [];
    for (let i = 0; i < eligible.length && i < REMINDER_ID_END - REMINDER_ID_START + 1; i++) {
      const item = eligible[i];
      const itemDate = new Date(`${item.date}T${item.time}`);
      const notifyAt = new Date(itemDate.getTime() - 60 * 60 * 1000);

      if (notifyAt <= now) continue;

      const title = item.emoji ? `${item.emoji} ${item.title}` : item.title;

      toSchedule.push({
        id: REMINDER_ID_START + i,
        title,
        body: 'Coming up in an hour',
        schedule: { at: notifyAt },
        sound: 'Hello.caf',
      });
    }

    if (toSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: toSchedule });
    }
  } catch {
    // Notifications unavailable — fail silently
  }
}
