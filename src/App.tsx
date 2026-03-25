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
import { FamilyInput } from './components/onboarding/FamilyInput';
import { ReadyScreen } from './components/onboarding/ReadyScreen';
import { CategorySelection } from './components/onboarding/CategorySelection';
import { IntakeFlow } from './components/onboarding/IntakeFlow';
import { BoxDetailView } from './components/BoxDetailView';
import { EverythingYouCarry } from './components/EverythingYouCarry';
import { OnYourMindSection } from './components/OnYourMindSection';
import { DebugPanel } from './components/DebugPanel';
import { useAuth } from './hooks/useAuth';
import { useOnboarding } from './hooks/useOnboarding';
import { useItems } from './hooks/useItems';
import { UserProfile, UserCategory, TimelineItem } from './types';
import { supabase } from './lib/supabase';

type OnboardingStep = 'welcome' | 'name' | 'family' | 'ready' | 'complete';
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
  const [lastWeekCount, setLastWeekCount] = useState(0);
  const [debugLastInput, setDebugLastInput] = useState('');
  const [debugApiStatus, setDebugApiStatus] = useState<'idle' | 'calling' | 'success' | 'error'>('idle');
  const [debugLastResponse, setDebugLastResponse] = useState('');
  const [debugLastError, setDebugLastError] = useState('');

  const { user, isLoading: authLoading } = useAuth();
  const { createUserProfile, getOrCreateUserProfile, updateUserProfile, addUserCategories, completeOnboarding, getUserCategories } = useOnboarding();
  const { items, isLoading: itemsLoading, loadItems, getCategoryCounts, getOnYourMindItems, getLastWeekItemCount } = useItems(userProfile?.id || null);

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
            const count = await getLastWeekItemCount(profile.id);
            setLastWeekCount(count);
          } else if (profile.family_members && profile.family_members.length >= 0) {
            setOnboardingStep('ready');
          } else if (profile.name) {
            setOnboardingStep('family');
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
  }, [user, authLoading, getOrCreateUserProfile, getUserCategories, getLastWeekItemCount]);

  const handleNameSubmit = async (name: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const profile = await createUserProfile(name, user.id);
      setUserName(name);
      setUserProfile(profile);
      setOnboardingStep('family');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFamilySubmit = async (familyMembers: string[]) => {
    if (!userProfile) return;

    setIsLoading(true);
    setError(null);
    try {
      const updatedProfile = await updateUserProfile(userProfile.id, { family_members: familyMembers });
      setUserProfile(updatedProfile);
      setOnboardingStep('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save family members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadyComplete = async () => {
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

  if (onboardingStep === 'family') {
    return <FamilyInput onFamilySubmit={handleFamilySubmit} />;
  }

  if (onboardingStep === 'ready') {
    return <ReadyScreen onComplete={handleReadyComplete} />;
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

  const todayItems: TimelineItem[] = items
    .filter(item => item.has_date_time && item.date)
    .map(item => ({
      id: item.id,
      time: item.time || null,
      title: item.title,
      subtitle: item.description || '',
      category: item.category,
      completed: item.completed,
      date: item.date || null,
      detail: item.description || null,
    }));

  console.log("23. App render - Total items:", items.length);
  console.log("24. App render - Today items:", todayItems.length);
  console.log("25. App render - Category counts:", categoryCounts);
  console.log("26. App render - On your mind items:", onYourMindItems.length);
  console.log("27. App render - All items:", items);

  const handleTestItem = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('items')
        .insert({
          user_id: userProfile.id,
          title: 'Test item',
          category: 'Household',
          item_type: 'task',
          completed: false,
          time_frame: 'anytime'
        })
        .select()
        .single();

      if (error) {
        console.error('Test item error:', error);
      } else {
        console.log('Test item created:', data);
        loadItems();
      }
    } catch (err) {
      console.error('Test item exception:', err);
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-32">
      <div className="max-w-2xl mx-auto">
        <StatusBar />

        <div className="px-5 space-y-8">
          <Header userName={userName} todayCount={todayItems.filter(i => i.date === new Date().toISOString().split('T')[0]).length} />

          <DebugPanel
            lastInput={debugLastInput}
            apiStatus={debugApiStatus}
            itemsCount={items.length}
            lastResponse={debugLastResponse}
            lastError={debugLastError}
          />

          <button
            onClick={handleTestItem}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-mono py-2 px-4 rounded transition-colors"
          >
            Add Test Item
          </button>

          <AffirmationCard itemCount={lastWeekCount} />
          {onYourMindItems.length > 0 && (
            <OnYourMindSection
              items={onYourMindItems}
              onItemsChange={loadItems}
            />
          )}
          <TimelineSection items={todayItems} />
          <BoxesSection
            categories={userCategories}
            categoryCounts={categoryCounts}
            onBoxClick={(category) => {
              setSelectedCategory(category);
              setCurrentView('boxDetail');
            }}
          />
        </div>
      </div>

      <FloatingActionButton
        userId={userProfile?.id || null}
        userCategories={userCategories.map(c => c.name)}
        onSubmitSuccess={loadItems}
        onEverythingClick={() => setCurrentView('everything')}
        onDebugUpdate={(input, status, response, error) => {
          setDebugLastInput(input);
          setDebugApiStatus(status);
          setDebugLastResponse(response);
          setDebugLastError(error);
        }}
      />
    </div>
  );
}

export default App;
