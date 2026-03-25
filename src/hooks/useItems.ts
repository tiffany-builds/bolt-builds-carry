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
}

export function useItems(userId: string | null) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("33. useItems - items state changed. New count:", items.length);
    console.log("34. useItems - items state value:", items);
  }, [items]);

  const loadItems = useCallback(async () => {
    console.log("17. loadItems called for userId:", userId);
    console.log("17a. Time at loadItems start:", new Date().toISOString());

    if (!userId) {
      console.log("18. No userId - skipping load");
      setIsLoading(false);
      return;
    }

    try {
      console.log("19. Fetching items from database...");
      console.log("19a. Query filters: user_id =", userId, ", completed = false");
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      console.log("19b. Time after database query:", new Date().toISOString());

      if (error) {
        console.error("20. ERROR loading items:", error);
        throw error;
      }

      console.log("21. Items fetched from database:", data);
      console.log("21a. Raw database result count:", data?.length || 0);
      console.log("21b. Full database items:", JSON.stringify(data, null, 2));
      setItems(data || []);
      console.log("22. State updated with items. New count:", data?.length || 0);
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
      console.error('Error getting last week count:', err);
      return 0;
    }
  }, []);

  return {
    items,
    isLoading,
    loadItems,
    getItemsByCategory,
    getCategoryCounts,
    getOnYourMindItems,
    getLastWeekItemCount,
  };
}
