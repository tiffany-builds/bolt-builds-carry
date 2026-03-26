import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserCategory } from '../types';

export function useOnboarding() {
  const createUserProfile = useCallback(
    async (name: string, authUserId: string): Promise<UserProfile> => {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ id: authUserId, name: name, onboarding_complete: false }])
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

  const completeOnboarding = useCallback(async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
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
