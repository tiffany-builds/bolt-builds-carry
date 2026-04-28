import { useState, useRef } from 'react';
import { OnboardingWelcome } from './OnboardingWelcome';
import { OnboardingAboutYou } from './OnboardingAboutYou';

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
    onComplete({ ...dataRef.current, ...data } as OnboardingData);
  };

  return (
    <>
      {step === 0 && <OnboardingWelcome onContinue={handleWelcome} />}
      {step === 1 && <OnboardingAboutYou onContinue={handleAboutYou} />}
    </>
  );
}
