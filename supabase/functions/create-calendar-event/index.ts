import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIcsDate(date: string, time: string | null): string {
  // date: YYYY-MM-DD, time: HH:MM or null
  const [year, month, day] = date.split('-').map(Number);
  if (time) {
    const [hour, minute] = time.split(':').map(Number);
    return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  }
  return `${year}${pad(month)}${pad(day)}`;
}

function escapeIcs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { title, date, time, emoji } = await req.json();

    if (!title || !date) {
      return new Response(JSON.stringify({ error: "title and date are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const displayTitle = emoji ? `${emoji} ${title}` : title;
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@carry`;
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    let dtstart: string;
    let dtend: string;
    let allDay = false;

    if (time) {
      dtstart = toIcsDate(date, time);
      // Default 1-hour duration
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute] = time.split(':').map(Number);
      const endDate = new Date(year, month - 1, day, hour + 1, minute);
      dtend = `${endDate.getFullYear()}${pad(endDate.getMonth()+1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
    } else {
      dtstart = toIcsDate(date, null);
      // All-day: end is next day
      const [year, month, day] = date.split('-').map(Number);
      const next = new Date(year, month - 1, day + 1);
      dtend = `${next.getFullYear()}${pad(next.getMonth()+1)}${pad(next.getDate())}`;
      allDay = true;
    }

    const dtStartLine = allDay
      ? `DTSTART;VALUE=DATE:${dtstart}`
      : `DTSTART:${dtstart}`;
    const dtEndLine = allDay
      ? `DTEND;VALUE=DATE:${dtend}`
      : `DTEND:${dtend}`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Carry//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      dtStartLine,
      dtEndLine,
      `SUMMARY:${escapeIcs(displayTitle)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return new Response(ics, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
