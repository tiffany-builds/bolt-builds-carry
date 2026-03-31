import { useState } from 'react';
import { ProgressDots } from './ProgressDots';

interface OnboardingWelcomeProps {
  onContinue: (name: string) => void;
}

export function OnboardingWelcome({ onContinue }: OnboardingWelcomeProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onContinue(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ProgressDots total={3} current={0} />

      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="font-display font-light italic text-4xl text-text">
              Hi. Let's set up Carry.
            </h1>
            <p className="font-ui font-light text-muted text-lg">
              Takes about a minute.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-ui text-sm text-muted">
                What's your first name?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                placeholder="Your name"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-accent text-surface rounded-xl px-6 py-4 font-ui font-medium hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Let's go →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
