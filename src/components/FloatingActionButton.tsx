import { useState } from 'react';
import { Mic, Check, X, Menu, Archive } from 'lucide-react';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';
import { Toast } from './Toast';

interface FloatingActionButtonProps {
  userId: string | null;
  userCategories: string[];
  onSubmitSuccess?: () => void;
  onEverythingClick?: () => void;
}

export function FloatingActionButton({ userId, userCategories, onSubmitSuccess, onEverythingClick }: FloatingActionButtonProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [showError, setShowError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTranscript = (text: string) => {
    setInputValue(text);
    setInterimTranscript('');
    handleSubmit(text);
  };

  const handleInterimTranscript = (text: string) => {
    setInterimTranscript(text);
  };

  const { isListening, isBrowserSupported, startListening, stopListening } =
    useSpeechRecognition({
      onTranscript: handleTranscript,
      onInterimTranscript: handleInterimTranscript,
      onStart: () => {
        setShowError(null);
        setShowSuccess(null);
      },
      onError: (error) => {
        if (error === 'no-speech') {
          setShowError("Carry couldn't quite catch that — want to try again?");
        } else {
          setShowError("Carry couldn't quite catch that — want to try again?");
        }
      },
    });

  const handleFABClick = () => {
    console.log("FAB clicked - isBrowserSupported:", isBrowserSupported);
    if (!showInput) {
      setShowInput(true);
      setInputValue('');
      setInterimTranscript('');
      if (isBrowserSupported) {
        console.log("Starting listening immediately...");
        startListening();
      } else {
        console.log("Browser not supported - text input only");
      }
    }
  };

  const handleSubmit = async (text?: string) => {
    const textToSubmit = text || inputValue;
    console.log("9. handleSubmit called with:", textToSubmit);

    if (!textToSubmit.trim() || !userId) {
      console.log("10. Submission blocked - empty text or no userId");
      return;
    }

    setIsSubmitting(true);
    setShowError(null);
    setShowSuccess(null);

    try {
      console.log("11. Loading categorization hook...");
      const { useItemCategorization } = await import('../hooks/useItemCategorization');
      const { categorizeAndCreateItems } = useItemCategorization();

      console.log("12. Calling categorizeAndCreateItems...");
      const createdItems = await categorizeAndCreateItems(textToSubmit, userId, userCategories);
      console.log("13. Items returned from categorization:", createdItems);

      stopListening();
      setInputValue('');
      setInterimTranscript('');

      if (createdItems && createdItems.length > 0) {
        const categories = [...new Set(createdItems.map(item => item.category))];
        let message: string;
        if (categories.length === 1) {
          message = `Got it — added to ${categories[0]}`;
        } else {
          message = `Got it — added ${createdItems.length} items`;
        }
        console.log("14. Setting toast message:", message);
        setToastMessage(message);
      }

      setShowInput(false);
      console.log("15. Calling onSubmitSuccess to refresh items...");
      console.log("15a. Time before refresh:", new Date().toISOString());
      onSubmitSuccess?.();
      console.log("15b. Time after refresh call:", new Date().toISOString());
      console.log("16. Process complete!");
    } catch (err) {
      console.error("ERROR in handleSubmit:", err);
      setShowError("Carry couldn't quite catch that — want to try again?");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    stopListening();
    setShowInput(false);
    setInputValue('');
    setInterimTranscript('');
    setShowError(null);
    setShowSuccess(null);
  };

  const handleTypeInput = (text: string) => {
    setInputValue(text);
  };

  if (showInput) {
    return (
      <>
        {(isListening || interimTranscript || isSubmitting) && (
          <div className="fixed left-1/2 -translate-x-1/2 bg-surface border border-border rounded-2xl px-6 py-4 shadow-lg animate-fade-up max-w-sm" style={{ bottom: 'max(10rem, calc(env(safe-area-inset-bottom) + 8.5rem))' }}>
            <div className="font-ui text-sm">
              {isSubmitting ? (
                <div className="flex items-center gap-2 text-muted">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span>Processing...</span>
                </div>
              ) : isListening && !interimTranscript ? (
                <div className="flex items-center gap-2 text-accent">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span>Listening...</span>
                </div>
              ) : (
                <span className="text-text">{interimTranscript}</span>
              )}
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-5 shadow-lg animate-fade-up" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleTypeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      handleSubmit();
                    }
                  }}
                  placeholder="Just talk. Carry figures out the rest."
                  className="w-full bg-cream border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                  disabled={isListening || isSubmitting}
                  autoFocus={!isBrowserSupported}
                />
              </div>
              {inputValue && !isListening && (
                <button
                  onClick={() => handleSubmit()}
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
                disabled={isSubmitting}
                className="flex-shrink-0 w-12 h-12 bg-border/50 text-text rounded-full flex items-center justify-center hover:bg-border active:scale-95 transition-all disabled:opacity-50"
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
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

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
            className={`relative w-16 h-16 bg-text rounded-full flex items-center justify-center text-surface shadow-lg hover:scale-105 active:scale-95 transition-transform ${isListening ? 'scale-110' : ''}`}
            aria-label="Add new item"
          >
            <div className={`absolute inset-0 rounded-full bg-text/40 ${isListening ? 'animate-ping' : 'animate-pulse-ring'}`}></div>
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
