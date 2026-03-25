import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ItemInput {
  text: string;
  userCategories: string[];
}

interface CategorizedItem {
  action?: string;
  matchTitle?: string;
  title?: string;
  detail?: string;
  category?: string;
  type?: string;
  date?: string;
  time?: string;
  hasDateTime?: boolean;
  targetMonth?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, userCategories }: ItemInput = await req.json();

    if (!text || !userCategories || userCategories.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: text and userCategories",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
  "type": "event, task, reminder, idea or mind",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "hasDateTime": true or false,
  "targetMonth": 1-12 or null
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    const items: CategorizedItem[] = JSON.parse(content);

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
