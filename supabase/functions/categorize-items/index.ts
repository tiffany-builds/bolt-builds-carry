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
  description?: string;
  category: string;
  timeFrame: string;
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

    const prompt = `You are an intelligent assistant that helps organize what's on a person's mind into actionable items and categorizes them.

The user has provided this text about what's on their mind:
"${text}"

The user has these available categories: ${userCategories.join(", ")}

Your task is to:
1. Extract 1-5 distinct items/tasks from what they said
2. For each item, determine:
   - A clear, concise title (5-10 words max)
   - An optional description (if it provides helpful context)
   - Which category it fits best into (must be one of the available categories)
   - The time frame: "today", "this_week", "this_month", or "future"

IMPORTANT: Always pick the most specific and relevant category from their available categories.

Examples of categorization:
- "Make lasagna for dinner" -> Household
- "Drop kids at school" -> Kids
- "Go for a walk" or "gym" -> Me
- "Trip to Paris" or "look at train tickets" -> Ideas
- "Return a package" -> Errands
- "Make a phone call" -> Ideas or Errands (depending on context)

Return a JSON array of items in this exact format:
[
  {
    "title": "item title",
    "description": "optional longer description",
    "category": "Category Name",
    "timeFrame": "today|this_week|this_month|future"
  }
]

Only return the JSON array, no other text.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
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
