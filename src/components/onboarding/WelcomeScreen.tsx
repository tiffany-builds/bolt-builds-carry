interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-up">
        <div className="space-y-4">
          <div className="text-5xl mb-6">📌</div>
          <h1 className="font-display italic text-4xl font-light text-text leading-tight">
            Welcome to Carry
          </h1>
          <p className="font-display italic text-lg font-light text-muted leading-relaxed">
            For the one who carries everything.
          </p>
        </div>

        <p className="font-ui text-base text-text font-light leading-relaxed">
          Carry is a personal AI assistant designed to help you manage the mental load of running a family.
        </p>

        <div className="space-y-3 text-sm text-muted font-ui font-light">
          <div className="flex items-start gap-3">
            <span className="text-accent mt-1">✦</span>
            <span>Just talk. Share what's on your mind.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-accent mt-1">✦</span>
            <span>We organize it into your boxes.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-accent mt-1">✦</span>
            <span>Nothing gets forgotten.</span>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-accent text-surface rounded-xl py-3 font-ui font-medium hover:bg-accent/90 active:scale-95 transition-all"
        >
          Let's begin
        </button>
      </div>
    </div>
  );
}
