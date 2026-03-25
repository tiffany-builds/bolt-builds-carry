import { Mic } from 'lucide-react';

interface ReadyScreenProps {
  onComplete: () => void;
}

export function ReadyScreen({ onComplete }: ReadyScreenProps) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5">
      <div className="max-w-md w-full space-y-8 animate-fade-up text-center">
        <div className="space-y-6">
          <h1 className="font-display italic text-4xl font-extralight text-text leading-tight">
            Carry is ready.
          </h1>
          <p className="font-display italic text-xl text-muted font-light leading-relaxed">
            Just talk. Carry figures out the rest.
          </p>
        </div>

        <div className="py-8 flex justify-center">
          <div className="relative">
            <button
              className="w-16 h-16 bg-accent rounded-full flex items-center justify-center shadow-lg animate-pulse-gentle"
              disabled
            >
              <Mic className="w-7 h-7 text-surface" />
            </button>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="w-full bg-text text-cream rounded-xl py-4 font-ui font-medium hover:bg-text/90 active:scale-95 transition-all"
        >
          Let's go
        </button>
      </div>
    </div>
  );
}
