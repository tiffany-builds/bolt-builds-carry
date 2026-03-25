import { supabase } from '../lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

interface CategorizedItem {
  action?: string;
  matchTitle?: string;
  title?: string;
  detail?: string;
  category?: string;
  type?: string;
  date?: string | null;
  time?: string | null;
  hasDateTime?: boolean;
  targetMonth?: number;
  startDate?: string | null;
  endDate?: string | null;
  excitement?: string;
}

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function categorizeAndCreateItems(text: string, userId: string, userCategories: string[]) {
  console.log("1. categorizeAndCreateItems called with:", { text, userId, userCategories });

  try {
    console.log("2. Calling Claude API...");
    const today = new Date();
    const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${date}`;

    const systemPrompt = `You are Carry, a personal assistant for parents.
Today is ${dayName} ${dateStr}.
When the user says "Saturday" they mean the next upcoming Saturday from today.
Always calculate dates going FORWARD from today — never backwards.

IMPORTANT: Detect if the user wants to UPDATE an existing item vs CREATE a new one.

If the user is moving, rescheduling or updating an existing item (e.g., "move the dentist to Thursday", "change football to 4pm", "reschedule the doctor to next week"), return this structure:

{
  "action": "update",
  "matchTitle": "dentist",
  "date": "2026-03-27",
  "time": "16:00",
  "category": "Health"
}

If creating a NEW item, return this structure:

{
  "action": "create",
  "title": "max 6 words",
  "detail": "one warm conversational sentence",
  "category": "one of: Kids, Household, Errands, Me, Health, Ideas, Work, Projects, Other",
  "type": "event, task, reminder, idea, mind or lookforward",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "hasDateTime": true or false,
  "targetMonth": 1-12 or null
}

Use type "lookforward" for:
- Any trip, travel, holiday or weekend away
- Concerts, shows, events the user is attending
- Reunions, celebrations, things with friends or family
- Anything the user mentions with excitement or anticipation
- Multi-day events like "April 28 to May 2"
- Any item more than 2 weeks away that sounds positive and exciting

For lookforward items also include:
- startDate: ISO format YYYY-MM-DD for start of event
- endDate: ISO format YYYY-MM-DD if multi-day, otherwise same as startDate
- targetMonth: month number 1-12
- hasDateTime: true
- excitement: a short warm one-line description of why this is worth looking forward to

Example:
Input: "I have a trip with Sarah from April 28 to May 2"
Output:
{
  "action": "create",
  "title": "Trip with Sarah",
  "detail": "A few days away with a good friend.",
  "category": "Me",
  "type": "lookforward",
  "startDate": "2026-04-28",
  "endDate": "2026-05-02",
  "targetMonth": 4,
  "hasDateTime": true,
  "excitement": "Something just for you — a proper break with a friend."
}

Categories:
- Health: doctor, dentist, hospital, medication, physio, therapy, optician, mental health, medical appointments, prescriptions, anything health or body related
- Me: personal time, self care, exercise, hobbies, things just for the user
- Errands: shopping, returns, post office, admin tasks, errands outside the home
- Kids: child activities, school, childcare
- Household: home maintenance, chores, cleaning
- Work: work tasks, meetings, projects
- Ideas: future plans, wishes, dreams
- Projects: DIY, home projects
- Other: miscellaneous

Use type "mind" for longer term plans, wishes, future intentions or anything with a vague or approximate timeframe.

If no action field is present assume "create".

Return valid JSON array only — no explanation, no markdown, no code blocks.`;

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
            console.error('Error updating item:', error);
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
          time_frame: timeFrameMap[item.type || 'task'] || 'future',
          completed: false,
          date: item.type === 'lookforward' ? item.startDate : item.date || null,
          time: item.time || null,
          has_date_time: item.hasDateTime || false,
          type: item.type || 'task',
          target_month: item.targetMonth || null,
        };

        if (item.type === 'lookforward') {
          itemToInsert.start_date = item.startDate || null;
          itemToInsert.end_date = item.endDate || null;
          itemToInsert.excitement = item.excitement || null;
        }

        const { data: inserted, error } = await supabase
          .from('items')
          .insert([itemToInsert])
          .select();

        if (error) {
          console.error('Error inserting item:', error);
        } else if (inserted) {
          createdItems.push(inserted[0]);
        }
      }
    }

    console.log("8. Items successfully processed:", createdItems);

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
