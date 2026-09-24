import { useState, useEffect, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ProgressDots } from './ProgressDots';
import { CaptureCard } from '../CaptureCard';
import { Toast } from '../Toast';
import { useSpeechRecognition } from '../../utils/useSpeechRecognition';
import { playInputSound, playStopSound } from '../../utils/inputSound';
import { categorizeAndCreateItems } from '../../hooks/useItemCategorization';
import { supabase } from '../../lib/supabase';

async function haptic(style: ImpactStyle) {
  try { await Haptics.impact({ style }); } catch {}
}

interface NeedsDateItem {
  id: string;
  title: string;
  emoji: string | null;
}

interface OnboardingInitialThoughtsProps {
  userId: string;
  onContinue: (thoughts: string) => void;
  onSkip: () => void;
  onItemsAdded?: (items: any[]) => void;
  onItemUpdate?: (itemId: string, updates: any) => void;
}

export function OnboardingInitialThoughts({ userId, onContinue, onSkip, onItemsAdded, onItemUpdate }: OnboardingInitialThoughtsProps) {
  const [mode, setMode] = useState<'idle' | 'listening' | 'processing' | 'needsDate'>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [processingTranscript, setProcessingTranscript] = useState('');
  const [showTypingFallback, setShowTypingFallback] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [needsDateItems, setNeedsDateItems] = useState<NeedsDateItem[]>([]);
  const [allThoughts, setAllThoughts] = useState('');

  const runCapture = async (text: string) => {
    if (!text.trim()) return;
    setMode('processing');
    setProcessingTranscript(text.trim().slice(0, 80));
    setAllThoughts(prev => (prev ? `${prev}. ${text}` : text));

    try {
      const created = await categorizeAndCreateItems(text, userId);
      if (created && created.length > 0) {
        if (onItemsAdded) onItemsAdded(created);

        const stillNeedDate = created.filter((i: any) => i.needs_date);
        if (stillNeedDate.length > 0) {
          setNeedsDateItems(stillNeedDate.map((i: any) => ({ id: i.id, title: i.title, emoji: i.emoji || null })));
          setMode('needsDate');
          return;
        }

        setToastMessage('Got it — all sorted 🧡');
      } else {
        setToastMessage("Didn't catch anything to save there — want to try again?");
      }
    } catch (err: any) {
      const reason = err?.message || String(err);
      setToastMessage(`Couldn't save that (${reason}) — please try again`);
    }

    setMode('idle');
    setProcessingTranscript('');
  };

  const {
    isListening,
    isBrowserSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onTranscript: (text) => {
      setLiveTranscript('');
      runCapture(text);
    },
    onInterimTranscript: (text) => setLiveTranscript(text),
    onStart: () => { playInputSound(); },
    onStop: () => { playStopSound(); },
    onError: (reason) => {
      setMode('idle');
      if (reason === 'no-speech') {
        setToastMessage("Didn't quite catch that — want to try again?");
      } else {
        setToastMessage(`Didn't catch that (${reason}) — want to try again?`);
      }
    },
  });

  const isListeningRef = useRef(isListening);
  const stopListeningRef = useRef(stopListening);
  isListeningRef.current = isListening;
  stopListeningRef.current = stopListening;

  useEffect(() => {
    return () => {
      if (isListeningRef.current) {
        stopListeningRef.current();
      }
    };
  }, []);

  const handleMicTap = () => {
    haptic(ImpactStyle.Medium);
    setMode('listening');
    setLiveTranscript('');
    if (isBrowserSupported) {
      startListening();
    }
  };

  const handleStop = () => {
    haptic(ImpactStyle.Heavy);
    stopListening();
  };

  const handlePickDate = async (item: NeedsDateItem, days: number) => {
    haptic(ImpactStyle.Light);
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    await supabase.from('items').update({ date: dateStr, has_date_time: true, needs_date: false }).eq('id', item.id);

    if (onItemUpdate) {
      onItemUpdate(item.id, { date: dateStr, has_date_time: true, needs_date: false });
    }

    setNeedsDateItems(prev => {
      const remaining = prev.filter(i => i.id !== item.id);
      if (remaining.length === 0) {
        setMode('idle');
        setToastMessage('Got it — all sorted 🧡');
      }
      return remaining;
    });
  };

  const handleTypedSubmit = async () => {
    const text = typedText.trim();
    if (!text) {
      onSkip();
      return;
    }
    setShowTypingFallback(false);
    setTypedText('');
    await runCapture(text);
  };

  const handleContinue = () => {
    onContinue(allThoughts);
  };

  const currentNeedsDateItem = needsDateItems[0];

  return (
    <div className="bg-cream flex flex-col" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <ProgressDots total={3} current={2} />

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      <div className="flex-1 flex items-center justify-center px-8 py-8 overflow-y-auto min-h-0">
        <div className="w-full max-w-md flex flex-col items-center gap-7 text-center">

          {mode === 'idle' && (
            <div className="flex flex-col gap-3 max-w-[300px]">
              <h1 className="font-display font-light italic text-3xl" style={{ color: '#C4714A' }}>
                Welcome to Carry
              </h1>
              <p className="font-ui font-medium text-text text-[15px] leading-relaxed">
                Let me help carry some of the mental&nbsp;load.
              </p>
              <p className="font-ui font-light text-muted text-sm leading-relaxed">
                Start by telling me what you have on your mind. It could be errands, dinner plans, an upcoming appointment, family stuff — anything. Just talk.
              </p>
            </div>
          )}

          {mode === 'idle' && (
            <button
              onClick={handleMicTap}
              aria-label="Start speaking"
              className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: '#2C2420' }}
            >
              <div className="absolute inset-0 rounded-full bg-text/30 animate-pulse-ring"></div>
              <div className="absolute inset-0 rounded-full bg-text/20 animate-pulse-ring" style={{ animationDelay: '0.75s', transform: 'scale(1.15)' }}></div>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FDF9F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 2 }}>
                <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
                <line x1="12" y1="18" x2="12" y2="22"></line>
              </svg>
            </button>
          )}

          {(mode === 'listening' || mode === 'processing') && (
            <CaptureCard
              isProcessing={mode === 'processing'}
              liveTranscript={liveTranscript}
              processingTranscript={processingTranscript}
              onStop={handleStop}
            />
          )}

          {mode === 'needsDate' && currentNeedsDateItem && (
            <div
              className="w-full text-left"
              style={{
                background: 'rgba(253,249,244,0.92)',
                borderRadius: '20px',
                border: '1px solid rgba(212,196,180,0.7)',
                padding: '18px 16px',
                boxShadow: '0 4px 24px rgba(44,36,32,0.07)',
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C4714A', marginBottom: '8px', fontFamily: 'DM Sans, sans-serif' }}>
                ✦ Carry noticed
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '14px', color: '#2C2420', lineHeight: 1.5, marginBottom: '12px' }}>
                This looks time-sensitive. When would you like it to happen?
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px' }}>{currentNeedsDateItem.emoji || '📋'}</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#2C2420', fontFamily: 'DM Sans, sans-serif' }}>
                  {currentNeedsDateItem.title}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Today', days: 0 },
                  { label: 'Tomorrow', days: 1 },
                  { label: 'This week', days: 3 },
                  { label: 'Next week', days: 7 },
                ].map(({ label, days }) => (
                  <div
                    key={label}
                    onClick={() => handlePickDate(currentNeedsDateItem, days)}
                    style={{
                      background: '#FDF9F4',
                      border: '1px solid #D4C4B4',
                      borderRadius: '12px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: '#2C2420',
                      cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'idle' && (
            <span
              onClick={() => setShowTypingFallback(v => !v)}
              className="font-ui text-sm text-muted underline cursor-pointer"
            >
              {showTypingFallback ? 'hide typing' : 'or type instead'}
            </span>
          )}

          {mode === 'idle' && showTypingFallback && (
            <textarea
              value={typedText}
              onChange={e => setTypedText(e.target.value)}
              placeholder="Pick up dry cleaning, call mum, dentist appointment for kids…"
              rows={4}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
            />
          )}

          {mode === 'idle' && showTypingFallback && (
            <button
              onClick={handleTypedSubmit}
              className="w-full bg-accent text-surface rounded-xl px-6 py-3 font-ui font-medium hover:bg-accent/90 transition-all"
            >
              Add this
            </button>
          )}

        </div>
      </div>

      <div className="px-8" style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }}>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 bg-surface border border-border text-text rounded-xl px-6 py-4 font-ui font-medium hover:border-accent/30 transition-all"
          >
            Skip
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 bg-accent text-surface rounded-xl px-6 py-4 font-ui font-medium hover:bg-accent/90 transition-all"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
