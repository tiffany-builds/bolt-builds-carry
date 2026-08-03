import { useState, useEffect, useRef } from 'react';
import { Mic, Check, X, ImageUp, Keyboard } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';
import { Toast } from './Toast';
import { supabase } from '../lib/supabase';
import { buildSystemPrompt } from '../utils/buildSystemPrompt';
import { addItemToCalendar } from '../utils/calendar';
import { logCycleStart, isCycleTrackingEnabled, enableCycleTracking, scheduleCycleReminder } from '../utils/cycleTracking';

async function haptic(style: ImpactStyle) {
  try { await Haptics.impact({ style }); } catch {}
}

interface FloatingActionButtonProps {
  userId: string | null;
  caringFor?: string[];
  onItemsAdded?: (items: any[]) => void;
  onSubmitSuccess?: () => void;
  autoOpenFAB?: boolean;
  onAutoOpenComplete?: () => void;
  calendarPermission?: boolean;
}

export function FloatingActionButton({ userId, caringFor, onItemsAdded, onSubmitSuccess, autoOpenFAB, onAutoOpenComplete, calendarPermission }: FloatingActionButtonProps) {
  const [showInput, setShowInput] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recurringConfirmation, setRecurringConfirmation] = useState<{item: any, index: number} | null>(null);
  const [pendingItems, setPendingItems] = useState<{ recurring: any[], nonRecurring: any[] } | null>(null);
  const [calendarPrompt, setCalendarPrompt] = useState<any | null>(null);
  const [cycleTrackingPrompt, setCycleTrackingPrompt] = useState(false);
  const [pendingCycleLog, setPendingCycleLog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  function buildOptimisticItems(text: string): any[] {
    const words = text.trim().split(/\s+/);
    const title = words.slice(0, 6).join(' ');
    const now = Date.now();
    return [{
      id: `optimistic-${now}-0`,
      title,
      description: null,
      category: 'Me',
      emoji: '⏳',
      completed: false,
      type: 'task',
      date: null,
      time: null,
      has_date_time: false,
      isOptimistic: true,
    }];
  }

  function removeOptimisticItems() {
    if (onItemsAdded) {
      // Signal removal by passing an empty replacement — useItems will strip optimistic ids
      onItemsAdded([]);
    }
  }

  async function processInput(inputText: string) {
    if (!inputText.trim()) return;

    // 1. Show optimistic placeholder immediately and close the panel
    const optimisticItems = buildOptimisticItems(inputText);
    if (onItemsAdded) onItemsAdded(optimisticItems);
    setShowInput(false);
    setShowTextInput(false);
    setLiveTranscript('');
    setInputText('');

    let savedItems: any[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const systemPrompt = buildSystemPrompt({ caringFor, includeRecurring: true });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/categorize-items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            text: inputText,
            systemPrompt: systemPrompt,
          }),
        }
      );

      const responseData = await response.json();
      if (responseData.error) throw new Error(responseData.error);
      const rawResult = responseData.result || responseData.items || '';
      if (!rawResult) throw new Error('Empty response from function');

      const cleaned = rawResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedItems = JSON.parse(cleaned);

      if (!Array.isArray(parsedItems)) throw new Error('Response is not an array');

      const newItems = parsedItems.map((item: any) => ({
        title: item.title || 'Untitled',
        description: item.detail || '',
        category: item.category || 'Other',
        emoji: item.emoji || null,
        completed: false,
        time_frame: 'anytime',
        date: item.date || null,
        time: item.recurringTime || item.time || null,
        has_date_time: item.recurring ? true : (item.hasDateTime || false),
        type: item.type || 'task',
        target_month: item.targetMonth || null,
        start_date: item.startDate || null,
        end_date: item.endDate || null,
        excitement: item.excitement || null,
        recurring: item.recurring || false,
        recurring_pattern: item.recurringPattern || null,
        recurring_day_of_week: item.recurringDayOfWeek ?? null,
        isCycleLog: item.isCycleLog || false,
      }));

      const recurringItems = newItems.filter((item: any) => item.recurring);
      const nonRecurringItems = newItems.filter((item: any) => !item.recurring);

      // Save non-recurring items
      savedItems = [];
      if (userId) {
        for (const item of nonRecurringItems) {
          const supabaseItem = {
            user_id: userId,
            title: item.title,
            description: item.description,
            category: item.category,
            emoji: item.emoji || null,
            completed: false,
            time_frame: 'anytime',
            date: item.type === 'lookforward'
              ? (item.start_date || item.date)
              : (item.date || null),
            time: item.time || null,
            has_date_time: item.type === 'lookforward' ? true : (item.has_date_time || false),
            type: item.type,
            recurring: false,
            recurring_pattern: null,
            recurring_day_of_week: null,
            target_month: item.target_month || null,
            start_date: item.start_date || null,
            end_date: item.end_date || null,
            excitement: item.excitement || null,
          };

          const { data: inserted, error: insertError } = await supabase.from('items').insert(supabaseItem).select().single();
          if (insertError || !inserted) {
            await Haptics.notification({ type: NotificationType.Error });
            showToast("Couldn't save — please try again");
            continue;
          }
          savedItems.push(inserted);
          if (inserted.date && inserted.time) {
            setCalendarPrompt(inserted);
          }
        }
      }

      for (const parsedItem of parsedItems) {
        if (parsedItem.isCycleLog && userId) {
          const isTracking = await isCycleTrackingEnabled(userId);
          if (isTracking) {
            await logCycleStart(userId);
            await scheduleCycleReminder(userId);
          } else {
            setPendingCycleLog(true);
            setCycleTrackingPrompt(true);
          }
        }
      }

      // 3. Replace optimistic items with real ones
      if (onItemsAdded) onItemsAdded(savedItems);

      if (recurringItems.length > 0) {
        setPendingItems({ recurring: recurringItems, nonRecurring: [] });
        setRecurringConfirmation({ item: recurringItems[0], index: 0 });
      } else if (savedItems.length > 0) {
        await Haptics.notification({ type: NotificationType.Success });
        showToast('Got it — added to Carry');
      }

    } catch (err) {
      // 4. Remove optimistic items on failure and show error
      removeOptimisticItems();
      showToast("Couldn't save — please try again");
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
      haptic(ImpactStyle.Medium);
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
    setShowTextInput(false);
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
    setShowTextInput(false);

    let savedItems: any[] = [];

    try {
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
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const photoSystemPrompt = `You are Carry, a personal assistant. Today is ${dayName} ${dateStr}.
Extract all actionable information from this image — it may be a photo, screenshot, confirmation email, booking, reservation, WhatsApp message, or any other content containing dates, times, appointments or tasks.

CATEGORIES — choose exactly one:
- Family: children's activities, school letters, sports, childcare, pets
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
- emoji (most specific contextual emoji)

If the image contains no actionable information, return an empty array [].
Return valid JSON array only — no explanation, no markdown.`;

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/categorize-items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            text: 'What actionable items can you find in this image?',
            systemPrompt: photoSystemPrompt,
            imageBase64: base64,
            imageType: file.type,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Function error: ${errText}`);
      }

      const { result, error: fnError } = await response.json();
      if (fnError) throw new Error(fnError);

      const rawText = result;
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

      savedItems = [];
      if (userId) {
        for (const item of newItems) {
          const supabaseItem = {
            user_id: userId,
            title: item.title,
            description: item.description,
            category: item.category,
            emoji: item.emoji || null,
            completed: false,
            time_frame: 'anytime',
            date: item.type === 'lookforward'
              ? (item.start_date || item.date)
              : (item.date || null),
            time: item.time || null,
            has_date_time: item.type === 'lookforward' ? true : (item.has_date_time || false),
            type: item.type,
            recurring: false,
            recurring_pattern: null,
            recurring_day_of_week: null,
            target_month: item.target_month || null,
            start_date: item.start_date || null,
            end_date: item.end_date || null,
            excitement: item.excitement || null,
          };

          const { data: inserted, error: insertError } = await supabase.from('items').insert(supabaseItem).select().single();
          if (insertError || !inserted) {
            await Haptics.notification({ type: NotificationType.Error });
            showToast("Couldn't save — please try again");
            continue;
          }
          savedItems.push(inserted);
          if (inserted.date && inserted.time && !calendarPrompt) {
            setCalendarPrompt(inserted);
          }
        }
      }

      if (savedItems.length > 0 && onItemsAdded) onItemsAdded(savedItems);

    } catch (err) {
      showToast("Couldn't read that photo — want to try again?");
    } finally {
      setIsProcessing(false);
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

  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={handlePhotoCapture}
    />
  );

  if (showInput || showTextInput) {
    return (
      <>
        {hiddenFileInput}
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
                  <span>Listening — say everything, tap stop when done</span>
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
                  placeholder="Tell me everything on your plate — dates, times, whatever comes to mind."
                  className="w-full bg-cream border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                  disabled={isListening || isProcessing}
                  autoFocus={showTextInput || !isBrowserSupported}
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
                disabled={isProcessing}
                className="flex-shrink-0 w-12 h-12 bg-surface border-2 border-accent text-accent rounded-full flex items-center justify-center hover:bg-accent hover:text-surface active:scale-95 transition-all disabled:opacity-50"
                aria-label="Add photo"
              >
                <ImageUp size={20} />
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

            {isListening && (
              <button
                onClick={() => {
                  haptic(ImpactStyle.Heavy);
                  stopListening();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent font-ui text-sm font-medium transition-all active:scale-95"
              >
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                Tap to stop
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // TODO: Handle expiry extension when user taps notification
  const handleRecurringYes = async () => {
    if (!pendingItems || !userId) {
      setRecurringConfirmation(null);
      setPendingItems(null);
      return;
    }
    const savedItems: any[] = [];
    for (const item of pendingItems.recurring) {
      const supabaseItem = {
        user_id: userId,
        title: item.title,
        description: item.description,
        category: item.category,
        emoji: item.emoji || null,
        completed: false,
        time_frame: 'anytime',
        date: item.date || null,
        time: item.time || null,
        has_date_time: item.has_date_time || true,
        type: item.type,
        recurring: true,
        recurring_pattern: item.recurring_pattern || null,
        recurring_day_of_week: item.recurring_day_of_week ?? null,
        target_month: item.target_month || null,
        start_date: item.start_date || null,
        end_date: item.end_date || null,
        excitement: item.excitement || null,
      };
      const { data: inserted, error: insertError } = await supabase.from('items').insert(supabaseItem).select().single();
      if (insertError || !inserted) {
        showToast("Couldn't save — please try again");
        continue;
      }
      savedItems.push(inserted);
    }
    if (savedItems.length > 0) {
      if (onItemsAdded) onItemsAdded(savedItems);
      showToast('Got it — added to Carry');
    }
    setRecurringConfirmation(null);
    setPendingItems(null);
  };

  const handleRecurringNo = async () => {
    if (!pendingItems || !userId) {
      setRecurringConfirmation(null);
      setPendingItems(null);
      return;
    }
    const savedItems: any[] = [];
    for (const item of pendingItems.recurring) {
      const supabaseItem = {
        user_id: userId,
        title: item.title,
        description: item.description,
        category: item.category,
        emoji: item.emoji || null,
        completed: false,
        time_frame: 'anytime',
        date: item.date || null,
        time: item.time || null,
        has_date_time: item.has_date_time || false,
        type: item.type,
        recurring: false,
        recurring_pattern: null,
        recurring_day_of_week: null,
        target_month: item.target_month || null,
        start_date: item.start_date || null,
        end_date: item.end_date || null,
        excitement: item.excitement || null,
      };
      const { data: inserted, error: insertError } = await supabase.from('items').insert(supabaseItem).select().single();
      if (insertError || !inserted) {
        showToast("Couldn't save — please try again");
        continue;
      }
      savedItems.push(inserted);
    }
    if (savedItems.length > 0) {
      if (onItemsAdded) onItemsAdded(savedItems);
      showToast('Got it — added to Carry');
    }
    setRecurringConfirmation(null);
    setPendingItems(null);
  };

  return (
    <>
      {hiddenFileInput}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {calendarPrompt && (
        <div className="fixed inset-0 bg-text/20 z-50 flex items-end justify-center animate-fade-up">
          <div className="bg-surface rounded-t-3xl w-full max-w-2xl p-6 space-y-4 shadow-lg" style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}>
            <p className="font-ui text-text text-center">
              Want to add this to your calendar too?
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await addItemToCalendar({ title: calendarPrompt.title, date: calendarPrompt.date, time: calendarPrompt.time, emoji: calendarPrompt.emoji });
                  setCalendarPrompt(null);
                }}
                className="flex-1 bg-accent text-surface rounded-xl py-3 font-ui font-medium hover:bg-accent/90 transition-all active:scale-95"
              >
                Add to Calendar
              </button>
              <button
                onClick={() => setCalendarPrompt(null)}
                className="flex-1 bg-surface border border-border text-text rounded-xl py-3 font-ui font-medium hover:border-accent/30 transition-all active:scale-95"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {recurringConfirmation && (
        <div className="fixed inset-0 bg-text/20 z-50 flex items-end justify-center animate-fade-up">
          <div className="bg-surface rounded-t-3xl w-full max-w-2xl p-6 space-y-4 shadow-lg" style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}>
            <p className="font-ui text-text text-center">
              Looks like this happens regularly. I'll remind you for the next 14 days — you can always re-add it after that. 🧡
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRecurringYes}
                className="flex-1 bg-accent text-surface rounded-xl py-3 font-ui font-medium hover:bg-accent/90 transition-all active:scale-95"
              >
                Yes, remind me
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

      {cycleTrackingPrompt && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 9999, display: 'flex', alignItems: 'flex-end',
          justifyContent: 'center', padding: '0 16px 32px'
        }}>
          <div style={{
            background: '#FDF9F4', borderRadius: '24px', padding: '28px 24px',
            width: '100%', maxWidth: '400px', textAlign: 'center'
          }}>
            <p style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: '20px', color: '#2C2420', marginBottom: '8px'
            }}>Would you like me to keep track?</p>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
              color: '#6B5C52', marginBottom: '24px', lineHeight: 1.5
            }}>
              I can give you a gentle heads up a few days before your next period. 🧡
            </p>
            <button
              onClick={async () => {
                if (userId) {
                  await enableCycleTracking(userId);
                  await logCycleStart(userId);
                  await scheduleCycleReminder(userId);
                }
                setCycleTrackingPrompt(false);
                setPendingCycleLog(false);
              }}
              style={{
                width: '100%', background: '#C4714A', color: '#FDF9F4',
                border: 'none', borderRadius: '24px', padding: '16px',
                fontFamily: 'DM Sans, sans-serif', fontSize: '15px',
                fontWeight: 500, cursor: 'pointer', marginBottom: '12px'
              }}
            >
              Yes please
            </button>
            <button
              onClick={() => {
                setCycleTrackingPrompt(false);
                setPendingCycleLog(false);
              }}
              style={{
                width: '100%', background: 'transparent', color: '#9E8E80',
                border: 'none', padding: '12px',
                fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Not right now
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-lg" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto px-6 pt-4 flex items-center justify-center gap-8">

          {/* Camera */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => { haptic(ImpactStyle.Light); fileInputRef.current?.click(); }}
              className="w-12 h-12 bg-surface border border-border rounded-full flex items-center justify-center hover:border-accent/30 active:scale-95 transition-all"
              aria-label="Upload"
            >
              <ImageUp size={20} className="text-muted" />
            </button>
            <span className="font-ui text-xs text-muted">Upload</span>
          </div>

          {/* Voice — centre, larger */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={handleFABClick}
              className={`relative w-16 h-16 bg-text rounded-full flex items-center justify-center text-surface shadow-lg hover:scale-105 active:scale-95 transition-transform ${isListening ? 'scale-110' : ''}`}
              aria-label="Voice input"
            >
              <div className={`absolute inset-0 rounded-full bg-text/30 ${isListening ? 'animate-ping' : 'animate-pulse-ring'}`}></div>
              <div className={`absolute inset-0 rounded-full bg-text/20 ${isListening ? 'animate-ping' : 'animate-pulse-ring'}`} style={{ animationDelay: '0.75s', transform: 'scale(1.15)' }}></div>
              <Mic size={24} />
            </button>
            <span className="font-ui text-xs text-muted">Voice</span>
          </div>

          {/* Type */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => { haptic(ImpactStyle.Light); setShowTextInput(true); }}
              className="w-12 h-12 bg-surface border border-border rounded-full flex items-center justify-center hover:border-accent/30 active:scale-95 transition-all"
              aria-label="Type input"
            >
              <Keyboard size={20} className="text-muted" />
            </button>
            <span className="font-ui text-xs text-muted">Type</span>
          </div>

        </div>
      </div>
    </>
  );
}
