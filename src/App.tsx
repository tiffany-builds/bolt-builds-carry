import { useState, useEffect } from 'react';
import { StatusBar } from './components/StatusBar';
import { Header } from './components/Header';
import { AffirmationCard } from './components/AffirmationCard';
import { TimelineSection } from './components/TimelineSection';
import { BoxesSection } from './components/BoxesSection';
import { NudgesSection } from './components/NudgesSection';
import { FloatingActionButton } from './components/FloatingActionButton';
import { SignIn } from './components/auth/SignIn';
import { WelcomeScreen } from './components/onboarding/WelcomeScreen';
import { NameInput } from './components/onboarding/NameInput';
import { CategorySelection } from './components/onboarding/CategorySelection';
import { IntakeFlow } from './components/onboarding/IntakeFlow';
import { BoxDetailView } from './components/BoxDetailView';
import { EverythingYouCarry } from './components/EverythingYouCarry';
import { OnYourMindSection } from './components/OnYourMindSection';
import { timelineItems, nudges } from './data';
import { useAuth } from './hooks/useAuth';
import { useOnboarding } from './hooks/useOnboarding';
import { useItems } from './hooks/useItems';
import { UserProfile, UserCategory } from './types';

type OnboardingStep = 'welcome' | 'name' | 'categories' | 'intake' | 'complete';
type View = 'home' | 'boxDetail' | 'everything';

function App() {
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [userName, setUserName] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedCategory, setSelectedCategory] = useState<UserCategory | null>(null);

  const { user, isLoading: authLoading } = useAuth();
  const { createUserProfile, getOrCreateUserProfile, addUserCategories, completeOnboarding, getUserCategories } = useOnboarding();
  const { items, isLoading: itemsLoading, loadItems, getCategoryCounts, getOnYourMindItems } = useItems(userProfile?.id || null);

  useEffect(() => {
    const checkExistingUser = async () => {
      if (!user) return;

      try {
        const profile = await getOrCreateUserProfile(user.id);

        if (profile) {
          setUserProfile(profile);
          setUserName(profile.name);

          const categories = await getUserCategories(profile.id);
          setUserCategories(categories);

          if (profile.has_completed_onboarding) {
            setOnboardingStep('complete');
          } else if (categories.length > 0) {
            setOnboardingStep('intake');
          } else if (profile.name) {
            setOnboardingStep('categories');
          } else {
            setOnboardingStep('name');
          }
        } else {
          setOnboardingStep('name');
        }
      } catch (err) {
        console.error('Error checking existing user:', err);
      }
    };

    if (!authLoading) {
      checkExistingUser();
    }
  }, [user, authLoading, getOrCreateUserProfile, getUserCategories]);

  const handleNameSubmit = async (name: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const profile = await createUserProfile(name, user.id);
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
      setOnboardingStep('intake');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntakeComplete = async () => {
    if (!userProfile) return;

    setIsLoading(true);
    setError(null);
    try {
      await completeOnboarding(userProfile.id);
      setOnboardingStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin mx-auto"></div>
          <p className="font-ui text-muted font-light">Setting things up...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SignIn onSuccess={() => {}} />;
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

  if (onboardingStep === 'intake' && userProfile) {
    return (
      <IntakeFlow
        userName={userName}
        userId={userProfile.id}
        userCategories={userCategories.map((c) => c.name)}
        onComplete={handleIntakeComplete}
      />
    );
  }

  if (currentView === 'boxDetail' && selectedCategory && userProfile) {
    return (
      <BoxDetailView
        categoryName={selectedCategory.name}
        categoryEmoji={selectedCategory.emoji}
        userId={userProfile.id}
        onBack={() => {
          setCurrentView('home');
          setSelectedCategory(null);
          loadItems();
        }}
      />
    );
  }

  if (currentView === 'everything' && userProfile) {
    return (
      <EverythingYouCarry
        userId={userProfile.id}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  const categoryCounts = getCategoryCounts();
  const onYourMindItems = getOnYourMindItems();

  return (
    <div className="min-h-screen bg-cream pb-32">
      <div className="max-w-2xl mx-auto">
        <StatusBar />

        <div className="px-5 space-y-8">
          <Header userName={userName} todayCount={items.filter(i => i.time_frame === 'today').length} />
          <AffirmationCard />
          {onYourMindItems.length > 0 && (
            <OnYourMindSection
              items={onYourMindItems}
              onItemsChange={loadItems}
            />
          )}
          <TimelineSection items={timelineItems} />
          <BoxesSection
            categories={userCategories}
            categoryCounts={categoryCounts}
            onBoxClick={(category) => {
              setSelectedCategory(category);
              setCurrentView('boxDetail');
            }}
          />
          <NudgesSection initialNudges={nudges} />
        </div>
      </div>

      <FloatingActionButton
        userId={userProfile?.id || null}
        userCategories={userCategories.map(c => c.name)}
        onSubmitSuccess={loadItems}
        onEverythingClick={() => setCurrentView('everything')}
      />
    </div>
  );
}

export default App;
