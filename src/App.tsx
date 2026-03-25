import { useState, useEffect } from 'react';
import { StatusBar } from './components/StatusBar';
import { Header } from './components/Header';
import { AffirmationCard } from './components/AffirmationCard';
import { TimelineSection } from './components/TimelineSection';
import { BoxesSection } from './components/BoxesSection';
import { NudgesSection } from './components/NudgesSection';
import { FloatingActionButton } from './components/FloatingActionButton';
import { WelcomeScreen } from './components/onboarding/WelcomeScreen';
import { NameInput } from './components/onboarding/NameInput';
import { CategorySelection } from './components/onboarding/CategorySelection';
import { timelineItems, boxes, nudges } from './data';
import { useOnboarding } from './hooks/useOnboarding';
import { UserProfile, UserCategory } from './types';

type OnboardingStep = 'welcome' | 'name' | 'categories' | 'complete';

function App() {
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [userName, setUserName] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createUserProfile, addUserCategories, completeOnboarding } = useOnboarding();

  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const stored = localStorage.getItem('carryUserProfile');
        if (stored) {
          const profile = JSON.parse(stored);
          setUserProfile(profile);
          setUserName(profile.name);
          setOnboardingStep('complete');
        }
      } catch (err) {
        console.error('Error checking existing user:', err);
      }
    };

    checkExistingUser();
  }, []);

  const handleNameSubmit = async (name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await createUserProfile(name);
      setUserName(name);
      setUserProfile(profile);
      setOnboardingStep('categories');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoriesSubmit = async (selectedCategories: string[]) => {
    if (!userProfile) return;

    setIsLoading(true);
    setError(null);
    try {
      const categories = await addUserCategories(userProfile.id, selectedCategories);
      setUserCategories(categories);
      await completeOnboarding(userProfile.id);

      localStorage.setItem('carryUserProfile', JSON.stringify(userProfile));
      localStorage.setItem('carryUserCategories', JSON.stringify(categories));

      setOnboardingStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up categories');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin mx-auto"></div>
          <p className="font-ui text-muted font-light">Setting things up...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-5">
        <div className="max-w-md text-center space-y-4">
          <p className="font-ui text-accent font-light">Something went wrong</p>
          <p className="font-ui text-muted font-light">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-accent text-surface rounded-xl px-6 py-3 font-ui font-medium hover:bg-accent/90 transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (onboardingStep === 'welcome') {
    return <WelcomeScreen onContinue={() => setOnboardingStep('name')} />;
  }

  if (onboardingStep === 'name') {
    return <NameInput onNameSubmit={handleNameSubmit} />;
  }

  if (onboardingStep === 'categories') {
    return (
      <CategorySelection
        userName={userName}
        onCategoriesSubmit={handleCategoriesSubmit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-32">
      <div className="max-w-2xl mx-auto">
        <StatusBar />

        <div className="px-5 space-y-8">
          <Header />
          <AffirmationCard />
          <TimelineSection items={timelineItems} />
          <BoxesSection boxes={boxes} />
          <NudgesSection initialNudges={nudges} />
        </div>
      </div>

      <FloatingActionButton />
    </div>
  );
}

export default App;
