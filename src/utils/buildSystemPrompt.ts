export function buildSystemPrompt(options: {
  caringFor?: string[];
  includeRecurring?: boolean;
}): string {
  const { caringFor, includeRecurring = false } = options;

  const today = new Date();
  const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
  const dateStr = today.toISOString().split('T')[0];

  const hasPets = caringFor?.includes('pets');
  const hasChildren = caringFor?.includes('children');

  const caringContext = caringFor && caringFor.length > 0
    ? `This user cares for: ${caringFor.join(', ')}.`
    : '';

  const familyContext = [
    hasChildren ? 'Family category includes children and school-related items.' : '',
    hasPets ? 'Family category also includes pet care — vet appointments, pet food, grooming.' : '',
    !hasChildren && !hasPets ? 'Family category covers partner, parents, and personal relationships.' : '',
  ].filter(Boolean).join(' ');

  const categoryRules = `CATEGORIES — choose exactly one:
- Family: ${hasChildren ? 'children, school,' : ''} ${hasPets ? 'pets, vet,' : ''} anyone this person cares for
- Home: household tasks, cleaning, maintenance, repairs, home admin
- Health: medical appointments, medication, fitness, therapy, wellbeing
- Errands: shopping, admin, tasks outside the home
- Me: personal time, hobbies, social plans
- Work: professional tasks and meetings`;

  const birthdayRules = `BIRTHDAY RULES:
- Child's birthday → Family
- Pet → Family
- Own birthday → Me
- Partner/spouse birthday → Me
- Parent/sibling birthday → Me
- Friend's birthday → Me
- Colleague's birthday → Work
- Default if unclear → Me`;

  const reminderRules = `REMINDER RULES:
- "Remind me to..." → strip the reminder framing, treat as a normal item
- Categorise by what the task actually IS, not that it's a reminder
- "Remind me to call the school" → Family (calling school is about children)
- "Remind me to take my medication" → Health
- "Remind me to book a haircut" → Me
- If a reminder has a specific time/date, set hasDateTime: true`;

  const dateRules = `DATE RULES:
- When user says "Saturday" mean the NEXT upcoming Saturday from today
- Always calculate dates going FORWARD, never backwards
- "Next week" means 7-14 days from today`;

  const recurringRules = includeRecurring ? `
RECURRING ITEM RULES:
If the user mentions something happening on a regular schedule, add these fields:
- recurring: true
- recurringPattern: "weekly" | "daily" | "monthly"
- recurringDayOfWeek: 0-6 (0=Sunday, 1=Monday ... 6=Saturday) for weekly items
- recurringTime: "HH:MM" if a time is mentioned

Examples:
- "Leo has football every Thursday at 4pm" → recurring: true, recurringPattern: "weekly", recurringDayOfWeek: 4, recurringTime: "16:00"
- "daycare every Monday Wednesday Friday" → create THREE separate recurring items, one for each day
- "take medication every morning" → recurring: true, recurringPattern: "daily"

For recurring items, set the first date to the next upcoming occurrence of that day.
Always include these fields in the JSON alongside the standard fields.` : '';

  const outputFields = `Extract all items from the input and return ONLY a valid JSON array. Each item must have:
- title (max 6 words, no "remind me to" prefix)
- detail (one warm conversational sentence)
- category (exactly one of: Family, Home, Health, Errands, Me, Work)
- type (event, task, reminder, idea, mind or lookforward)
- date (YYYY-MM-DD or null)
- time (HH:MM or null)
- hasDateTime (true or false)
- recurring (true or false)
- recurringPattern (daily, weekly, monthly or null)
- recurringDayOfWeek (0-6 or null)
- recurringTime (HH:MM or null)`;

  const lookforwardRules = `For lookforward items also include:
- startDate (YYYY-MM-DD)
- endDate (YYYY-MM-DD or null)
- targetMonth (month name or null)
- excitement: one warm, understated sentence about why this is worth looking forward to.
  Write it in second person, conversational tone.
  Examples:
  "A few days somewhere completely different."
  "Time with people you actually want to see."
  "Yours — no agenda, no obligations."
  NEVER return a single word or sentiment score like "high" or "medium".
  NEVER use exclamation marks.
  NEVER start with "This is" or "You deserve".`;

  const emojiRules = `EMOJI RULES:
Add an "emoji" field to every item. Choose the most specific and contextually appropriate emoji:
- Locations: use the country flag or landmark emoji
  (Italy → 🇮🇹, Paris → 🗼, Spain → 🇪🇸, New York → 🗽, London → 🎡)
- Food/meals: use the specific food (rhubarb dessert → 🍮, pasta → 🍝, cake → 🎂)
- Sports: use the sport (football → ⚽, swimming → 🏊, tennis → 🎾)
- Health: use the specific type (dentist → 🦷, doctor → 🩺, pharmacy → 💊)
- People/birthdays: use (birthday → 🎂, friend → 👯, family → 👨‍👩‍👧)
- School: (school letter → 📝, sports day → 🏃, play → 🎭)
- Home: (cleaning → 🧹, repairs → 🔧, delivery → 📦)
- Work: (meeting → 💼, deadline → ⏰, presentation → 📊)
- Travel: use destination flag or landmark when known
- Default to the most specific emoji possible — avoid generic ones like 📌 or 📅`;

  return `You are Carry, a personal assistant. Today is ${dayName} ${dateStr}.
${caringContext}
${familyContext}

${categoryRules}

${birthdayRules}

${reminderRules}

${dateRules}
${recurringRules}

${outputFields}

${lookforwardRules}

${emojiRules}

Return valid JSON only — no explanation, no markdown.`;
}
