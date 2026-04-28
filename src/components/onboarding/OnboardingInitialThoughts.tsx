import { useState } from 'react';
import { ProgressDots } from './ProgressDots';
import { categorizeAndCreateItems } from '../../hooks/useItemCategorization';

interface OnboardingInitialThoughtsProps {
  userId: string;
  onContinue: (thoughts: string) => void;
  onSkip: () => void;
}

export function OnboardingInitialThoughts({ userId, onContinue, onSkip }: OnboardingInitialThoughtsProps) {
  const [thoughts, setThoughts] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContinue = async () => {
    if (!thoughts.trim()) {
      onSkip();
      return;
    }
    setIsProcessing(true);
    try {
      await categorizeAndCreateItems(thoughts, userId);
    } catch (e) {
    }
    setIsProcessing(false);
    onContinue(thoughts);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ProgressDots total={3} current={2} />
      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-3">
            <h1 className="font-display font-light italic text-4xl text-text">
              What's on your mind?
            </h1>
            <p className="font-ui font-light text-muted">
              Anything you're thinking about, big or small. Carry will sort it.
            </p>
          </div>

          <textarea
            value={thoughts}
            onChange={e => setThoughts(e.target.value)}
            placeholder="Pick up dry cleaning, call mum, dentist appointment for kids…"
            rows={5}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
          />

          <div className="flex gap-3">
            <button
              onClick={onSkip}
              disabled={isProcessing}
              className="flex-1 bg-surface border border-border text-text rounded-xl px-6 py-4 font-ui font-medium hover:border-accent/30 transition-all disabled:opacity-50"
            >
              Skip
            </button>
            <button
              onClick={handleContinue}
              disabled={isProcessing}
              className="flex-1 bg-accent text-surface rounded-xl px-6 py-4 font-ui font-medium hover:bg-accent/90 transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Sorting…' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
