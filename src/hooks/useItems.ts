import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Item {
  id: string;
  title: string;
  description: string | null;
  category: string;
  completed: boolean;
  time_frame: string;
  created_at: string;
  date: string | null;
  time: string | null;
  has_date_time: boolean;
  type: string;
  target_month: number | null;
  start_date?: string | null;
  end_date?: string | null;
  excitement?: string | null;
}

export function useItems(userId: string | null) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  }, [items]);

  const loadItems = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return; // Don't wipe existing items
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Only update if we got data back
      if (data !== null) {
        setItems(data);
      }
    } catch (err) {
      console.log('loadItems error:', err);
      // Don't wipe state on error
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const getItemsByCategory = useCallback((category: string) => {
    return items.filter(item => item.category === category);
  }, [items]);

  const getCategoryCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  const getOnYourMindItems = useCallback(() => {
    return items.filter(item => item.type === 'mind' || item.type === 'idea');
  }, [items]);

  const getLastWeekItemCount = useCallback(async (userId: string) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
      const { data, error } = await supabase
        .from('items')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', oneWeekAgo.toISOString());

      if (error) throw error;
      return data?.length || 0;
    } catch (err) {
      return 0;
    }
  }, []);

  const addItemsToLocalState = useCallback((newItems: Item[]) => {
    setItems(prev => {
      // Remove any temp items and add the new ones at the top
      const withoutTemps = prev.filter(item => !item.id.startsWith('temp-'));
      return [...newItems, ...withoutTemps];
    });
  }, []);

  const removeItemFromState = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  return {
    items,
    isLoading,
    loadItems,
    getItemsByCategory,
    getCategoryCounts,
    getOnYourMindItems,
    getLastWeekItemCount,
    addItemsToLocalState,
    removeItemFromState,
  };
}
