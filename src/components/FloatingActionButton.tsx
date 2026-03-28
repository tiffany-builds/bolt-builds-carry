import { useState, useEffect, useRef } from 'react';
import { Mic, Check, X, Menu, Archive, Calendar, Camera } from 'lucide-react';
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
  onItemsAdded?: (items: any[]) => void;
  onSubmitSuccess?: () => void;
  onEverythingClick?: () => void;
  onCalendarClick?: () => void;
  autoOpenFAB?: boolean;
  onAutoOpenComplete?: () => void;
}

export function FloatingActionButton({ userId, onItemsAdded, onSubmitSuccess, onEverythingClick, onCalendarClick, autoOpenFAB, onAutoOpenComplete }: FloatingActionButtonProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recurringConfirmation, setRecurringConfirmation] = useState<{item: any, index: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  async function processInput(inputText: string) {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setLiveTranscript('');
    setInputText('');

    let savedItems: any[] = [];

    try {
      const today = new Date();
      const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
      const dateStr = today.toISOString().split('T')[0];

      const message = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system: `You are Carry, a personal assistant for parents. Today is ${dayName} ${dateStr}.

CATEGORIES — choose exactly one:
- Kids: children's activities, school, childcare, anything specifically about the user's children
- Home: household tasks, cleaning, maintenance, repairs, home admin
- Health: medical appointments, medication, fitness, therapy, anything health-related for ANY family member
- Errands: shopping, pickups, returns, post office, admin tasks outside the home
- Me: personal time, self-care, hobbies, social plans, anything just for the user
- Work: work tasks, meetings, professional projects

BIRTHDAY RULES:
- Child's birthday → Kids
- Own birthday → Me
- Partner/spouse birthday → Me
- Parent/sibling birthday → Me
- Friend's birthday → Me
- Colleague's birthday → Work
- Default if unclear → Me

REMINDER RULES:
- "Remind me to..." → strip the reminder framing, treat as a normal item
- Categorise by what the task actually IS, not that it's a reminder
- "Remind me to call the school" → Kids (calling school is about children)
- "Remind me to take my medication" → Health
- "Remind me to book a haircut" → Me
- If a reminder has a specific time/date, set hasDateTime: true

DATE RULES:
- When user says "Saturday" mean the NEXT upcoming Saturday from today
- Always calculate dates going FORWARD, never backwards
- "Next week" means 7-14 days from today

RECURRING RULES:
- If the user mentions something happening regularly (every day, every week, every Monday etc), add "recurring": true and "recurringPattern": "daily" / "weekly" / "monthly" to the item
- Examples: "football every Monday" → recurring: true, recurringPattern: "weekly"
- "take medication every morning" → recurring: true, recurringPattern: "daily"
- Default is recurring: false

Extract all items from the input and return ONLY a valid JSON array. Each item must have:
- title (max 6 words, no "remind me to" prefix)
- detail (one warm conversational sentence)
- category (exactly one of: Kids, Home, Health, Errands, Me, Work)
- type (event, task, reminder, idea, mind or lookforward)
- date (YYYY-MM-DD or null)
- time (HH:MM or null)
- hasDateTime (true or false)
- recurring (true or false)
- recurringPattern (daily, weekly, monthly or null)

For lookforward items also include: startDate, endDate, targetMonth, excitement.

Return valid JSON only — no explanation, no markdown.`,
        messages: [{ role: 'user', content: inputText }]
      });

      const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedItems = JSON.parse(cleaned);

      if (!Array.isArray(parsedItems)) throw new Error('Response is not an array');

      const newItems = parsedItems.map((item: any) => ({
        title: item.title || 'Untitled',
        description: item.detail || '',
        category: item.category || 'Other',
        completed: false,
        time_frame: 'anytime',
        date: item.date || null,
        time: item.time || null,
        has_date_time: item.hasDateTime || false,
        type: item.type || 'task',
        target_month: item.targetMonth || null,
        start_date: item.startDate || null,
        end_date: item.endDate || null,
        excitement: item.excitement || null,
        recurring: item.recurring || false,
        recurring_pattern: item.recurringPattern || null,
      }));

      // Check for recurring items
      const hasRecurring = newItems.some((item: any) => item.recurring);

      // Save to Supabase and get real items back
      savedItems = [];

      if (userId) {
        for (const item of newItems) {
          try {
            const { data: inserted } = await supabase.from('items').insert({
              user_id: userId,
              title: item.title,
              description: item.description,
              category: item.category,
              completed: false,
              time_frame: 'anytime',
              date: item.type === 'lookforward' ? item.start_date : item.date,
              time: item.time,
              has_date_time: item.type === 'lookforward' ? true : item.has_date_time,
              type: item.type,
              target_month: item.target_month,
              start_date: item.start_date,
              end_date: item.end_date,
              excitement: item.excitement,
            }).select().single();

            if (inserted) {
              savedItems.push(inserted);
            } else {
              savedItems.push({ ...item, id: crypto.randomUUID(), created_at: new Date().toISOString(), user_id: userId });
            }
          } catch (saveErr) {
            console.log('Item save failed but kept locally:', saveErr);
            savedItems.push({ ...item, id: crypto.randomUUID(), created_at: new Date().toISOString(), user_id: userId });
          }
        }
      } else {
        savedItems.push(...newItems.map(item => ({ ...item, id: crypto.randomUUID(), created_at: new Date().toISOString() })));
      }

      // Update state with real items (no temp IDs)
      if (onItemsAdded) {
        onItemsAdded(savedItems);
      }

      // Show appropriate toast
      if (hasRecurring) {
        setRecurringConfirmation({ item: newItems.find((i: any) => i.recurring), index: 0 });
      } else {
        showToast('Got it — added to Carry');
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('processInput error:', message);
      showToast("Didn't quite catch that — want to try again?");
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
          showToast("Didn't quite catch that — want to try again?");
        } else {
          showToast("Didn't quite catch that — want to try again?");
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
    if (!textToSubmit.trim()) return;
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

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setShowInput(false);

    let savedItems: any[] = [];

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });

      const today = new Date();
      const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
      const dateStr = today.toISOString().split('T')[0];

      const message = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system: `You are Carry, a personal assistant for parents. Today is ${dayName} ${dateStr}.

Extract all actionable information from this image — events, appointments, tasks, dates, times, deadlines.

CATEGORIES — choose exactly one:
- Kids: children's activities, school letters, sports, childcare
- Home: household tasks, maintenance, deliveries
- Health: medical, dental, prescriptions, fitness
- Errands: shopping lists, returns, admin
- Me: personal events, social plans, self-care
- Work: work events, meetings, deadlines

For each item found return a JSON object with:
- title (max 6 words, clear and specific)
- detail (one warm sentence describing what it is)
- category (exactly one of the 6 above)
- type (event, task, reminder, or lookforward)
- date (YYYY-MM-DD if found, otherwise null)
- time (HH:MM if found, otherwise null)
- hasDateTime (true if date or time found)

If the image contains no actionable information, return an empty array [].
Return valid JSON array only — no explanation, no markdown.`,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64,
              }
            },
            {
              type: 'text',
              text: 'What actionable items can you find in this image?'
            }
          ]
        }]
      });

      const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedItems = JSON.parse(cleaned);

      if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
        showToast("Nothing to add from that one — try another photo.");
        return;
      }

      const newItems = parsedItems.map((item: any) => ({
        title: item.title || 'Untitled',
        description: item.detail || '',
        category: item.category || 'Errands',
        completed: false,
        time_frame: 'anytime',
        date: item.date || null,
        time: item.time || null,
        has_date_time: item.hasDateTime || false,
        type: item.type || 'task',
        target_month: item.targetMonth || null,
        start_date: item.startDate || null,
        end_date: item.endDate || null,
        excitement: item.excitement || null,
      }));

      showToast(`Found ${newItems.length} thing${newItems.length > 1 ? 's' : ''} in that photo`);

      // Save to Supabase
      savedItems = [];
      if (userId) {
        for (const item of newItems) {
          try {
            const { data: inserted } = await supabase.from('items').insert({
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
            }).select().single();

            if (inserted) savedItems.push(inserted);
            else savedItems.push({ ...item, id: crypto.randomUUID(), created_at: new Date().toISOString(), user_id: userId });
          } catch {
            savedItems.push({ ...item, id: crypto.randomUUID(), created_at: new Date().toISOString(), user_id: userId });
          }
        }
      }

      if (onItemsAdded) onItemsAdded(savedItems);

    } catch (err) {
      console.error('Photo processing error:', err);
      showToast("Couldn't read that photo — want to try again?");
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (autoOpenFAB) {
      const timer = setTimeout(() => {
        handleFABClick();
        onAutoOpenComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoOpenFAB]);

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
                  placeholder={autoOpenFAB ? "What's on your plate this week?" : "Just talk. Carry figures out the rest."}
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
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || isListening}
                className="flex-shrink-0 w-12 h-12 bg-surface border-2 border-accent text-accent rounded-full flex items-center justify-center hover:bg-accent hover:text-surface active:scale-95 transition-all disabled:opacity-50"
                aria-label="Add photo"
              >
                <Camera size={20} />
              </button>
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex-shrink-0 w-12 h-12 bg-border/50 text-text rounded-full flex items-center justify-center hover:bg-border active:scale-95 transition-all disabled:opacity-50"
                aria-label="Cancel"
              >
                <X size={20} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handlePhotoCapture}
            />

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

  const handleRecurringYes = async () => {
    if (recurringConfirmation && userId) {
      // The item is already saved with recurring field, just acknowledge
      showToast('Got it — added to Carry');
    }
    setRecurringConfirmation(null);
  };

  const handleRecurringNo = async () => {
    if (recurringConfirmation && userId) {
      // Remove recurring flag from the saved item
      const savedItem = savedItems.find((i: any) => i.title === recurringConfirmation.item.title);
      if (savedItem) {
        await supabase
          .from('items')
          .update({ recurring: false, recurring_pattern: null })
          .eq('id', savedItem.id);
      }
      showToast('Got it — added to Carry');
    }
    setRecurringConfirmation(null);
  };

  return (
    <>
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {recurringConfirmation && (
        <div className="fixed inset-0 bg-text/20 z-50 flex items-end justify-center animate-fade-up">
          <div className="bg-surface rounded-t-3xl w-full max-w-2xl p-6 space-y-4 shadow-lg" style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}>
            <p className="font-ui text-text text-center">
              Sounds like this happens regularly — want me to remember that?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRecurringYes}
                className="flex-1 bg-accent text-surface rounded-xl py-3 font-ui font-medium hover:bg-accent/90 transition-all active:scale-95"
              >
                Yes, add {recurringConfirmation.item.recurring_pattern}
              </button>
              <button
                onClick={handleRecurringNo}
                className="flex-1 bg-surface border border-border text-text rounded-xl py-3 font-ui font-medium hover:border-accent/30 transition-all active:scale-95"
              >
                Just this once
              </button>
            </div>
          </div>
        </div>
      )}

      {showMenu && (
        <div className="fixed inset-0 bg-text/20 z-40 animate-fade-up" onClick={() => setShowMenu(false)}>
          <div className="fixed right-8 bg-surface rounded-2xl border border-border shadow-lg p-2 space-y-1 animate-fade-up" style={{ bottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 4.5rem))' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onCalendarClick?.();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cream transition-all text-left"
            >
              <Calendar className="w-5 h-5 text-muted" />
              <span className="font-ui text-text">Calendar</span>
            </button>
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
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (userId) {
                  localStorage.removeItem(`carry_onboarded_${userId}`);
                  localStorage.removeItem(`carry_name_${userId}`);
                  await supabase
                    .from('profiles')
                    .update({ onboarding_complete: false })
                    .eq('id', userId);
                }
                window.location.reload();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cream transition-all text-left"
            >
              <X className="w-5 h-5 text-muted" />
              <span className="font-ui text-text">Reset & re-onboard</span>
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
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 bg-surface border border-border rounded-full flex items-center justify-center hover:border-accent/30 active:scale-95 transition-all"
            aria-label="Camera"
          >
            <Camera size={18} className="text-muted" />
          </button>
          <button
            onClick={handleFABClick}
            className={`relative w-16 h-16 bg-text rounded-full flex items-center justify-center text-surface shadow-lg hover:scale-105 active:scale-95 transition-transform ${isListening ? 'scale-110' : ''}`}
            aria-label="Add new item"
          >
            <div className={`absolute inset-0 rounded-full bg-text/40 ${isListening ? 'animate-ping' : 'animate-pulse-ring'}`}></div>
            <Mic size={24} />
          </button>
          <span className="text-xs text-muted font-ui font-light">
            {isBrowserSupported ? 'or type' : 'type'}
          </span>
        </div>

        <div className="w-10"></div>
      </div>
    </>
  );
}
