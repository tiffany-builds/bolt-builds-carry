import { useState } from 'react';
import { Mic, Check, X, Menu, Archive } from 'lucide-react';
import Anthropic from '@anthropic-ai/sdk';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';
import { Toast } from './Toast';
import { supabase } from '../lib/supabase';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

interface FloatingActionButtonProps {
  userId: string | null;
  userCategories: string[];
  onItemsAdded?: (items: any[]) => void;
  onSubmitSuccess?: () => void;
  onEverythingClick?: () => void;
}

export function FloatingActionButton({ userId, userCategories, onItemsAdded, onSubmitSuccess, onEverythingClick }: FloatingActionButtonProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  async function processInput(inputText: string) {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setLiveTranscript('');
    setInputText('');

    try {
      const today = new Date();
      const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
      const dateStr = today.toISOString().split('T')[0];
      const categoryList = userCategories.length > 0
        ? userCategories.join(', ')
        : 'Kids, Household, Health, Errands, Me, Ideas, Work, Projects';

      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are Carry, a personal assistant for parents. Today is ${dayName} ${dateStr}. The user has these categories: ${categoryList}. Extract all items from the input and return ONLY a valid JSON array. Each item must have: title (max 6 words), detail (one sentence), category (must be one of: ${categoryList}), type (event, task, reminder, idea, mind or lookforward). If a date or time is mentioned include date (YYYY-MM-DD), time (HH:MM), hasDateTime: true. For lookforward items include startDate, endDate, targetMonth, excitement. Return valid JSON only — no explanation, no markdown.`,
        messages: [{ role: 'user', content: inputText }]
      });

      const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedItems = JSON.parse(cleaned);

      if (!Array.isArray(parsedItems)) throw new Error('Response is not an array');

      const newItems = parsedItems.map((item: any) => ({
        id: crypto.randomUUID(),
        title: item.title || 'Untitled',
        description: item.detail || '',
        category: item.category || 'Other',
        completed: false,
        time_frame: 'anytime',
        created_at: new Date().toISOString(),
        date: item.date || null,
        time: item.time || null,
        has_date_time: item.hasDateTime || false,
        type: item.type || 'task',
        target_month: item.targetMonth || null,
        start_date: item.startDate || null,
        end_date: item.endDate || null,
        excitement: item.excitement || null,
      }));

      if (onItemsAdded) {
        onItemsAdded(newItems);
      }

      showToast(`✓ Got it — added ${newItems.length} thing${newItems.length > 1 ? 's' : ''} to Carry`);

      if (userId) {
        for (const item of newItems) {
          try {
            await supabase.from('items').insert({
              user_id: userId,
              title: item.title,
              description: item.description,
              category: item.category,
              completed: false,
              time_frame: 'anytime',
              date: item.date,
              time: item.time,
              has_date_time: item.has_date_time,
              type: item.type,
              target_month: item.target_month,
              start_date: item.start_date,
              end_date: item.end_date,
              excitement: item.excitement,
            });
          } catch (saveErr) {
            console.log('Item save to Supabase failed but kept locally:', saveErr);
          }
        }
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      }

    } catch (err) {
      console.error('processInput error:', err);
      showToast("Carry couldn't quite catch that — want to try again?");
    } finally {
      setIsProcessing(false);
      setShowInput(false);
    }
  }

  const handleTranscript = (text: string) => {
    setInputText(text);
    setLiveTranscript('');
    processInput(text);
  };

  const handleInterimTranscript = (text: string) => {
    setLiveTranscript(text);
  };

  const { isListening, isBrowserSupported, startListening, stopListening } =
    useSpeechRecognition({
      onTranscript: handleTranscript,
      onInterimTranscript: handleInterimTranscript,
      onStart: () => {},
      onError: (error) => {
        if (error === 'no-speech') {
          showToast("Carry couldn't quite catch that — want to try again?");
        } else {
          showToast("Carry couldn't quite catch that — want to try again?");
        }
      },
    });

  const handleFABClick = () => {
    if (!showInput) {
      setShowInput(true);
      setInputText('');
      setLiveTranscript('');
      if (isBrowserSupported) {
        startListening();
      }
    }
  };

  const handleSubmit = async (text?: string) => {
    const textToSubmit = text || inputText;
    if (!textToSubmit.trim() || !userId) {
      return;
    }
    await processInput(textToSubmit);
  };

  const handleCancel = () => {
    stopListening();
    setShowInput(false);
    setInputText('');
    setLiveTranscript('');
  };

  const handleTypeInput = (text: string) => {
    setInputText(text);
  };

  if (showInput) {
    return (
      <>
        {(isListening || liveTranscript || isProcessing) && (
          <div className="fixed left-1/2 -translate-x-1/2 bg-surface border border-border rounded-2xl px-6 py-4 shadow-lg animate-fade-up max-w-sm" style={{ bottom: 'max(10rem, calc(env(safe-area-inset-bottom) + 8.5rem))' }}>
            <div className="font-ui text-sm">
              {isProcessing ? (
                <div className="flex items-center gap-2 text-muted">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span>Processing...</span>
                </div>
              ) : isListening && !liveTranscript ? (
                <div className="flex items-center gap-2 text-accent">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span>Listening...</span>
                </div>
              ) : (
                <span className="text-text">{liveTranscript}</span>
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
                  value={inputText}
                  onChange={(e) => handleTypeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputText.trim()) {
                      handleSubmit();
                    }
                  }}
                  placeholder="Just talk. Carry figures out the rest."
                  className="w-full bg-cream border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                  disabled={isListening || isProcessing}
                  autoFocus={!isBrowserSupported}
                />
              </div>
              {inputText && !isListening && (
                <button
                  onClick={() => handleSubmit()}
                  disabled={isProcessing}
                  className="flex-shrink-0 w-12 h-12 bg-accent text-surface rounded-full flex items-center justify-center hover:bg-accent/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Submit"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check size={20} />
                  )}
                </button>
              )}
              <button
                onClick={handleCancel}
                disabled={isProcessing}
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
