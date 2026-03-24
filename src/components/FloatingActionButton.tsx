import { useState } from 'react';
import { Mic, Check, X } from 'lucide-react';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';

export function FloatingActionButton() {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState<string | null>(null);

  const handleTranscript = (text: string) => {
    setInputValue(text);
  };

  const { isListening, isBrowserSupported, startListening, stopListening } =
    useSpeechRecognition({
      onTranscript: handleTranscript,
      onStart: () => {
        setShowError(null);
      },
      onError: (error) => {
        if (error === 'no-speech') {
          setShowError('No speech detected. Try again.');
        } else {
          setShowError(`Error: ${error}`);
        }
      },
    });

  const handleFABClick = () => {
    if (!showInput) {
      setShowInput(true);
      setInputValue('');
      setTimeout(() => {
        startListening();
      }, 100);
    }
  };

  const handleSubmit = () => {
    stopListening();
    setInputValue('');
    setShowInput(false);
    setShowError(null);
  };

  const handleCancel = () => {
    stopListening();
    setShowInput(false);
    setInputValue('');
    setShowError(null);
  };

  const handleTypeInput = (text: string) => {
    setInputValue(text);
  };

  if (showInput) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-5 shadow-lg animate-fade-up">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleTypeInput(e.target.value)}
                placeholder="Just talk. Carry figures out the rest."
                className="w-full bg-cream border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                disabled={isListening}
              />
            </div>
            {inputValue && (
              <button
                onClick={handleSubmit}
                className="flex-shrink-0 w-12 h-12 bg-accent text-surface rounded-full flex items-center justify-center hover:bg-accent/90 active:scale-95 transition-all"
                aria-label="Submit"
              >
                <Check size={20} />
              </button>
            )}
            <button
              onClick={handleCancel}
              className="flex-shrink-0 w-12 h-12 bg-border/50 text-text rounded-full flex items-center justify-center hover:bg-border active:scale-95 transition-all"
              aria-label="Cancel"
            >
              <X size={20} />
            </button>
          </div>

          {isListening && (
            <div className="flex items-center gap-2 text-sm text-accent">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span className="font-ui font-light">Listening...</span>
            </div>
          )}

          {showError && (
            <div className="text-sm text-accent/70 font-ui font-light">
              {showError}
            </div>
          )}

          {!isBrowserSupported && (
            <div className="text-sm text-muted font-ui font-light">
              Speech recognition not supported in this browser. Type instead.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 left-0 right-0 flex items-center justify-center gap-4 animate-fade-up stagger-6">
      <span className="text-xs text-muted font-ui font-light">
        {isBrowserSupported ? 'voice' : 'type'}
      </span>
      <button
        onClick={handleFABClick}
        className="relative w-16 h-16 bg-text rounded-full flex items-center justify-center text-surface shadow-lg hover:scale-105 active:scale-95 transition-transform"
        aria-label="Add new item"
      >
        <div className="absolute inset-0 rounded-full bg-text/40 animate-pulse-ring"></div>
        <Mic size={24} />
      </button>
      <span className="text-xs text-muted font-ui font-light">
        {isBrowserSupported ? 'or type' : 'only'}
      </span>
    </div>
  );
}
