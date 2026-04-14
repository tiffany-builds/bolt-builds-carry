import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, Apikey",
};

const defaultSystemPrompt = `You are a helpful assistant that extracts and categorises items from a user's input.

Extract all actionable tasks, reminders, events, or things the user wants to remember, and return them as a JSON array.

For each item, return:
- title: short, clear label (required)
- category: one of: Family, Home, Errands, Me, Health, Work (required)
- date: ISO date string if mentioned, otherwise null
- time: time string (HH:MM) if mentioned, otherwise null
- notes: any extra detail, otherwise null

Category guidance:
Use category "Family" for: children, school, childcare, pets, anyone the user cares for at home.
Use category "Home" for: household tasks, cleaning, maintenance, repairs, home admin.
Use category "Health" for: doctor, dentist, hospital, medication, physio, therapy, anything health or body related.
Use category "Errands" for: shopping, returns, post office, admin tasks outside the home.
Use category "Me" for: personal time, self-care, hobbies, social plans, anything just for the user. Anniversaries and birthdays of partners/friends go here.
Use category "Work" for: work tasks, meetings, professional projects.

Return ONLY valid JSON — an array of objects. No explanation, no markdown, no code fences.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, systemPrompt: customSystemPrompt } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Missing required field: text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    const systemPromptToUse = customSystemPrompt || defaultSystemPrompt;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system: systemPromptToUse,
      messages: [{ role: "user", content: text }],
    });

    const content = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    return new Response(
      JSON.stringify({ result: content }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
