import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Carry: categorize-items
// Updated 24 Nov 2026 for Claude Sonnet 5.5 (Sonnet 4.5 retires 30 Nov 2026).
//
// What changed vs the Sonnet 4.5 version:
// 1. Model is claude-sonnet-5-5 by default, overridable with the CARRY_MODEL secret
//    (so you can switch model in the Supabase dashboard without touching code).
// 2. Sonnet 5.5 thinks by default and can put a "thinking" block first in the reply.
//    The old code read content[0].text, which comes back empty when that happens.
//    We now turn up-front thinking off (between_tools) AND read text blocks by type.
// 3. max_tokens raised, because on 5.x it covers thinking plus the answer.
// 4. We pull the JSON array out and check it parses BEFORE sending it to the app.
//    If it does not parse (or the reply was cut off), we retry once.
// 5. Retries on overloaded / 5xx errors, a timeout, and one log line per request
//    (model, stop reason, tokens, time) so problems show up in Supabase logs.
// The response shape to the app is unchanged: { result: "<json array string>" }.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

const DEFAULT_MODEL = "claude-sonnet-5-5";
const MAX_TOKENS = 4000;
const TIMEOUT_MS = 45000;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Join every text block. Never assume the first block is text.
function readText(data: any): string {
  if (!data || !Array.isArray(data.content)) return "";
  return data.content
    .filter((b: any) => b && b.type === "text" && typeof b.text === "string")
    .map((b: any) => b.text)
    .join("")
    .trim();
}

// The app shows "detail". For lists, Sonnet 5.5 sometimes puts the bullets in
// "description", or returns the list as an array. Make sure the bullets end up in "detail".
function normalise(items: any[]): any[] {
  const hasBullets = (v: any) => typeof v === "string" && v.includes("\u2022");
  return items.map((i) => {
    if (!i || typeof i !== "object") return i;
    const out = { ...i };
    if (!hasBullets(out.detail)) {
      if (hasBullets(out.description)) {
        out.detail = out.description;
      } else {
        for (const k of ["items", "listItems", "list", "entries", "bullets"]) {
          const arr = out[k];
          if (Array.isArray(arr) && arr.length && arr.every((x: any) => typeof x === "string")) {
            out.detail = arr.map((x: string) => "\u2022 " + x.replace(/^[\u2022\-*\s]+/, "")).join("\n");
            break;
          }
        }
      }
    }
    if (!out.detail && typeof out.description === "string") out.detail = out.description;
    return out;
  });
}

// Find the JSON array in the reply, even if the model wrapped it in fences or a sentence.
function extractJsonArray(raw: string): string | null {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const tryParse = (s: string) => {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return JSON.stringify(normalise(parsed));
      // Some replies come back as { items: [...] }
      if (parsed && Array.isArray(parsed.items)) return JSON.stringify(normalise(parsed.items));
    } catch (_) { /* fall through */ }
    return null;
  };
  const direct = tryParse(cleaned);
  if (direct) return direct;
  const first = cleaned.indexOf("[");
  const last = cleaned.lastIndexOf("]");
  if (first !== -1 && last > first) return tryParse(cleaned.slice(first, last + 1));
  return null;
}

async function callClaude(apiKey: string, model: string, system: string, messages: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        // Sonnet 5.5: lowest thinking setting, no up-front thinking. Fast, like 4.5 was.
        // Do NOT send {"type":"disabled"} here, Sonnet 5.5 rejects it with a 400.
        thinking: { type: "between_tools" },
        output_config: { effort: Deno.env.get("CARRY_EFFORT") || "medium" },
        system,
        messages,
      }),
    });
    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch (_) { /* keep raw text */ }
    return { ok: res.ok, status: res.status, data, raw: text };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const started = Date.now();

  try {
    const body = await req.json();
    const { text, systemPrompt, imageBase64, imageType } = body;

    if (!text && !imageBase64) {
      return jsonResponse({ error: "Missing required field: text or imageBase64" }, 400);
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY not configured" }, 500);
    }

    const model = Deno.env.get("CARRY_MODEL") || DEFAULT_MODEL;

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
- date: YYYY-MM-DD or null. Set to today's date if user says "today". Always go FORWARD from today, never backwards. If a time is mentioned without a date, assume today.
- time: HH:MM (24hr) if user mentioned a specific time like "at 1pm", "2:30", "noon" etc. Always set this when a time is mentioned.
- hasDateTime: true if the item has a specific date, time, or the user said "today", "tomorrow", "this week", or any day reference. false only if completely timeless.
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

    // Up to 3 attempts: retry on overloaded/5xx/timeout, and once on unparseable JSON.
    let lastProblem = "unknown";
    for (let attempt = 1; attempt <= 3; attempt++) {
      let r;
      try {
        r = await callClaude(apiKey, model, systemPromptToUse, messages);
      } catch (e) {
        lastProblem = e instanceof Error && e.name === "AbortError" ? "timeout" : `network: ${e}`;
        console.log(JSON.stringify({ fn: "categorize-items", model, attempt, problem: lastProblem }));
        continue;
      }

      if (!r.ok) {
        lastProblem = `anthropic ${r.status}: ${r.raw.slice(0, 300)}`;
        console.log(JSON.stringify({ fn: "categorize-items", model, attempt, problem: lastProblem }));
        // 4xx (except 429) means the request itself is wrong: retrying will not help.
        if (r.status >= 400 && r.status < 500 && r.status !== 429) break;
        await new Promise((res) => setTimeout(res, 600 * attempt));
        continue;
      }

      const stop = r.data?.stop_reason;
      const raw = readText(r.data);
      const json = extractJsonArray(raw);

      console.log(JSON.stringify({
        fn: "categorize-items",
        model: r.data?.model || model,
        attempt,
        stop_reason: stop,
        input_tokens: r.data?.usage?.input_tokens,
        output_tokens: r.data?.usage?.output_tokens,
        ms: Date.now() - started,
        parsed: json !== null,
        image: Boolean(imageBase64),
      }));

      if (stop === "refusal") {
        // Do not show a scary error to the user; give the app an empty list.
        return jsonResponse({ result: "[]", note: "refusal" });
      }

      if (json !== null) {
        return jsonResponse({ result: json });
      }

      lastProblem = `unparseable reply (stop_reason ${stop}): ${raw.slice(0, 200)}`;
    }

    throw new Error(lastProblem);

  } catch (error) {
    console.error("categorize-items error:", error, "ms:", Date.now() - started);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
