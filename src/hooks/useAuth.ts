import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const userId = user?.id;
      await supabase.auth.signOut();

      // Clear all user-specific localStorage
      if (userId) {
        localStorage.removeItem(`carry_onboarded_${userId}`);
        localStorage.removeItem(`carry_name_${userId}`);
      }
      localStorage.removeItem('carryUserProfile');

      setUser(null);
    } catch (err) {
    }
  };

  const resetOnboarding = async () => {
    try {
      const userId = user?.id;
      if (!userId) return;

      // Update database to mark onboarding as incomplete
      await supabase
        .from('profiles')
        .update({ onboarding_complete: false })
        .eq('id', userId);

      // Clear all user-specific localStorage
      localStorage.removeItem(`carry_onboarded_${userId}`);
      localStorage.removeItem(`carry_name_${userId}`);
      localStorage.removeItem('carryUserProfile');

      // Reload the page to restart onboarding
      window.location.reload();
    } catch (err) {
      console.error('Error resetting onboarding:', err);
    }
  };

  return {
    user,
    isLoading,
    signOut,
    resetOnboarding,
  };
}
