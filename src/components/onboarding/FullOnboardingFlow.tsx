import { useState, useRef } from 'react';
import { OnboardingWelcome } from './OnboardingWelcome';
import { OnboardingAboutYou } from './OnboardingAboutYou';
import { OnboardingInitialThoughts } from './OnboardingInitialThoughts';

interface FullOnboardingFlowProps {
  userId: string;
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  name: string;
  caringFor: string[];
  children: Array<{ name: string }>;
  initialThoughts?: string;
}

export function FullOnboardingFlow({ userId, onComplete }: FullOnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const dataRef = useRef<Partial<OnboardingData>>({});

  const updateData = (newData: Partial<OnboardingData>) => {
    dataRef.current = { ...dataRef.current, ...newData };
  };

  const handleWelcome = (name: string) => {
    updateData({ name });
    setStep(1);
  };

  const handleAboutYou = (data: { caringFor: string[]; children: Array<{ name: string }> }) => {
    updateData(data);
    setStep(2);
  };

  const handleInitialThoughts = (thoughts: string) => {
    updateData({ initialThoughts: thoughts });
    onComplete(dataRef.current as OnboardingData);
  };

  const handleSkip = () => {
    onComplete(dataRef.current as OnboardingData);
  };

  return (
    <>
      {step === 0 && <OnboardingWelcome onContinue={handleWelcome} />}
      {step === 1 && <OnboardingAboutYou onContinue={handleAboutYou} />}
      {step === 2 && (
        <OnboardingInitialThoughts
          userId={userId}
          onContinue={handleInitialThoughts}
          onSkip={handleSkip}
        />
      )}
    </>
  );
}
