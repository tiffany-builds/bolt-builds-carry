interface AffirmationCardProps {
  isBirthday?: boolean;
  allDoneToday?: boolean;
  lastWeekCount?: number;
}

const DAILY_MESSAGES = [
  "Ready when you are.",
  "Whatever's in your head — Carry's got it.",
  "Nothing gets lost from here.",
  "You don't have to hold all of this alone.",
  "It's all here whenever you need it.",
  "One less thing to remember.",
  "Carry's keeping track so you don't have to.",
  "Everything in its place.",
  "Still here. Still holding it all.",
  "Nothing's slipping through.",
];

const DONE_MESSAGES = [
  "That's today handled.",
  "All of it. Not a small thing.",
  "Clean slate. That doesn't happen often.",
  "Done. Every last one.",
];

export function AffirmationCard({
  isBirthday = false,
  allDoneToday = false,
  lastWeekCount = 0
}: AffirmationCardProps) {

  const getMessage = () => {
    if (isBirthday) {
      return "Today is yours. Carry's got everything else.";
    }

    if (allDoneToday) {
      const i = new Date().getDate() % DONE_MESSAGES.length;
      return DONE_MESSAGES[i];
    }

    if (lastWeekCount > 0) {
      const i = new Date().getDay() % DAILY_MESSAGES.length;
      return DAILY_MESSAGES[i];
    }

    return "Ready when you are. Just talk, and Carry will organise the rest.";
  };

  const getSubtext = () => {
    if (isBirthday || allDoneToday) return null;
    if (lastWeekCount > 0) {
      return `${lastWeekCount} things carried last week.`;
    }
    return null;
  };

  const subtext = getSubtext();

  return (
    <div className="animate-fade-up stagger-2">
      <div className="relative bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-4 right-4 text-accent/30 text-2xl">✦</div>
        <p className="text-xs uppercase tracking-wider text-accent/70 font-ui font-medium mb-3">
          This week
        </p>
        <p className="font-display italic text-xl font-light text-text leading-relaxed">
          {getMessage()}
        </p>
        {subtext && (
          <p className="font-ui text-sm text-muted font-light mt-2">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
