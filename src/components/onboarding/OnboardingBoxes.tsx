import { useState } from 'react';
import { ProgressDots } from './ProgressDots';

interface OnboardingBoxesProps {
  onContinue: (selectedCategories: string[]) => void;
}

const CATEGORIES = [
  { name: 'Family', emoji: '🏡' },
  { name: 'Household', emoji: '🏠' },
  { name: 'Health', emoji: '❤️' },
  { name: 'Errands', emoji: '🛍' },
  { name: 'Me', emoji: '🏃‍♀️' },
  { name: 'Ideas', emoji: '✨' },
  { name: 'Work', emoji: '💼' },
  { name: 'Projects', emoji: '📋' },
];

export function OnboardingBoxes({ onContinue }: OnboardingBoxesProps) {
  const [selected, setSelected] = useState<string[]>(CATEGORIES.map(c => c.name));

  const toggleCategory = (name: string) => {
    if (selected.includes(name)) {
      if (selected.length > 3) {
        setSelected(selected.filter(n => n !== name));
      }
    } else {
      setSelected([...selected, name]);
    }
  };

  const handleContinue = () => {
    if (selected.length >= 3) {
      onContinue(selected);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md">
          <h1 className="font-serif italic text-4xl text-primary mb-3 text-center">
            Your boxes.
          </h1>
          <p className="text-secondary text-center mb-12">
            These are where Carry sorts everything.<br />
            Pick the ones that matter to you.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {CATEGORIES.map((category) => {
              const isSelected = selected.includes(category.name);
              return (
                <button
                  key={category.name}
                  onClick={() => toggleCategory(category.name)}
                  className={`p-6 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-accent/10 border-2 border-accent'
                      : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  <div className="text-4xl mb-2">{category.emoji}</div>
                  <div className={`font-ui font-medium ${
                    isSelected ? 'text-primary' : 'text-secondary'
                  }`}>
                    {category.name}
                  </div>
                </button>
              );
            })}
          </div>

          {selected.length < 3 && (
            <p className="text-sm text-secondary text-center mb-4">
              Select at least 3 boxes to continue
            </p>
          )}

          <button
            onClick={handleContinue}
            disabled={selected.length < 3}
            className={`w-full py-4 px-6 rounded-xl font-ui font-medium transition-all ${
              selected.length >= 3
                ? 'bg-accent text-surface hover:bg-accent/90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            These look right →
          </button>
        </div>
      </div>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center">
        <ProgressDots current={6} total={9} />
      </div>
    </div>
  );
}
