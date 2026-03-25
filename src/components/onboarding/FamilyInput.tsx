import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface FamilyInputProps {
  onFamilySubmit: (familyMembers: string[]) => void;
}

export function FamilyInput({ onFamilySubmit }: FamilyInputProps) {
  const [currentInput, setCurrentInput] = useState('');
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);

  const handleAddMember = () => {
    if (currentInput.trim() && familyMembers.length < 4) {
      setFamilyMembers([...familyMembers, currentInput.trim()]);
      setCurrentInput('');
    }
  };

  const handleRemoveMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentInput.trim() && familyMembers.length < 4) {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleSubmit = () => {
    onFamilySubmit(familyMembers);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5">
      <div className="max-w-md w-full space-y-8 animate-fade-up">
        <div className="space-y-4">
          <h1 className="font-display italic text-4xl font-extralight text-text leading-tight">
            Who are you carrying for?
          </h1>
          <p className="font-ui text-base text-muted font-light">
            Add the people in your life — you can always update this later.
          </p>
        </div>

        <div className="space-y-4">
          {familyMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {familyMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2 group hover:border-accent/30 transition-colors"
                >
                  <span className="font-ui text-text">{member}</span>
                  <button
                    onClick={() => handleRemoveMember(index)}
                    className="text-muted hover:text-accent transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {familyMembers.length < 4 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Partner, kids, anyone relevant..."
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                autoFocus
              />
              <button
                onClick={handleAddMember}
                disabled={!currentInput.trim()}
                className="bg-surface border border-border rounded-xl px-4 py-3 text-muted hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          )}

          {familyMembers.length === 4 && (
            <p className="font-ui text-sm text-muted text-center">
              Maximum 4 family members
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-text text-cream rounded-xl py-4 font-ui font-medium hover:bg-text/90 active:scale-95 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
