export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  category: 'Kids' | 'Health' | 'Family' | 'Errands' | 'Me' | 'Ideas';
  completed?: boolean;
}

export interface Box {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

export interface Nudge {
  id: string;
  icon: string;
  title: string;
  suggestion: string;
}

export type Category = 'Kids' | 'Health' | 'Family' | 'Errands' | 'Me' | 'Ideas' | 'Household' | 'Shopping';
