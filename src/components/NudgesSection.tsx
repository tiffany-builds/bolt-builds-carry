import { useState } from 'react';
import { Nudge } from '../types';
import { X } from 'lucide-react';

interface NudgeCardProps {
  nudge: Nudge;
  onDismiss: (id: string) => void;
}

function NudgeCard({ nudge, onDismiss }: NudgeCardProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(nudge.id);
    }, 300);
  };

  return (
    <div
      className={`bg-surface rounded-xl p-4 border border-border flex gap-4 transition-all ${
        isExiting ? 'opacity-0 scale-95' : ''
      }`}
    >
      <div className="flex-shrink-0 text-2xl">{nudge.icon}</div>
      <div className="flex-1">
        <h3 className="font-ui font-medium text-text mb-1">{nudge.title}</h3>
        <p className="font-display italic text-sm text-muted font-light leading-relaxed">
          {nudge.suggestion}
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-muted hover:text-text transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface NudgesSectionProps {
  initialNudges: Nudge[];
}

export function NudgesSection({ initialNudges }: NudgesSectionProps) {
  const [nudges, setNudges] = useState(initialNudges);

  const handleDismiss = (id: string) => {
    setNudges((prev) => prev.filter((nudge) => nudge.id !== id));
  };

  if (nudges.length === 0) return null;

  return (
    <div className="animate-fade-up stagger-5">
      <h2 className="text-xs uppercase tracking-wider text-muted font-ui font-medium mb-3">
        On your mind
      </h2>
      <div className="space-y-3">
        {nudges.map((nudge) => (
          <NudgeCard key={nudge.id} nudge={nudge} onDismiss={handleDismiss} />
        ))}
      </div>
    </div>
  );
}
