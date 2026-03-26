import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserCategory } from '../types';

export function useOnboarding() {
  const createUserProfile = useCallback(
    async (name: string, authUserId: string): Promise<UserProfile> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{ auth_user_id: authUserId, name: name, onboarding_complete: false }])
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
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      return existingProfile;
    },
    []
  );

  const updateUserProfile = useCallback(
    async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    []
  );

  const completeOnboarding = useCallback(async (userId: string) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ onboarding_complete: true })
      .eq('id', userId);

    if (error) throw error;
  }, []);

  return {
    createUserProfile,
    getOrCreateUserProfile,
    updateUserProfile,
    completeOnboarding,
  };
}
