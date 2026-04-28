import { useState } from 'react';
import { ProgressDots } from './ProgressDots';

interface OnboardingAboutYouProps {
  onContinue: (data: { caringFor: string[]; children: Array<{ name: string }> }) => void;
}

const CARING_OPTIONS = [
  { id: 'children', label: 'Children', emoji: '🧒' },
  { id: 'pets', label: 'Pets', emoji: '🐾' },
  { id: 'partner', label: 'A partner', emoji: '🤝' },
  { id: 'parents', label: 'Parents or family', emoji: '👵' },
  { id: 'just_me', label: 'Mostly just me', emoji: '✨' },
];

export function OnboardingAboutYou({ onContinue }: OnboardingAboutYouProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [childNames, setChildNames] = useState<string[]>(['']);
  const [showChildren, setShowChildren] = useState(false);

  const toggle = (id: string) => {
    if (id === 'just_me') {
      setSelected(['just_me']);
      setShowChildren(false);
      return;
    }
    setSelected(prev => {
      const without = prev.filter(i => i !== 'just_me');
      const next = prev.includes(id)
        ? without.filter(i => i !== id)
        : [...without, id];
      setShowChildren(next.includes('children'));
      return next;
    });
  };

  const handleContinue = () => {
    const children = showChildren
      ? childNames.filter(n => n.trim()).map(name => ({ name: name.trim() }))
      : [];
    onContinue({
      caringFor: selected.length > 0 ? selected : ['just_me'],
      children,
    });
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ProgressDots total={3} current={1} />
      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-3">
            <h1 className="font-display font-light italic text-4xl text-text">
              Who are you carrying for?
            </h1>
            <p className="font-ui font-light text-muted">
              Select everything that applies.
            </p>
          </div>

          <div className="space-y-2">
            {CARING_OPTIONS.map(option => (
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
                  <span className="ml-auto text-accent">✓</span>
                )}
              </button>
            ))}
          </div>

          {showChildren && (
            <div className="space-y-3">
              <p className="font-ui text-sm text-muted">
                What are their names? (optional — helps Carry categorise better)
              </p>
              {childNames.map((name, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={e => {
                      const next = [...childNames];
                      next[i] = e.target.value;
                      setChildNames(next);
                    }}
                    placeholder={`Child ${i + 1}'s name`}
                    className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                  {i === childNames.length - 1 && childNames.length < 4 && (
                    <button
                      onClick={() => setChildNames([...childNames, ''])}
                      className="px-4 py-3 rounded-xl border border-border text-muted hover:border-accent/30 transition-all font-ui"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={selected.length === 0}
            className="w-full bg-accent text-surface rounded-xl px-6 py-4 font-ui font-medium hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
