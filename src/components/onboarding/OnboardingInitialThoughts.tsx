import { useState } from 'react';
import { ProgressDots } from './ProgressDots';

interface OnboardingInitialThoughtsProps {
  userId: string;
  onContinue: (thoughts: string) => void;
  onSkip: () => void;
}

export function OnboardingInitialThoughts({ onContinue, onSkip }: OnboardingInitialThoughtsProps) {
  const [thoughts, setThoughts] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (thoughts.trim()) {
      onContinue(thoughts.trim());
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ProgressDots total={3} current={2} />

      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="font-display font-light italic text-4xl text-text">
              Just talk. What's on your plate?
            </h1>
            <p className="font-display font-light italic text-muted text-lg">
              Say anything — Carry will sort it out.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <textarea
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              placeholder="School pickups, appointments, things you keep forgetting, something coming up..."
              className="w-full bg-surface border border-border rounded-xl px-4 py-4 font-ui text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors min-h-[150px] resize-none"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onSkip}
                className="flex-1 bg-surface border border-border text-text rounded-xl px-6 py-4 font-ui font-medium hover:border-accent/30 transition-all"
              >
                Nothing yet →
              </button>
              <button
                type="submit"
                disabled={!thoughts.trim()}
                className="flex-1 bg-accent text-surface rounded-xl px-6 py-4 font-ui font-medium hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Let's go →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
