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
}

export function useItems(userId: string | null) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error loading items:', err);
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
    return items.filter(item => item.category === 'Ideas');
  }, [items]);

  return {
    items,
    isLoading,
    loadItems,
    getItemsByCategory,
    getCategoryCounts,
    getOnYourMindItems,
  };
}
