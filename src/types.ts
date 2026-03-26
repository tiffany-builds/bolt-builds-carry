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
  auth_user_id?: string;
  onboarding_complete: boolean;
  family_members?: string[];
  created_at: string;
  updated_at?: string;
  birthday_day?: number;
  birthday_month?: number;
  household?: string[];
  has_children?: boolean;
  children?: Array<{ name: string; age: number }>;
  week_structure?: string;
  day_start_time?: string;
  priority_areas?: string[];
  nudge_preference?: string;
}

export interface UserCategory {
  id?: string;
  user_id?: string;
  name: string;
  emoji: string;
  order?: number;
  order_index?: number;
  color?: string;
  created_at?: string;
}

export interface CategoryOption {
  name: string;
  emoji: string;
  description?: string;
}
