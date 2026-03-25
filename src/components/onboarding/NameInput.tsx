import { useState } from 'react';
import { Check } from 'lucide-react';
import { useSpeechRecognition } from '../../utils/useSpeechRecognition';

interface NameInputProps {
  onNameSubmit: (name: string) => void;
}

export function NameInput({ onNameSubmit }: NameInputProps) {
  const [name, setName] = useState('');
  const [showError, setShowError] = useState<string | null>(null);

  const handleTranscript = (text: string) => {
    setName(text);
  };

  const { isListening, isBrowserSupported, startListening, stopListening } =
    useSpeechRecognition({
      onTranscript: handleTranscript,
      onStart: () => setShowError(null),
      onError: (error) => {
        if (error !== 'no-speech') {
          setShowError(`Error: ${error}`);
        }
      },
    });

  const handleSubmit = () => {
    if (name.trim()) {
      stopListening();
      onNameSubmit(name.trim());
    }
  };

  const handleStartListening = () => {
    setShowError(null);
    startListening();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5">
      <div className="max-w-md w-full space-y-8 animate-fade-up">
        <div className="space-y-4">
          <h1 className="font-display italic text-3xl font-light text-text leading-tight">
            What's your name?
          </h1>
          <p className="font-ui text-base text-muted font-light">
            We'd love to know who we're helping.
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Your first name"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
            disabled={isListening}
            autoFocus
          />

          {isBrowserSupported && (
            <button
              onClick={handleStartListening}
              disabled={isListening}
              className="w-full flex items-center justify-center gap-2 bg-surface border border-border rounded-xl px-4 py-3 text-muted hover:border-accent/30 disabled:border-accent disabled:text-accent transition-all"
            >
              <span className="text-lg">🎤</span>
              <span className="font-ui font-light">
                {isListening ? 'Listening...' : 'Say your name'}
              </span>
            </button>
          )}

          {showError && (
            <div className="text-sm text-accent/70 font-ui font-light text-center">
              {showError}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full bg-accent text-surface rounded-xl py-3 font-ui font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Check size={18} />
          Continue
        </button>
      </div>
    </div>
  );
}
