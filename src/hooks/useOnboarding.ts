import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserCategory } from '../types';

export function useOnboarding() {
  const createUserProfile = useCallback(
    async (name: string): Promise<UserProfile> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{ name, has_completed_onboarding: false }])
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    []
  );

  const addUserCategories = useCallback(
    async (userId: string, categoryNames: string[]): Promise<UserCategory[]> => {
      const categories = categoryNames.map((name, index) => {
        const categoryOption = categoryNames.find((c) => c === name);
        const emojiMap: Record<string, string> = {
          Household: '🏠',
          Kids: '🧒',
          Family: '👨‍👩‍👧‍👦',
          Work: '💼',
          Ideas: '✈️',
          Errands: '🛍',
          Me: '🏃‍♀️',
          Projects: '🛠',
          Other: '📌',
        };

        return {
          user_id: userId,
          name: name,
          emoji: emojiMap[name] || '📌',
          order: index,
        };
      });

      const { data, error } = await supabase
        .from('user_categories')
        .insert(categories)
        .select();

      if (error) throw error;
      return data;
    },
    []
  );

  const completeOnboarding = useCallback(async (userId: string) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ has_completed_onboarding: true })
      .eq('id', userId);

    if (error) throw error;
  }, []);

  return {
    createUserProfile,
    addUserCategories,
    completeOnboarding,
  };
}
