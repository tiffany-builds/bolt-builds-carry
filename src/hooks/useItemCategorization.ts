import { supabase } from '../lib/supabase';
import { buildSystemPrompt } from '../utils/buildSystemPrompt';

interface CategorizedItem {
  action?: string;
  matchTitle?: string;
  title?: string;
  detail?: string;
  category?: string;
  emoji?: string;
  type?: string;
  date?: string | null;
  time?: string | null;
  hasDateTime?: boolean;
  targetMonth?: number;
  startDate?: string | null;
  endDate?: string | null;
  excitement?: string;
}

export async function categorizeAndCreateItems(text: string, userId: string) {
  try {
    const systemPrompt = buildSystemPrompt({ includeRecurring: false });

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/categorize-items`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          text: text,
          systemPrompt: systemPrompt,
        }),
      }
    );

    const { result, error: fnError } = await response.json();
    if (fnError) throw new Error(fnError);

    const items = JSON.parse(result) as CategorizedItem[];

    if (!items || items.length === 0) {
      return [];
    }

    const validCategories = ['Family', 'Home', 'Health', 'Errands', 'Me', 'Work'];
    const fallbackMap: Record<string, string> = {
      'Ideas': 'Me',
      'Other': 'Errands',
      'Projects': 'Work',
      'Household': 'Home',
      'Kids': 'Family',
      'Shopping': 'Errands',
      'Exercise': 'Me',
      'Personal': 'Me',
      'Finance': 'Work',
    };

    for (const item of items) {
      if (item.category && !validCategories.includes(item.category)) {
        item.category = fallbackMap[item.category] || 'Errands';
      }
    }

    const timeFrameMap: Record<string, string> = {
      'event': 'today',
      'task': 'this_week',
      'reminder': 'this_week',
      'idea': 'future',
      'mind': 'future',
    };

    const createdItems = [];

    for (const item of items) {
      if (item.action === 'update' && item.matchTitle) {
        // Update existing item
        const { data: existingItems } = await supabase
          .from('items')
          .select('*')
          .eq('user_id', userId)
          .eq('completed', false)
          .ilike('title', `%${item.matchTitle}%`)
          .limit(1);

        if (existingItems && existingItems.length > 0) {
          const updateData: any = {};
          if (item.date !== undefined) updateData.date = item.date;
          if (item.time !== undefined) updateData.time = item.time;
          if (item.category !== undefined) updateData.category = item.category;
          if (item.date) updateData.has_date_time = true;

          const { data: updated, error } = await supabase
            .from('items')
            .update(updateData)
            .eq('id', existingItems[0].id)
            .select();

          if (error) {
          } else if (updated) {
            createdItems.push(updated[0]);
          }
        }
      } else {
        // Create new item
        const itemToInsert: any = {
          user_id: userId,
          title: item.title || '',
          description: item.detail || null,
          category: item.category || 'Other',
          emoji: item.emoji || null,
          time_frame: timeFrameMap[item.type || 'task'] || 'future',
          completed: false,
          date: item.type === 'lookforward'
            ? (item.startDate || item.date)
            : (item.date || null),
          time: item.time || null,
          has_date_time: item.type === 'lookforward' ? true : (item.hasDateTime || false),
          type: item.type || 'task',
          target_month: item.targetMonth || null,
        };

        if (item.type === 'lookforward') {
          itemToInsert.start_date = item.startDate || null;
          itemToInsert.end_date = item.endDate || null;
          itemToInsert.excitement = item.excitement || null;
        }

        // Try to save to Supabase
        const { data: inserted, error } = await supabase
          .from('items')
          .insert([itemToInsert])
          .select();

        if (error) {
          // Create local item with temporary ID if Supabase fails
          const localItem = {
            ...itemToInsert,
            id: `temp-${Date.now()}-${Math.random()}`,
            created_at: new Date().toISOString(),
          };
          createdItems.push(localItem);
        } else if (inserted) {
          createdItems.push(inserted[0]);
        }
      }
    }

    return createdItems;
  } catch (err) {
    throw err;
  }
}
