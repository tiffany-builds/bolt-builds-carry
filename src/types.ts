export interface TimelineItem {
  id: string;
  time: string | null;
  title: string;
  subtitle: string;
  category: string;
  completed?: boolean;
  date?: string | null;
  detail?: string | null;
  type?: string;
  hasDateTime?: boolean;
  targetMonth?: number;
  created_at?: string;
  start_date?: string | null;
  end_date?: string | null;
  excitement?: string | null;
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
  family_members?: string[];
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
