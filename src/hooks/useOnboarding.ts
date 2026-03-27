import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useOnboarding() {
  const getLastWeekItemCount = useCallback(async (userId: string) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    try {
      const { data } = await supabase
        .from('items')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', oneWeekAgo.toISOString());
      return data?.length || 0;
    } catch {
      return 0;
    }
  }, []);

  return { getLastWeekItemCount };
}
