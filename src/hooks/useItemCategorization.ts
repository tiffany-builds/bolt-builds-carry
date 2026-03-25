import { supabase } from '../lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

interface CategorizedItem {
  title: string;
  detail: string;
  category: string;
  type: string;
  date?: string | null;
  time?: string | null;
  hasDateTime?: boolean;
}

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function categorizeAndCreateItems(text: string, userId: string, userCategories: string[]) {
  console.log("1. categorizeAndCreateItems called with:", { text, userId, userCategories });

  try {
    console.log("2. Calling Claude API...");
    const todayStr = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are Carry, a personal assistant for parents.
Extract all items from the input and return ONLY a valid JSON array.

Each item must have:
- title: max 6 words
- category: one of: Kids, Household, Errands, Me, Ideas, Work, Projects, Other
- type: event, task, reminder or idea

If ANY date or time is mentioned — even relative ones like "tomorrow", "Tuesday", "next week", "Friday at 3" — include these additional fields:
- date: ISO format YYYY-MM-DD. Today is ${todayStr}. Calculate actual dates from relative terms like "tomorrow" or "Tuesday"
- time: 24hr format HH:MM if a time was mentioned, otherwise null
- hasDateTime: true

If no date or time is mentioned:
- hasDateTime: false
- date: null
- time: null

Return valid JSON only — no explanation, no markdown, no code blocks.

Example input: "Frankie has football Tuesday at 4 and I need to call the dentist"
Example output:
[
  {"title": "Frankie football practice", "category": "Kids", "type": "event", "date": "2026-03-31", "time": "16:00", "hasDateTime": true},
  {"title": "Call the dentist", "category": "Errands", "type": "task", "hasDateTime": false, "date": null, "time": null}
]`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
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
      date: item.date || null,
      time: item.time || null,
      has_date_time: item.hasDateTime || false,
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

    const { data: verifyData, error: verifyError } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false });

    console.log("8a. VERIFICATION - Query all incomplete items for this user:");
    console.log("8b. VERIFICATION - Found", verifyData?.length || 0, "items in database");
    console.log("8c. VERIFICATION - Full query result:", JSON.stringify(verifyData, null, 2));

    return createdItems;
  } catch (err) {
    console.error('ERROR at some step:', err);
    throw err;
  }
}
