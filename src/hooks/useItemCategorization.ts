import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface CategorizedItem {
  title: string;
  detail: string;
  category: string;
  type: string;
  date?: string;
  time?: string;
}

export function useItemCategorization() {
  const categorizeAndCreateItems = useCallback(
    async (text: string, userId: string, userCategories: string[]) => {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/categorize-items`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text,
          userCategories,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to categorize items');
      }

      const data = await response.json();
      const items = data.items as CategorizedItem[];

      const timeFrameMap: Record<string, string> = {
        'event': 'today',
        'task': 'this_week',
        'reminder': 'this_week',
        'idea': 'future',
      };

      const itemsToInsert = items.map((item) => ({
        user_id: userId,
        title: item.title,
        description: item.detail || null,
        category: item.category,
        time_frame: timeFrameMap[item.type] || 'future',
        completed: false,
      }));

      const { data: createdItems, error } = await supabase
        .from('items')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;
      return createdItems;
    },
    []
  );

  return {
    categorizeAndCreateItems,
  };
}
