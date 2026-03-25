import { useState } from 'react';
import { Mic, Check, X, Menu, Archive } from 'lucide-react';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';

interface FloatingActionButtonProps {
  userId: string | null;
  userCategories: string[];
  onSubmitSuccess?: () => void;
  onEverythingClick?: () => void;
}

export function FloatingActionButton({ userId, userCategories, onSubmitSuccess, onEverythingClick }: FloatingActionButtonProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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

  const handleSubmit = async () => {
    if (!inputValue.trim() || !userId) return;

    setIsSubmitting(true);
    setShowError(null);

    try {
      const { useItemCategorization } = await import('../hooks/useItemCategorization');
      const { categorizeAndCreateItems } = useItemCategorization();

      await categorizeAndCreateItems(inputValue, userId, userCategories);

      stopListening();
      setInputValue('');
      setShowInput(false);
      onSubmitSuccess?.();
    } catch (err) {
      setShowError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-5 shadow-lg animate-fade-up" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
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
                disabled={isSubmitting}
                className="flex-shrink-0 w-12 h-12 bg-accent text-surface rounded-full flex items-center justify-center hover:bg-accent/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Submit"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check size={20} />
                )}
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
    <>
      {showMenu && (
        <div className="fixed inset-0 bg-text/20 z-40 animate-fade-up" onClick={() => setShowMenu(false)}>
          <div className="fixed right-8 bg-surface rounded-2xl border border-border shadow-lg p-2 space-y-1 animate-fade-up" style={{ bottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 4.5rem))' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onEverythingClick?.();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cream transition-all text-left"
            >
              <Archive className="w-5 h-5 text-muted" />
              <span className="font-ui text-text">Everything you Carry</span>
            </button>
          </div>
        </div>
      )}

      <div className="fixed left-0 right-0 flex items-center justify-center gap-4 animate-fade-up stagger-6" style={{ bottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-10 h-10 bg-surface border border-border rounded-full flex items-center justify-center hover:border-accent/30 active:scale-95 transition-all"
          aria-label="Menu"
        >
          <Menu size={18} className="text-muted" />
        </button>

        <div className="flex items-center gap-4">
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

        <div className="w-10"></div>
      </div>
    </>
  );
}
