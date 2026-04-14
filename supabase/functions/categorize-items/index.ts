import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { text, systemPrompt, imageBase64, imageType } = body;

    if (!text && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing required field: text or imageBase64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date();
    const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const defaultSystemPrompt = `You are Carry, a personal assistant for parents.
Today is ${dayName} ${dateStr}.

Extract all items from the input and return ONLY a valid JSON array.

Each item must have:
- title: max 6 words
- detail: one warm conversational sentence
- category: exactly one of: Family, Home, Errands, Me, Health, Work
- type: event, task, reminder, idea, mind or lookforward
- date: YYYY-MM-DD or null. Always go FORWARD from today, never backwards.
- time: HH:MM or null
- hasDateTime: true or false
- emoji: most specific contextual emoji
- recurring: true or false
- recurringPattern: "weekly", "daily", "yearly" or null
- recurringDayOfWeek: 0-6 or null (0=Sunday, 1=Monday etc)

Use category "Family" for: children, school, childcare, pets, anyone cared for at home.
Use category "Health" for: doctor, dentist, hospital, medication, physio, therapy, anything health related.
Use category "Me" for: personal time, self-care, hobbies, social plans. Anniversaries and birthdays of partners/friends go here.
Use category "Home" for: household tasks, cleaning, maintenance, repairs.
Use category "Errands" for: shopping, returns, post office, admin outside the home.
Use category "Work" for: work tasks, meetings, professional projects.

Use type "lookforward" for trips, travel, holidays, concerts, reunions, anniversaries or anything exciting and anticipated.
For lookforward items also include: startDate, endDate, targetMonth, excitement (warm one sentence, never a single word).

For recurring items (every Monday, every day etc): set recurring true, recurringPattern, recurringDayOfWeek.

Return valid JSON only — no explanation, no markdown, no code blocks.`;

    const systemPromptToUse = systemPrompt || defaultSystemPrompt;

    const messages = imageBase64
      ? [{
          role: "user" as const,
          content: [
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: (imageType || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              }
            },
            {
              type: "text" as const,
              text: text || "What actionable items can you find in this image?"
            }
          ]
        }]
      : [{
          role: "user" as const,
          content: text
        }];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        system: systemPromptToUse,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const result = data.content[0].text;

    return new Response(
      JSON.stringify({ result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
