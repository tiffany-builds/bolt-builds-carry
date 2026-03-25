interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-up">
        <div className="space-y-4">
          <h1 className="font-display italic text-5xl font-extralight text-text leading-tight">
            Hello. Let's set up Carry for you.
          </h1>
          <p className="font-ui text-base text-muted font-light leading-relaxed">
            Just a few things so Carry can get to know you.
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-text text-cream rounded-xl py-4 font-ui font-medium hover:bg-text/90 active:scale-95 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
