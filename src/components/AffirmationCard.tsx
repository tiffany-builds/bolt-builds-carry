interface AffirmationCardProps {
  itemCount?: number;
  mindItemCount?: number;
  isBirthday?: boolean;
}

export function AffirmationCard({ itemCount = 0, mindItemCount = 0, isBirthday = false }: AffirmationCardProps) {
  const getMessage = () => {
    if (isBirthday) {
      return "Today is yours. Carry's got everything else.";
    }

    if (mindItemCount > 0) {
      const plural = mindItemCount === 1 ? 'thing' : 'things';
      return `You have ${mindItemCount} ${plural} on your mind. Carry is keeping track.`;
    }

    if (itemCount === 0) {
      return "Ready when you are. Just talk, and Carry will organise the rest.";
    } else if (itemCount === 1) {
      return "You carried 1 thing last week. That's not nothing.";
    } else {
      return `You carried ${itemCount} things last week. That's not nothing.`;
    }
  };

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
      </div>
    </div>
  );
}
