import { useState } from 'react';
import { ProgressDots } from './ProgressDots';

interface OnboardingNudgesProps {
  onContinue: (nudgePreference: string) => void;
}

const nudgeOptions = [
  {
    value: 'daily',
    emoji: '☀️',
    label: 'Daily morning summary',
    description: 'Start each day knowing what\'s ahead'
  },
  {
    value: 'only_when_needed',
    emoji: '🔔',
    label: 'Only when something needs attention',
    description: 'I\'ll nudge you when it matters'
  },
  {
    value: 'weekly',
    emoji: '📋',
    label: 'Weekly digest',
    description: 'A quiet overview at the start of each week'
  },
];

export function OnboardingNudges({ onContinue }: OnboardingNudgesProps) {
  const [selected, setSelected] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected) {
      onContinue(selected);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ProgressDots total={8} current={5} />

      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="font-display font-light italic text-4xl text-text">
              How would you like Carry to check in?
            </h1>
            <p className="font-ui font-light text-muted text-lg">
              You can always change this later.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              {nudgeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelected(option.value)}
                  className={`w-full p-4 rounded-xl font-ui text-left transition-all ${
                    selected === option.value
                      ? 'bg-accent text-surface'
                      : 'bg-surface border border-border text-text hover:border-accent/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <div>
                      <div className="font-medium mb-1">{option.label}</div>
                      <div className={`text-sm font-light ${
                        selected === option.value ? 'text-surface/80' : 'text-muted'
                      }`}>
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!selected}
              className="w-full bg-accent text-surface rounded-xl px-6 py-4 font-ui font-medium hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
