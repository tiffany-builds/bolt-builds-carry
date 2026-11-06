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

const MORNING_HOUR = 7;

// TESTING ONLY: set to a number of minutes (e.g. 1) and the briefing covers TODAY
// and fires that many minutes from now. MUST be null for release.
const TEST_FIRE_IN_MINUTES: number | null = null;

const pad2 = (n: number) => String(n).padStart(2, '0');
const localDateStr = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const LIGHT_TITLES = ['Good morning', 'Rise and shine', 'Morning', 'Here we go'];
const BUSY_TITLES = ['Another full day', "You've got this", 'Big day ahead', "Let's do this"];

export async function scheduleMorningBriefing(
  items: Array<{
    date: string | null;
    has_date_time: boolean;
    title: string;
    time?: string | null;
    completed?: boolean;
  }>
): Promise<void> {
  try {
    const now = new Date();
    const target = new Date();
    let fireAt: Date;

    if (TEST_FIRE_IN_MINUTES !== null) {
      fireAt = new Date(now.getTime() + TEST_FIRE_IN_MINUTES * 60 * 1000);
    } else {
      target.setHours(MORNING_HOUR, 0, 0, 0);
      // Before 7am the briefing is for today, otherwise for tomorrow
      if (now >= target) target.setDate(target.getDate() + 1);
      fireAt = new Date(target);
    }

    const targetStr = localDateStr(target);

    await LocalNotifications.cancel({ notifications: [{ id: MORNING_BRIEFING_ID }] });

    const day = items.filter(i => i.date === targetStr && !i.completed);
    const n = day.length;
    if (n === 0) return;

    const timed = day
      .filter(i => i.has_date_time && i.time)
      .sort((a, b) => String(a.time).localeCompare(String(b.time)));
    const untimed = day.filter(i => !(i.has_date_time && i.time));
    const ordered = [...timed, ...untimed];

    const describe = (i: { title: string }) => i.title.trim().replace(/[.!?…]+$/, '');
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    let title: string;
    if (n >= 4) title = pick(BUSY_TITLES);
    else if (n === 3) title = pick([...LIGHT_TITLES, "You've got this"]);
    else title = pick(LIGHT_TITLES);

    let body: string;
    if (n === 1) {
      body = `Just one thing today: ${describe(ordered[0])}.`;
    } else if (n <= 3) {
      body = `${n} things today. ${ordered.map(i => `${describe(i)}.`).join(' ')}`;
    } else {
      const lead = ordered.slice(0, 3).map(i => `${describe(i)}.`).join(' ');
      const more = n - 3;
      body = `${n} things today. ${lead} Plus ${more} more.`;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: MORNING_BRIEFING_ID,
          title,
          body,
          schedule: { at: fireAt },
          sound: 'Hello.caf',
        },
      ],
    });
  } catch {
    // Notifications unavailable (e.g. web/browser), fail silently
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

export async function scheduleRecurringExpiryReminders(
  items: Array<{
    id: string;
    title: string;
    emoji: string | null;
    date: string | null;
    recurring: boolean;
    recurring_parent_id: string | null;
  }>
): Promise<void> {
  try {
    const EXPIRY_ID_START = 3000;
    const EXPIRY_ID_END = 3099;

    // Cancel existing expiry notifications
    const existingIds = Array.from(
      { length: EXPIRY_ID_END - EXPIRY_ID_START + 1 },
      (_, i) => ({ id: EXPIRY_ID_START + i })
    );
    await LocalNotifications.cancel({ notifications: existingIds });

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Find recurring parent items
    const recurringParents = items.filter(i => i.recurring && !i.recurring_parent_id);

    // For each recurring parent, find its latest instance
    const toSchedule = [];
    let notifIndex = 0;

    for (const parent of recurringParents) {
      // Find all instances of this parent
      const instances = items.filter(i =>
        i.recurring_parent_id === parent.id &&
        i.date &&
        i.date >= todayStr
      );

      if (instances.length === 0) continue;

      // Find the last instance date
      const sortedDates = instances.map(i => i.date!).sort();
      const lastDate = sortedDates[sortedDates.length - 1];

      // Calculate 2 days before last instance
      const lastDateObj = new Date(lastDate + 'T00:00:00');
      const notifyDate = new Date(lastDateObj);
      notifyDate.setDate(notifyDate.getDate() - 2);
      notifyDate.setHours(21, 0, 0, 0); // 9pm

      if (notifyDate <= new Date()) continue;
      if (notifIndex >= 100) break;

      const emoji = parent.emoji || '';
      const title = `${emoji} ${parent.title}`.trim();

      toSchedule.push({
        id: EXPIRY_ID_START + notifIndex,
        title: 'Carry 🩷',
        body: `Your "${title}" reminder is nearly up. Want to keep it going?`,
        schedule: { at: notifyDate },
        sound: 'Hello.caf',
      });

      notifIndex++;
    }

    if (toSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: toSchedule });
    }
  } catch {
    // fail silently
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
    nextSunday.setHours(21, 0, 0, 0);

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
      "You had a busy week and still made time to cook. Nice one. 🩷",
      "Meals made, week handled. Not bad at all.",
      "Somehow you fed everyone and kept everything else moving too. 🩷",
    ];

    const healthMessages = [
      "You made time for yourself this week. That's the hardest thing to remember. 🩷",
      "A walk, a week handled. Not bad at all.",
      "You showed up for yourself this week too. 🩷",
    ];

    const socialMessages = [
      "Sounds like there were some good moments in amongst the busy this week. 🩷",
      "You kept everyone sorted and still made time for the good stuff. 🩷",
      "A busy week with some nice bits in it. Hope tonight's one of them.",
    ];

    const busyMessages = [
      "You've had a busy week! Hope you can find a minute for yourself tonight. 🩷",
      "There's been a lot going on lately. Hope you enjoy your evening!",
      "A lot landed on your plate this week. Hope the weekend gives you a breather.",
    ];

    const activeMessages = [
      "Whatever you want to tackle next week, just say it out loud and Carry's got it. 🩷",
      "The week's wrapping up. Anything still rattling around in your head? Say it out loud.",
      "A full week. Hope there's something good planned for tonight. 🩷",
    ];

    const universalMessages = [
      "Another week rolling in — Carry's got you! 🩷",
      "New week incoming. Say it out loud and Carry's got it.",
      "The week's done. Carry's holding the rest. Enjoy your evening. 🩷",
      "Nothing urgent. Nothing pressing. Just Sunday. 🩷",
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
        title: 'Carry 🩷',
        body: message,
        schedule: { at: nextSunday },
        sound: 'Hello.caf',
      }],
    });
  } catch {
    // fail silently
  }
}

