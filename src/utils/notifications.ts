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

export async function scheduleSundayNotification(
  items: Array<{
    title: string;
    category: string;
    completed: boolean;
    created_at: string;
  }>
): Promise<void> {
  try {
    const SUNDAY_NOTIFICATION_ID = 1002;

    await LocalNotifications.cancel({
      notifications: [{ id: SUNDAY_NOTIFICATION_ID }]
    });

    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7 || 7);
    nextSunday.setHours(18, 0, 0, 0);

    if (nextSunday <= now) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }

    // Get this week's items
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thisWeeksItems = items.filter(item =>
      new Date(item.created_at) >= oneWeekAgo
    );

    const completedItems = thisWeeksItems.filter(i => i.completed);
    const totalAdded = thisWeeksItems.length;

    // Keyword detection for personalisation
    const allTitles = completedItems.map(i => i.title.toLowerCase()).join(' ');

    const cookingWords = ['made', 'cooked', 'baked', 'dinner', 'lunch', 'breakfast',
      'meal', 'pizza', 'pasta', 'cake', 'crêpes', 'cornbread', 'curry', 'noodles',
      'soup', 'cook', 'recipe'];

    const healthWords = ['pilates', 'yoga', 'walk', 'run', 'gym', 'swim', 'vitamins',
      'workout', 'class', 'exercise', 'jog', 'cycling'];

    const socialWords = ['friends', 'over', 'visit', 'birthday', 'party',
      'celebration', 'picnic', 'dinner with', 'lunch with', 'day out'];

    const hasCooking = cookingWords.some(w => allTitles.includes(w));
    const hasHealth = healthWords.some(w => allTitles.includes(w));
    const hasSocial = socialWords.some(w => allTitles.includes(w));
    const isBusy = completedItems.length >= 10;
    const hasLotsAdded = totalAdded >= 8;

    // Message selection
    const cookingMessages = [
      "You had a busy week and still made time to cook. Nice one. 🧡",
      "Meals made, week handled. Not bad at all.",
      "Somehow you fed everyone and kept everything else moving too. 🧡",
    ];

    const healthMessages = [
      "You made time for yourself this week. That's the hardest thing to remember. 🧡",
      "A walk, a week handled. Not bad at all.",
      "You showed up for yourself this week too. 🧡",
    ];

    const socialMessages = [
      "Sounds like there were some good moments in amongst the busy this week. 🧡",
      "You kept everyone sorted and still made time for the good stuff. 🧡",
      "A busy week with some nice bits in it. Hope tonight's one of them.",
    ];

    const busyMessages = [
      "You've had a busy week! Hope you can find a minute for yourself tonight. 🧡",
      "There's been a lot going on lately. Hope you enjoy your evening!",
      "A lot landed on your plate this week. Hope the weekend gives you a breather.",
    ];

    const activeMessages = [
      "Whatever you want to tackle next week, just say it out loud and Carry's got it. 🧡",
      "The week's wrapping up. Anything still rattling around in your head? Say it out loud.",
      "A full week. Hope there's something good planned for tonight. 🧡",
    ];

    const universalMessages = [
      "Another week rolling in — Carry's got you! 🧡",
      "New week incoming. Say it out loud and Carry's got it.",
      "The week's done. Carry's holding the rest. Enjoy your evening. 🧡",
      "Nothing urgent. Nothing pressing. Just Sunday. 🧡",
      "Carry's got the week ahead. Tonight's yours.",
    ];

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    let message: string;
    if (hasCooking) {
      message = pick(cookingMessages);
    } else if (hasHealth) {
      message = pick(healthMessages);
    } else if (hasSocial) {
      message = pick(socialMessages);
    } else if (isBusy) {
      message = pick(busyMessages);
    } else if (hasLotsAdded) {
      message = pick(activeMessages);
    } else {
      message = pick(universalMessages);
    }

    await LocalNotifications.schedule({
      notifications: [{
        id: SUNDAY_NOTIFICATION_ID,
        title: 'Carry 🧡',
        body: message,
        schedule: { at: nextSunday },
        sound: 'Hello.caf',
      }],
    });
  } catch {
    // fail silently
  }
}
