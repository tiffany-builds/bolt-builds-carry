import { useState } from 'react';
import { Check, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '../../utils/useSpeechRecognition';
import { useItemCategorization } from '../../hooks/useItemCategorization';
import { getCategoryColor } from '../../utils/categoryColors';

interface IntakeFlowProps {
  userName: string;
  userId: string;
  userCategories: string[];
  onComplete: () => void;
}

interface DisplayItem {
  title: string;
  description?: string;
  category: string;
  timeFrame: string;
}

export function IntakeFlow({
  userName,
  userId,
  userCategories,
  onComplete,
}: IntakeFlowProps) {
  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState<string | null>(null);
  const [categorizedItems, setCategorizedItems] = useState<DisplayItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { categorizeAndCreateItems } = useItemCategorization();

  const handleTranscript = (text: string) => {
    setInputValue(text);
  };

  const { isListening, isBrowserSupported, startListening, stopListening } =
    useSpeechRecognition({
      onTranscript: handleTranscript,
      onStart: () => setShowError(null),
      onError: (error) => {
        if (error !== 'no-speech') {
          setShowError(`Voice input error: ${error}`);
        }
      },
    });

  const handleStartListening = () => {
    setShowError(null);
    startListening();
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    stopListening();
    setIsProcessing(true);
    setShowError(null);

    try {
      const items = await categorizeAndCreateItems(
        inputValue,
        userId,
        userCategories
      );

      const displayItems = items.map((item: any) => ({
        title: item.title,
        description: item.description,
        category: item.category,
        timeFrame: item.time_frame,
      }));

      setCategorizedItems(displayItems);
      setIsSubmitted(true);
    } catch (err) {
      setShowError(
        err instanceof Error ? err.message : 'Failed to categorize items'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddMore = () => {
    setInputValue('');
    setCategorizedItems([]);
    setIsSubmitted(false);
    setShowError(null);
  };

  if (isSubmitted && categorizedItems.length > 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col px-5 py-8">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          <div className="space-y-2 mb-8">
            <h1 className="font-display italic text-3xl font-light text-text leading-tight">
              Here's what we captured
            </h1>
            <p className="font-ui text-base text-muted font-light">
              We organized {categorizedItems.length} item
              {categorizedItems.length !== 1 ? 's' : ''} across your boxes.
            </p>
          </div>

          <div className="space-y-3 flex-1">
            {categorizedItems.map((item, index) => (
              <div
                key={index}
                className="bg-surface rounded-xl p-4 border border-border"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-ui font-medium text-text">{item.title}</h3>
                  <span
                    className="text-xs font-ui font-medium px-2 py-1 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: getCategoryColor(item.category) + '20',
                      color: getCategoryColor(item.category),
                    }}
                  >
                    {item.category}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-muted font-ui font-light mb-2">
                    {item.description}
                  </p>
                )}
                <p className="text-xs text-muted/60 font-ui capitalize">
                  {item.timeFrame.replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3 mt-8">
            <button
              onClick={onComplete}
              className="w-full bg-accent text-surface rounded-xl py-3 font-ui font-medium hover:bg-accent/90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Done
            </button>

            <button
              onClick={handleAddMore}
              className="w-full bg-surface border border-border rounded-xl py-3 font-ui font-medium text-text hover:border-accent/30 active:scale-95 transition-all"
            >
              Add more items
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col px-5 py-8">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="space-y-2 mb-8">
          <h1 className="font-display italic text-3xl font-light text-text leading-tight">
            What's on your mind?
          </h1>
          <p className="font-ui text-base text-muted font-light">
            Hi {userName}! Tell me what you need to do today, this week, or in
            the future. I'll organize it all for you.
          </p>
        </div>

        <div className="space-y-4 flex-1">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="E.g., 'Make lasagna for dinner, drop kids at school tomorrow morning, thinking about a trip to Paris, need to return a package...'"
            className="w-full h-40 bg-surface border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted/60 focus:outline-none focus:border-accent/50 transition-colors resize-none"
            disabled={isListening}
          />

          {isBrowserSupported && (
            <button
              onClick={isListening ? stopListening : handleStartListening}
              disabled={isProcessing}
              className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 transition-all ${
                isListening
                  ? 'bg-accent text-surface hover:bg-accent/90'
                  : 'bg-surface border border-border text-muted hover:border-accent/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              <span className="font-ui font-light">
                {isListening ? 'Stop listening' : 'Or speak instead'}
              </span>
            </button>
          )}

          {showError && (
            <div className="text-sm text-accent/70 font-ui font-light text-center bg-accent/10 rounded-lg py-2 px-3">
              {showError}
            </div>
          )}
        </div>

        <div className="space-y-3 mt-8">
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isProcessing}
            className="w-full bg-accent text-surface rounded-xl py-3 font-ui font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                <span>Organizing...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Organize for me</span>
              </>
            )}
          </button>

          <button
            onClick={onComplete}
            disabled={isProcessing}
            className="w-full bg-surface border border-border rounded-xl py-3 font-ui font-medium text-text hover:border-accent/30 active:scale-95 transition-all disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
