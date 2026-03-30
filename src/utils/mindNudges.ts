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
    Family: '🫶',
    Household: '🏠',
    Errands: '🛒',
    Me: '🏃‍♀️',
    Health: '❤️',
    Ideas: '✨',
    Work: '💼',
    Projects: '📋',
    Other: '📌'
  };
  return emojis[category] || '📌';
}

export function getContextualEmoji(title: string, category: string): string {
  const t = title.toLowerCase();

  // Food & cooking
  if (t.includes('chicken') || t.includes('roast')) return '🍗';
  if (t.includes('dinner') || t.includes('supper')) return '🍽️';
  if (t.includes('lunch')) return '🥗';
  if (t.includes('breakfast')) return '🥞';
  if (t.includes('cook') || t.includes('bake') || t.includes('recipe')) return '👩‍🍳';
  if (t.includes('pizza')) return '🍕';
  if (t.includes('cake') || t.includes('lemon square') || t.includes('biscuit') || t.includes('cookie')) return '🍋';
  if (t.includes('grocery') || t.includes('groceries') || t.includes('supermarket')) return '🛒';
  if (t.includes('coffee')) return '☕';

  // Health & medical
  if (t.includes('doctor') || t.includes('gp') || t.includes('physician')) return '👨‍⚕️';
  if (t.includes('dentist') || t.includes('dental') || t.includes('teeth')) return '🦷';
  if (t.includes('hospital')) return '🏥';
  if (t.includes('medicine') || t.includes('medication') || t.includes('pharmacy') || t.includes('chemist')) return '💊';
  if (t.includes('appointment')) return '📋';
  if (t.includes('optician') || t.includes('glasses') || t.includes('eye')) return '👓';
  if (t.includes('physio') || t.includes('therapy')) return '🩺';

  // School & kids
  if (t.includes('school') || t.includes('drop off') || t.includes('pickup') || t.includes('pick up')) return '🏫';
  if (t.includes('homework') || t.includes('study')) return '📚';
  if (t.includes('teacher') || t.includes('parent evening')) return '👩‍🏫';
  if (t.includes('uniform') || t.includes('kit')) return '👕';
  if (t.includes('lunch box') || t.includes('lunchbox')) return '🥪';
  if (t.includes('nursery') || t.includes('daycare') || t.includes('childcare')) return '🧸';

  // Sports & activities
  if (t.includes('football') || t.includes('soccer')) return '⚽';
  if (t.includes('swimming') || t.includes('swim')) return '🏊';
  if (t.includes('tennis')) return '🎾';
  if (t.includes('rugby')) return '🏉';
  if (t.includes('basketball')) return '🏀';
  if (t.includes('hockey')) return '🏒';
  if (t.includes('cricket')) return '🏏';
  if (t.includes('gym') || t.includes('workout') || t.includes('exercise') || t.includes('run') || t.includes('running')) return '🏃';
  if (t.includes('yoga') || t.includes('pilates')) return '🧘';
  if (t.includes('cycling') || t.includes('bike')) return '🚴';
  if (t.includes('dance') || t.includes('ballet')) return '💃';
  if (t.includes('music') || t.includes('piano') || t.includes('guitar') || t.includes('violin')) return '🎵';
  if (t.includes('art') || t.includes('painting') || t.includes('drawing')) return '🎨';

  // Travel & transport
  if (t.includes('flight') || t.includes('fly') || t.includes('airport') || t.includes('plane')) return '✈️';
  if (t.includes('holiday') || t.includes('vacation') || t.includes('trip')) return '🏖️';
  if (t.includes('hotel') || t.includes('airbnb')) return '🏨';
  if (t.includes('car') || t.includes('drive') || t.includes('driving')) return '🚗';
  if (t.includes('train') || t.includes('rail')) return '🚂';
  if (t.includes('passport') || t.includes('visa')) return '🛂';
  if (t.includes('paris') || t.includes('france')) return '🇫🇷';
  if (t.includes('vancouver') || t.includes('canada')) return '🇨🇦';
  if (t.includes('portugal')) return '🇵🇹';

  // Home & household
  if (t.includes('clean') || t.includes('hoover') || t.includes('vacuum') || t.includes('tidy')) return '🧹';
  if (t.includes('laundry') || t.includes('washing') || t.includes('clothes')) return '🧺';
  if (t.includes('repair') || t.includes('fix') || t.includes('broken')) return '🔧';
  if (t.includes('garden') || t.includes('plants') || t.includes('lawn')) return '🌱';
  if (t.includes('plumber') || t.includes('electrician') || t.includes('builder')) return '👷';
  if (t.includes('insurance') || t.includes('claim')) return '📄';
  if (t.includes('bills') || t.includes('payment') || t.includes('pay')) return '💳';
  if (t.includes('amazon') || t.includes('return') || t.includes('parcel') || t.includes('delivery')) return '📦';
  if (t.includes('recycle') || t.includes('bins') || t.includes('rubbish') || t.includes('trash')) return '♻️';

  // Shopping & errands
  if (t.includes('birthday') || t.includes('gift') || t.includes('present')) return '🎁';
  if (t.includes('party') || t.includes('celebration')) return '🎉';
  if (t.includes('flowers') || t.includes('florist')) return '💐';
  if (t.includes('clothes') || t.includes('shopping') || t.includes('outfit')) return '🛍️';
  if (t.includes('book') || t.includes('library')) return '📖';
  if (t.includes('post') || t.includes('letter') || t.includes('mail')) return '📬';
  if (t.includes('bank') || t.includes('money') || t.includes('finance')) return '🏦';
  if (t.includes('phone') || t.includes('call') || t.includes('ring')) return '📞';
  if (t.includes('email') || t.includes('message') || t.includes('text')) return '📧';
  if (t.includes('dry cleaning') || t.includes('dry clean')) return '👔';
  if (t.includes('fishing') || t.includes('fish')) return '🎣';
  if (t.includes('vest') || t.includes('jacket') || t.includes('coat')) return '🧥';

  // People & social
  if (t.includes('friend') || t.includes('playdate')) return '👫';
  if (t.includes('family')) return '👨‍👩‍👧';
  if (t.includes('babysitter') || t.includes('nanny') || t.includes('childminder')) return '👶';
  if (t.includes('wedding') || t.includes('anniversary')) return '💍';
  if (t.includes('funeral') || t.includes('condolence')) return '🕊️';

  // Work & projects
  if (t.includes('meeting') || t.includes('call') || t.includes('zoom') || t.includes('teams')) return '💼';
  if (t.includes('deadline') || t.includes('project') || t.includes('report')) return '📊';
  if (t.includes('interview') || t.includes('job')) return '🤝';
  if (t.includes('conference') || t.includes('convention') || t.includes('summit')) return '🎤';
  if (t.includes('mining')) return '⛏️';

  // Pets
  if (t.includes('dog') || t.includes('walk') || t.includes('vet') || t.includes('pet')) return '🐾';
  if (t.includes('cat')) return '🐱';

  // Category fallbacks — only if no title match found
  const categoryEmojis: Record<string, string> = {
    Family: '🫶',
    Household: '🏠',
    Errands: '🛒',
    Me: '🏃‍♀️',
    Health: '❤️',
    Ideas: '✨',
    Work: '💼',
    Projects: '📋',
    Shopping: '🛒',
    Other: '📌'
  };

  return categoryEmojis[category] || '📌';
}

export function addNudgesToMindItems(items: MindItem[]): MindItemWithNudge[] {
  return items.map(item => ({
    ...item,
    nudgeMessage: getNudgeMessage(item)
  }));
}
