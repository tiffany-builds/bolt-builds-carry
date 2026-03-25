import { useState } from 'react';
import { Check } from 'lucide-react';
import { categoryOptions } from '../../data/categoryOptions';

interface CategorySelectionProps {
  userName: string;
  onCategoriesSubmit: (selectedCategories: string[]) => void;
}

export function CategorySelection({ userName, onCategoriesSubmit }: CategorySelectionProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleSubmit = () => {
    if (selectedCategories.length > 0) {
      onCategoriesSubmit(selectedCategories);
    }
  };

  const isValid = selectedCategories.length > 0;

  return (
    <div className="min-h-screen bg-cream flex flex-col px-5 py-8">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="space-y-2 mb-8 animate-fade-up">
          <h1 className="font-display italic text-3xl font-light text-text leading-tight">
            Your boxes
          </h1>
          <p className="font-ui text-base text-muted font-light">
            Hi {userName}! Select the boxes that matter to you. You can always change these later.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 animate-fade-up stagger-2">
          {categoryOptions.map((category) => {
            const isSelected = selectedCategories.includes(category.name);
            return (
              <button
                key={category.name}
                onClick={() => toggleCategory(category.name)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface hover:border-accent/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{category.emoji}</span>
                      <h3 className="font-ui font-medium text-text">{category.name}</h3>
                    </div>
                    {category.description && (
                      <p className="text-xs text-muted font-ui font-light">
                        {category.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                      <Check size={14} className="text-surface" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 mt-8 animate-fade-up stagger-3">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full bg-accent text-surface rounded-xl py-3 font-ui font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Set up {selectedCategories.length} box{selectedCategories.length !== 1 ? 'es' : ''}
          </button>

          <p className="text-xs text-muted text-center font-ui font-light">
            You need at least one box to get started
          </p>
        </div>
      </div>
    </div>
  );
}
