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
      console.log("1. categorizeAndCreateItems called with:", { text, userId, userCategories });

      try {
        console.log("2. Calling Claude API...");
        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are Carry, a personal assistant for parents. Extract all items from the input and return ONLY a valid JSON array. Each item must have: title (max 6 words), category (one of: Kids, Household, Errands, Me, Ideas, Work, Projects, Other), type (event, task, reminder or idea). Return valid JSON only — no explanation, no markdown, no code blocks.",
          messages: [{ role: "user", content: text }]
        });

        const responseText = message.content[0].text;
        console.log("3. Raw API response:", responseText);

        const items = JSON.parse(responseText) as CategorizedItem[];
        console.log("4. Parsed items:", items);

        if (!items || items.length === 0) {
          console.log("5. No items returned from API");
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
        console.log("6. Items prepared for database:", itemsToInsert);

        const { data: createdItems, error } = await supabase
          .from('items')
          .insert(itemsToInsert)
          .select();

        if (error) {
          console.error('7. ERROR - Supabase insert error:', error);
          throw new Error('Something didn\'t save — tap to retry');
        }

        console.log("8. Items successfully saved to database:", createdItems);
        return createdItems;
      } catch (err) {
        console.error('ERROR at some step:', err);
        throw err;
      }
    },
    []
  );

  return {
    categorizeAndCreateItems,
  };
}
