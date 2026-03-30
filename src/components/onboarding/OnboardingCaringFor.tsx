import { useState } from 'react';
import { ProgressDots } from './ProgressDots';

interface OnboardingCaringForProps {
  onContinue: (caringFor: string[]) => void;
}

const OPTIONS = [
  { id: 'children', label: 'Children', emoji: '🫶' },
  { id: 'pets', label: 'Pets', emoji: '🐾' },
  { id: 'partner', label: 'A partner', emoji: '🤝' },
  { id: 'parents', label: 'Parents or family', emoji: '👵' },
  { id: 'just_me', label: 'Mostly just me', emoji: '✨' },
];

export function OnboardingCaringFor({ onContinue }: OnboardingCaringForProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    if (id === 'just_me') {
      setSelected(['just_me']);
      return;
    }
    setSelected(prev => {
      const without = prev.filter(i => i !== 'just_me');
      return prev.includes(id)
        ? without.filter(i => i !== id)
        : [...without, id];
    });
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ProgressDots total={9} current={3} />
      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="font-display font-light italic text-4xl text-text">
              Who are you carrying for?
            </h1>
            <p className="font-display font-light italic text-muted text-lg">
              Select everything that applies — no right answer.
            </p>
          </div>

          <div className="space-y-3">
            {OPTIONS.map(option => (
              <button
                key={option.id}
                onClick={() => toggle(option.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  selected.includes(option.id)
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-surface hover:border-accent/30'
                }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-ui font-medium text-text">{option.label}</span>
                {selected.includes(option.id) && (
                  <span className="ml-auto text-accent font-ui text-sm">✓</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => onContinue(selected.length > 0 ? selected : ['just_me'])}
            className="w-full bg-accent text-surface rounded-xl px-6 py-4 font-ui font-medium hover:bg-accent/90 transition-all"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
