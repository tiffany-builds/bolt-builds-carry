interface AffirmationCardProps {
  itemCount: number;
  mindItemCount: number;
  isBirthday: boolean;
  todayTotal: number;
  todayCompleted: number;
}

function getMessage(
  todayTotal: number,
  todayCompleted: number,
  lastWeekCount: number,
  isBirthday: boolean
): { headline: string; sub: string } {

  if (isBirthday) {
    return {
      headline: "Happy birthday.",
      sub: "Whatever's on the list today — it can wait a little."
    };
  }

  const remaining = todayTotal - todayCompleted;

  if (todayTotal > 0 && remaining === 0) {
    const options = [
      { headline: "That's today handled.", sub: "Everything on the list — done." },
      { headline: "All of it.", sub: "Not a small thing." },
      { headline: "Clean slate.", sub: "That doesn't happen often." },
    ];
    return options[new Date().getDate() % options.length];
  }

  if (todayTotal >= 3 && todayCompleted > 0 && remaining > 0) {
    const options = [
      { headline: `${todayCompleted} down.`, sub: `${remaining} left. You're through the hard part.` },
      { headline: "Making progress.", sub: `${remaining} more thing${remaining > 1 ? 's' : ''} and today's done.` },
      { headline: "Keep going.", sub: `${remaining} left on today's list.` },
    ];
    return options[todayCompleted % options.length];
  }

  if (todayTotal >= 5) {
    const options = [
      { headline: `A full one today.`, sub: "Start with the timed ones and the rest will follow." },
      { headline: `${todayTotal} things today.`, sub: "That's a lot. One at a time." },
      { headline: "Today's a lot.", sub: "Start somewhere. Anywhere." },
    ];
    return options[new Date().getDay() % options.length];
  }

  if (todayTotal > 0 && todayTotal <= 2) {
    const options = [
      { headline: "A light one today.", sub: "Make the most of it." },
      { headline: `Just ${todayTotal} thing${todayTotal > 1 ? 's' : ''} today.`, sub: "Manageable." },
    ];
    return options[new Date().getDay() % options.length];
  }

  if (todayTotal >= 3) {
    const options = [
      { headline: `${todayTotal} things on today.`, sub: "You've handled more." },
      { headline: "A steady day ahead.", sub: `${todayTotal} things to get through.` },
    ];
    return options[new Date().getDay() % options.length];
  }

  if (lastWeekCount > 0) {
    const options = [
      { headline: `${lastWeekCount} things last week.`, sub: "That's not nothing." },
      { headline: "Nothing on today.", sub: "Don't fill it out of habit." },
      { headline: "A quiet one.", sub: "Rare. Enjoy it." },
    ];
    return options[new Date().getDay() % options.length];
  }

  return {
    headline: "Ready when you are.",
    sub: "Just talk, and Carry will organise the rest."
  };
}

export function AffirmationCard({ itemCount, mindItemCount, isBirthday, todayTotal, todayCompleted }: AffirmationCardProps) {
  const message = getMessage(todayTotal, todayCompleted, itemCount, isBirthday);

  return (
    <div className="animate-fade-up stagger-2">
      <div className="relative bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-4 right-4 text-accent/30 text-2xl">✦</div>
        <p className="text-xs uppercase tracking-wider text-accent/70 font-ui font-medium mb-3">
          This week
        </p>
        <p className="font-display italic text-xl font-light text-text leading-relaxed">
          {message.headline}
        </p>
        <p className="font-ui text-sm text-muted mt-2">
          {message.sub}
        </p>
      </div>
    </div>
  );
}
