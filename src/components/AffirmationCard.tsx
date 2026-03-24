export function AffirmationCard() {
  return (
    <div className="animate-fade-up stagger-2">
      <div className="relative bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-4 right-4 text-accent/30 text-2xl">✦</div>
        <p className="text-xs uppercase tracking-wider text-accent/70 font-ui font-medium mb-3">
          This week
        </p>
        <p className="font-display italic text-xl font-light text-text leading-relaxed">
          You carried 11 things last week. Two appointments, one school run rescheduled, a birthday gift sorted. That's not nothing.
        </p>
      </div>
    </div>
  );
}
