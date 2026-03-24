import { useState } from 'react';
import { Mic } from 'lucide-react';

export function FloatingActionButton() {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleClick = () => {
    setShowInput(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputValue('');
    setShowInput(false);
  };

  if (showInput) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 shadow-lg animate-fade-up">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Just talk. Carry figures out the rest."
            className="w-full bg-cream border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
            onBlur={() => {
              if (!inputValue) setShowInput(false);
            }}
          />
        </form>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 left-0 right-0 flex items-center justify-center gap-4 animate-fade-up stagger-6">
      <span className="text-xs text-muted font-ui font-light">type</span>
      <button
        onClick={handleClick}
        className="relative w-16 h-16 bg-text rounded-full flex items-center justify-center text-surface shadow-lg hover:scale-105 active:scale-95 transition-transform"
        aria-label="Add new item"
      >
        <div className="absolute inset-0 rounded-full bg-text/40 animate-pulse-ring"></div>
        <Mic size={24} />
      </button>
      <span className="text-xs text-muted font-ui font-light">voice</span>
    </div>
  );
}
