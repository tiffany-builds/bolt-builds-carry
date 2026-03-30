import { useState, useRef } from 'react';
import { OnboardingWelcome } from './OnboardingWelcome';
import { OnboardingBirthday } from './OnboardingBirthday';
import { OnboardingFamily } from './OnboardingFamily';
import { OnboardingCaringFor } from './OnboardingCaringFor';
import { OnboardingWeek } from './OnboardingWeek';
import { OnboardingPriorities } from './OnboardingPriorities';
import { OnboardingNudges } from './OnboardingNudges';
import { OnboardingInitialThoughts } from './OnboardingInitialThoughts';
import { OnboardingReady } from './OnboardingReady';

interface FullOnboardingFlowProps {
  userId: string;
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  name: string;
  birthdayDay: number;
  birthdayMonth: number;
  household: string[];
  hasChildren: boolean;
  children: Array<{ name: string; age: number }>;
  caringFor: string[];
  weekStructure: string;
  dayStartTime: string;
  priorityAreas: string[];
  nudgePreference: string;
  initialThoughts?: string;
}

export function FullOnboardingFlow({ userId, onComplete }: FullOnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const dataRef = useRef<Partial<OnboardingData>>({});

  const updateData = (newData: Partial<OnboardingData>) => {
    const merged = { ...dataRef.current, ...newData };
    dataRef.current = merged;
    setData(merged);
  };

  const handleWelcome = (name: string) => {
    updateData({ name });
    setStep(1);
  };

  const handleBirthday = (birthdayData: { birthdayDay: number; birthdayMonth: number }) => {
    updateData(birthdayData);
    setStep(2);
  };

  const handleFamily = (familyData: {
    household: string[];
    hasChildren: boolean;
    children: Array<{ name: string; age: number }>;
  }) => {
    updateData(familyData);
    setStep(3);
  };

  const handleCaringFor = (caringFor: string[]) => {
    updateData({ caringFor });
    setStep(4);
  };

  const handleWeek = (weekData: { weekStructure: string; dayStartTime: string }) => {
    updateData(weekData);
    setStep(5);
  };

  const handlePriorities = (priorityAreas: string[]) => {
    updateData({ priorityAreas });
    setStep(6);
  };

  const handleNudges = (nudgePreference: string) => {
    updateData({ nudgePreference });
    setStep(7);
  };

  const handleInitialThoughts = (thoughts: string) => {
    updateData({ initialThoughts: thoughts });
    setStep(8);
  };

  const handleSkip = () => {
    setStep(8);
  };

  const handleComplete = () => {
    onComplete(dataRef.current as OnboardingData);
  };

  return (
    <>
      {step === 0 && <OnboardingWelcome onContinue={handleWelcome} />}
      {step === 1 && <OnboardingBirthday onContinue={handleBirthday} />}
      {step === 2 && <OnboardingFamily onContinue={handleFamily} />}
      {step === 3 && <OnboardingCaringFor onContinue={handleCaringFor} />}
      {step === 4 && <OnboardingWeek onContinue={handleWeek} />}
      {step === 5 && <OnboardingPriorities onContinue={handlePriorities} />}
      {step === 6 && <OnboardingNudges onContinue={handleNudges} />}
      {step === 7 && (
        <OnboardingInitialThoughts
          userId={userId}
          onContinue={handleInitialThoughts}
          onSkip={handleSkip}
        />
      )}
      {step === 8 && (
        <OnboardingReady
          userName={data.name || ''}
          household={data.household || []}
          children={data.children || []}
          priorityAreas={data.priorityAreas || []}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
