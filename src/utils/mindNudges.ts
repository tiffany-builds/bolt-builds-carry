export interface MindItem {
  id: string;
  title: string;
  detail?: string | null;
  category: string;
  type?: string;
  targetMonth?: number;
  date?: string | null;
  created_at?: string;
}

export interface MindItemWithNudge extends MindItem {
  nudgeMessage: string | null;
}

function getMonthName(monthNum: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNum - 1];
}

export function getNudgeMessage(item: MindItem): string | null {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;

  // Calculate days since created
  let daysSinceCreated = 0;
  if (item.created_at) {
    daysSinceCreated = Math.floor(
      (today.getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Nudge 1 — date or month is approaching
  if (item.targetMonth) {
    const monthsAway = item.targetMonth - currentMonth;
    if (monthsAway <= 1 && monthsAway >= 0) {
      return `This is coming up soon — worth thinking about now.`;
    }
    if (monthsAway === 2) {
      return `${getMonthName(item.targetMonth)} is just around the corner.`;
    }
  }

  if (item.date) {
    const daysUntil = Math.floor(
      (new Date(item.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil <= 14 && daysUntil >= 0) {
      return `This is coming up in ${daysUntil} days — want to sort it?`;
    }
  }

  // Nudge 2 — 5 days have passed since it was added
  if (daysSinceCreated >= 5) {
    return `Still on your mind? You added this ${daysSinceCreated} days ago.`;
  }

  return null;
}

export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    Kids: '🧒',
    Household: '🏠',
    Errands: '🛍',
    Me: '🏃‍♀️',
    Ideas: '✨',
    Work: '💼',
    Projects: '📋',
    Other: '📌'
  };
  return emojis[category] || '📌';
}

export function addNudgesToMindItems(items: MindItem[]): MindItemWithNudge[] {
  return items.map(item => ({
    ...item,
    nudgeMessage: getNudgeMessage(item)
  }));
}
