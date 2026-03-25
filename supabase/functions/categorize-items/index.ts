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
  title: string;
  detail: string;
  category: string;
  type: string;
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

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are Carry, a personal assistant for parents.
Extract all items from the input and return ONLY a valid JSON array.

Each item must have:
- title: max 6 words
- detail: one warm conversational sentence describing the item
- category: one of: Kids, Household, Errands, Me, Ideas, Work, Projects, Other
- type: event, task, reminder, idea or mind

Use type "mind" for longer term plans, wishes, future intentions or anything with a vague or approximate timeframe. Examples: "book swimming lessons in May", "think about a holiday", "look into piano lessons".

Use type "event" or "reminder" for things with a specific date or time.

If ANY date or time is mentioned include:
- date: ISO format YYYY-MM-DD. Today is ${today}. Calculate actual dates from relative terms.
- time: 24hr format HH:MM if a time was mentioned, otherwise null
- hasDateTime: true
- targetMonth: month number 1-12 if a month is mentioned but no specific date, otherwise null

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
