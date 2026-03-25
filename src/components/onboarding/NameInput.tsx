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
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What's your first name?"
            className="w-full bg-surface border border-border rounded-xl px-4 py-4 font-ui text-lg text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            disabled={isListening}
            autoFocus
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full bg-text text-cream rounded-xl py-4 font-ui font-medium hover:bg-text/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
