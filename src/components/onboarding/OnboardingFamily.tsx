import { useState } from 'react';
import { X } from 'lucide-react';
import { ProgressDots } from './ProgressDots';

interface OnboardingFamilyProps {
  onContinue: (data: {
    household: string[];
    hasChildren: boolean;
    children: Array<{ name: string; age: number }>;
  }) => void;
}

const householdOptions = [
  { value: 'partner', label: 'Partner or spouse' },
  { value: 'coparent', label: 'Co-parent (we live separately)' },
  { value: 'just_me', label: 'Just me' },
  { value: 'family', label: 'Parents or family members' },
];

export function OnboardingFamily({ onContinue }: OnboardingFamilyProps) {
  const [household, setHousehold] = useState<string[]>([]);
  const [hasChildren, setHasChildren] = useState<boolean | null>(null);
  const [children, setChildren] = useState<Array<{ name: string; age: string }>>([]);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');

  const toggleHousehold = (value: string) => {
    setHousehold(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const addChild = () => {
    if (childName.trim() && childAge && children.length < 6) {
      setChildren([...children, { name: childName.trim(), age: childAge }]);
      setChildName('');
      setChildAge('');
    }
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({
      household,
      hasChildren: hasChildren || false,
      children: children.map(c => ({ name: c.name, age: parseInt(c.age) })),
    });
  };

  const canContinue = household.length > 0 && hasChildren !== null;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ProgressDots total={8} current={2} />

      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="font-display font-light italic text-4xl text-text">
              Who are you carrying for?
            </h1>
            <p className="font-ui font-light text-muted text-lg">
              Add the people in your life.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="font-ui text-sm text-muted">
                Who's at home with you?
              </label>
              <div className="flex flex-wrap gap-2">
                {householdOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleHousehold(option.value)}
                    className={`px-4 py-2 rounded-full font-ui text-sm transition-all ${
                      household.includes(option.value)
                        ? 'bg-accent text-surface'
                        : 'bg-surface border border-border text-text hover:border-accent/30'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="font-ui text-sm text-muted">
                Do you have children?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setHasChildren(true)}
                  className={`flex-1 px-6 py-3 rounded-xl font-ui transition-all ${
                    hasChildren === true
                      ? 'bg-accent text-surface'
                      : 'bg-surface border border-border text-text hover:border-accent/30'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasChildren(false);
                    setChildren([]);
                  }}
                  className={`flex-1 px-6 py-3 rounded-xl font-ui transition-all ${
                    hasChildren === false
                      ? 'bg-accent text-surface'
                      : 'bg-surface border border-border text-text hover:border-accent/30'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {hasChildren && (
              <div className="space-y-3">
                <label className="font-ui text-sm text-muted">
                  Add their names and ages
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 bg-surface border border-border rounded-xl px-4 py-2 font-ui text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                  <input
                    type="number"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    placeholder="Age"
                    className="w-20 bg-surface border border-border rounded-xl px-4 py-2 font-ui text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addChild}
                    disabled={!childName.trim() || !childAge || children.length >= 6}
                    className="px-4 py-2 bg-surface border border-border rounded-xl font-ui text-accent hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    + Add
                  </button>
                </div>
                {children.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {children.map((child, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1.5"
                      >
                        <span className="font-ui text-sm text-text">
                          {child.name}, {child.age}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeChild(i)}
                          className="text-muted hover:text-accent transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={!canContinue}
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
