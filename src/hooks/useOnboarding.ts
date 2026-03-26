import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserCategory } from '../types';

export function useOnboarding() {
  const createUserProfile = useCallback(
    async (name: string, authUserId: string): Promise<UserProfile> => {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ id: authUserId, first_name: name, onboarding_complete: false }])
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    []
  );

  const getOrCreateUserProfile = useCallback(
    async (authUserId: string): Promise<UserProfile | null> => {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      return existingProfile;
    },
    []
  );

  const updateUserProfile = useCallback(
    async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
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
      .from('profiles')
      .update({ onboarding_complete: true })
      .eq('id', userId);

    if (error) throw error;
  }, []);

  const getUserCategories = useCallback(async (userId: string): Promise<UserCategory[]> => {
    const { data, error } = await supabase
      .from('user_categories')
      .select('*')
      .eq('user_id', userId)
      .order('order', { ascending: true });

    if (error) throw error;
    return data || [];
  }, []);

  return {
    createUserProfile,
    getOrCreateUserProfile,
    updateUserProfile,
    addUserCategories,
    completeOnboarding,
    getUserCategories,
  };
}
