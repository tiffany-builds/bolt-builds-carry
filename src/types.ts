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

export interface UserProfile {
  id: string;
  name: string;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCategory {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  order: number;
  created_at: string;
}

export interface CategoryOption {
  name: string;
  emoji: string;
  description?: string;
}
