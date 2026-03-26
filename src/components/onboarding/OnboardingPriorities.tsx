import { useState } from 'react';
import { ProgressDots } from './ProgressDots';

interface OnboardingPrioritiesProps {
  onContinue: (priorityAreas: string[]) => void;
}

const priorityOptions = [
  { value: 'appointments', emoji: '📋', label: 'Appointments and admin' },
  { value: 'school', emoji: '🏫', label: 'School and kids stuff' },
  { value: 'household', emoji: '🏠', label: 'Household tasks' },
  { value: 'myHealth', emoji: '💆', label: 'My own self care and health' },
  { value: 'birthdays', emoji: '🎂', label: 'Birthdays and special dates' },
  { value: 'work', emoji: '💼', label: 'Work deadlines' },
  { value: 'shopping', emoji: '🛒', label: 'Shopping and errands' },
  { value: 'trips', emoji: '✈️', label: 'Planning ahead for trips' },
];

export function OnboardingPriorities({ onContinue }: OnboardingPrioritiesProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const togglePriority = (value: string) => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue(selected);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ProgressDots total={8} current={4} />

      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="font-display font-light italic text-4xl text-text">
              What tends to slip through the cracks?
            </h1>
            <p className="font-ui font-light text-muted text-lg">
              Carry will keep a special eye on these.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => togglePriority(option.value)}
                  className={`px-4 py-2 rounded-full font-ui text-sm transition-all ${
                    selected.includes(option.value)
                      ? 'bg-accent text-surface'
                      : 'bg-surface border border-border text-text hover:border-accent/30'
                  }`}
                >
                  <span className="mr-1">{option.emoji}</span>
                  {option.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-accent text-surface rounded-xl px-6 py-4 font-ui font-medium hover:bg-accent/90 transition-all"
            >
              Continue →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
