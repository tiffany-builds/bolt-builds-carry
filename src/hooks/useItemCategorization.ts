import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

interface CategorizedItem {
  title: string;
  detail: string;
  category: string;
  type: string;
  date?: string;
  time?: string;
}

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

export function useItemCategorization() {
  const categorizeAndCreateItems = useCallback(
    async (text: string, userId: string, userCategories: string[]) => {
      try {
        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are Carry, a personal assistant for parents. Extract all items from the input and return ONLY a valid JSON array. Each item must have: title (max 6 words), category (one of: Kids, Household, Errands, Me, Ideas, Work, Projects, Other), type (event, task, reminder or idea). Return valid JSON only — no explanation, no markdown, no code blocks.",
          messages: [{ role: "user", content: text }]
        });

        const responseText = message.content[0].text;
        const items = JSON.parse(responseText) as CategorizedItem[];

        if (!items || items.length === 0) {
          return [];
        }

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

        if (error) {
          console.error('Supabase insert error:', error);
          throw new Error('Something didn\'t save — tap to retry');
        }

        return createdItems;
      } catch (err) {
        console.error('Categorization error:', err);
        throw err;
      }
    },
    []
  );

  return {
    categorizeAndCreateItems,
  };
}
