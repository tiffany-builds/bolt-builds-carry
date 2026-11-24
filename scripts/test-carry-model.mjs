// Carry model test: sends real-style voice dumps to the LIVE categorize-items function
// using the app's real system prompt, and checks what comes back.
//
// Run from the repo root:   node scripts/test-carry-model.mjs
// It reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env (same as the app).
// Optional: node scripts/test-carry-model.mjs 3   -> runs every case 3 times (catches flaky ones)

import fs from 'node:fs';
import { buildSystemPrompt } from './buildSystemPrompt.mjs';

// --- read .env ---
const env = { ...process.env };
for (const f of ['.env', '.env.local']) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !env[m[1]]) env[m[1]] = m[2];
  }
}
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Run this from the repo root where .env lives.');
  process.exit(1);
}

const REPEATS = Number(process.argv[2] || 1);
const CATS = ['Family', 'Home', 'Health', 'Errands', 'Me', 'Work'];
const today = new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayStr = iso(today);
const tomorrowStr = iso(new Date(today.getTime() + 86400000));

// Each case: what you'd say, plus what a good answer must contain.
const cases = [
  { name: 'single simple task', text: 'buy milk',
    check: (it) => it.length >= 1 },
  { name: 'tomorrow + time', text: 'dentist tomorrow at 3pm',
    check: (it) => it.some(i => i.date === tomorrowStr && i.time === '15:00' && i.category === 'Health') },
  { name: 'today chore gets today', text: 'I need to do the laundry',
    check: (it) => it.some(i => i.date === todayStr) },
  { name: 'needsDate', text: 'renew my passport',
    check: (it) => it.some(i => i.needsDate === true && !i.date) },
  { name: 'shopping list = one item', text: 'get milk, eggs, bread and butter',
    check: (it) => it.length === 1 && /•/.test(it[0].detail || '') },
  { name: 'recurring weekly', text: 'Leo has football every Thursday at 4pm',
    check: (it) => it.some(i => i.recurring === true && i.recurringDayOfWeek === 4 && i.recurringTime === '16:00') },
  { name: 'three recurring days', text: 'daycare every Monday Wednesday and Friday',
    check: (it) => it.filter(i => i.recurring).length === 3 },
  { name: 'lookforward', text: 'we are going to Italy for a week in July',
    check: (it) => it.some(i => i.type === 'lookforward' && i.excitement && i.excitement.split(' ').length > 2) },
  { name: 'French stays French', text: "il faut que j'appelle l'école demain matin",
    check: (it) => it.length >= 1 && !/\b(call|school)\b/i.test(it[0].title) },
  { name: 'cycle log', text: 'my period started today',
    check: (it) => it.some(i => i.isCycleLog === true) },
  { name: 'reminder framing stripped', text: 'remind me to take my medication tonight',
    check: (it) => it.some(i => !/remind/i.test(i.title) && i.category === 'Health') },
  { name: 'long rambling brain dump (the "not listening" case)',
    text: "ok so um tomorrow I need to drop the kids at school early because of the trip, then I have the work call with the London team at ten, oh and I keep forgetting to book the car in for its service, and we're out of dishwasher tablets, and it's my mum's birthday on Saturday so I need to order flowers, and Patrick needs new football boots before Thursday, and I really want to start running again at some point, and the boiler is making that noise again so I should call someone about it",
    check: (it) => it.length >= 7 },
  { name: 'messy speech-to-text', text: 'pick up the the prescription from from the pharmacy um after work and uh call Sarah back',
    check: (it) => it.length >= 2 },
];

function validate(items) {
  const problems = [];
  if (!Array.isArray(items)) return ['not an array'];
  for (const i of items) {
    if (!i.title) problems.push('missing title');
    if (!CATS.includes(i.category)) problems.push(`bad category "${i.category}"`);
    if (i.date && !/^\d{4}-\d{2}-\d{2}$/.test(i.date)) problems.push(`bad date "${i.date}"`);
    if (i.date && i.date < todayStr && i.type !== 'lookforward') problems.push(`date in the past ${i.date}`);
    if (i.time && !/^\d{2}:\d{2}$/.test(i.time)) problems.push(`bad time "${i.time}"`);
  }
  return problems;
}

async function run(c, systemPrompt) {
  const t0 = Date.now();
  const res = await fetch(`${URL_}/functions/v1/categorize-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}`, apikey: KEY },
    body: JSON.stringify({ text: c.text, systemPrompt }),
  });
  const ms = Date.now() - t0;
  let body;
  try { body = await res.json(); } catch { return { ok: false, ms, why: `HTTP ${res.status}, not JSON` }; }
  if (!res.ok || body.error) return { ok: false, ms, why: `HTTP ${res.status}: ${body.error}` };
  if (!body.result) return { ok: false, ms, why: 'EMPTY result (this is the bug the app hits)' };
  // Parse exactly the way the app does
  let items;
  try { items = JSON.parse(body.result.replace(/```json/gi, '').replace(/```/g, '').trim()); }
  catch { return { ok: false, ms, why: `app could not parse: ${body.result.slice(0, 120)}` }; }
  const problems = validate(items);
  const passed = c.check(items);
  return { ok: passed && problems.length === 0, ms, items, why: [...problems, passed ? null : 'expected content missing'].filter(Boolean).join('; ') };
}

const systemPrompt = buildSystemPrompt({ includeRecurring: true, caringFor: ['children'] });
let pass = 0, total = 0; const times = [];
console.log(`Testing ${URL_}/functions/v1/categorize-items  (today ${todayStr})\n`);
for (let r = 0; r < REPEATS; r++) {
  for (const c of cases) {
    total++;
    let out;
    try { out = await run(c, systemPrompt); } catch (e) { out = { ok: false, ms: 0, why: String(e) }; }
    times.push(out.ms);
    if (out.ok) pass++;
    console.log(`${out.ok ? 'PASS' : 'FAIL'}  ${String(out.ms).padStart(5)}ms  ${c.name}${out.ok ? '' : '\n      -> ' + out.why}`);
    if (!out.ok && out.items) console.log('      got:', JSON.stringify(out.items.map(i => ({ title: i.title, category: i.category, date: i.date, time: i.time }))));
  }
}
times.sort((a, b) => a - b);
console.log(`\n${pass}/${total} passed. Median ${times[Math.floor(times.length / 2)]}ms, slowest ${times[times.length - 1]}ms.`);
console.log('Go-live bar: every case passes, nothing EMPTY, slowest under ~8000ms.');
process.exit(pass === total ? 0 : 1);