export async function scheduleWednesdayNotification(
  items: Array<{ created_at: string }>
): Promise<void> {
  try {
    const WEDNESDAY_ID = 1003;
    await LocalNotifications.cancel({ notifications: [{ id: WEDNESDAY_ID }] });

    // Only nudge people who already use Carry
    if (items.length === 0) return;

    const FIRE_HOUR = 12;
    const FIRE_MINUTE = 30;

    const now = new Date();
    const fireAt = new Date();
    fireAt.setHours(FIRE_HOUR, FIRE_MINUTE, 0, 0);

    // Next Wednesday. Today counts if the time has not passed yet.
    const daysUntil = (3 - now.getDay() + 7) % 7;
    fireAt.setDate(fireAt.getDate() + daysUntil);
    if (fireAt <= now) fireAt.setDate(fireAt.getDate() + 7);

    // If it is Wednesday and they have already added something today, skip to next week
    if (fireAt.toDateString() === now.toDateString()) {
      const addedToday = items.some(
        i => i.created_at && new Date(i.created_at).toDateString() === now.toDateString()
      );
      if (addedToday) fireAt.setDate(fireAt.getDate() + 7);
    }

    const messages = [
      "Midweek already. Anything building up in your head? A good moment to get it out. 🩷",
      "Halfway there. A great time to clear your head of anything rattling around. 🩷",
      "Wednesday check-in. How's your mental load feeling this week?",
      "The week's half done. Anything still sitting in your head that needs a home? 🩷",
      "Mid-point of the week. A good moment to get things out before they pile up. 🩷",
      "Wednesday. A good moment to take stock. Anything on your mind? 🩷",
    ];

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    await LocalNotifications.schedule({
      notifications: [{
        id: WEDNESDAY_ID,
        title: 'Carry 🩷',
        body: pick(messages),
        schedule: { at: fireAt },
        sound: 'Hello.caf',
      }]
    });
  } catch {
    // fail silently
  }
}
