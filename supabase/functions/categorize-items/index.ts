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
  startDate?: string;
  endDate?: string;
  excitement?: string;
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

    const today = new Date()
    const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' })
    const dateStr = today.toISOString().split('T')[0]

    const systemPrompt = `You are Carry, a personal assistant for parents.
Today is ${dayName} ${dateStr}.

Extract all items from the input and return ONLY a valid JSON array.

Each item must have:
- title: max 6 words
- detail: one warm conversational sentence
- category: one of: Kids, Household, Errands, Me, Health, Ideas, Work, Projects, Other
- type: event, task, reminder, idea, mind or lookforward

Use type "mind" for longer term plans, wishes or vague future intentions.
Use type "lookforward" for trips, travel, holidays, concerts, reunions or anything the user is excited about and anticipating.
Use category "Health" for: doctor, dentist, hospital, medication, physio, therapy, optician, anything health or body related.

For lookforward items also include:
- startDate: ISO format YYYY-MM-DD
- endDate: ISO format YYYY-MM-DD if multi-day, otherwise same as startDate
- targetMonth: month number 1-12
- hasDateTime: true
- excitement: a short warm one-line description of why this is worth looking forward to

If ANY date or time is mentioned include:
- date: ISO format YYYY-MM-DD. Today is ${dateStr}. Calculate actual dates from relative terms like "tomorrow", "Tuesday", "next week". Always go FORWARD from today, never backwards.
- time: 24hr format HH:MM if a time was mentioned, otherwise null
- hasDateTime: true
- targetMonth: month number 1-12 if a month is mentioned but no specific date

If no date or time mentioned:
- hasDateTime: false
- date: null
- time: null
- targetMonth: null

Return valid JSON only — no explanation, no markdown, no code blocks.`;

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
