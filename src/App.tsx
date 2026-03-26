import { useState, useEffect } from 'react';
import { StatusBar } from './components/StatusBar';
import { Header } from './components/Header';
import { AffirmationCard } from './components/AffirmationCard';
import { TimelineSection } from './components/TimelineSection';
import { BoxesSection } from './components/BoxesSection';
import { NudgesSection } from './components/NudgesSection';
import { FloatingActionButton } from './components/FloatingActionButton';
import { SignIn } from './components/auth/SignIn';
import { LoadingScreen } from './components/LoadingScreen';
import { WelcomeScreen } from './components/onboarding/WelcomeScreen';
import { NameInput } from './components/onboarding/NameInput';
import { FamilyInput } from './components/onboarding/FamilyInput';
import { ReadyScreen } from './components/onboarding/ReadyScreen';
import { CategorySelection } from './components/onboarding/CategorySelection';
import { IntakeFlow } from './components/onboarding/IntakeFlow';
import { BoxDetailView } from './components/BoxDetailView';
import { EverythingYouCarry } from './components/EverythingYouCarry';
import { OnYourMindSection } from './components/OnYourMindSection';
import { LookForwardSection } from './components/LookForwardSection';
import { DebugPanel } from './components/DebugPanel';
import { FullOnboardingFlow, OnboardingData } from './components/onboarding/FullOnboardingFlow';
import { useAuth } from './hooks/useAuth';
import { useOnboarding } from './hooks/useOnboarding';
import { useItems } from './hooks/useItems';
import { UserProfile, UserCategory, TimelineItem } from './types';
import { supabase } from './lib/supabase';
import { categorizeAndCreateItems } from './hooks/useItemCategorization';

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
  const [isBirthday, setIsBirthday] = useState(false);

  const { user, isLoading: authLoading } = useAuth();
  const { createUserProfile, getOrCreateUserProfile, updateUserProfile, addUserCategories, completeOnboarding, getUserCategories } = useOnboarding();
  const { items, isLoading: itemsLoading, loadItems, getCategoryCounts, getOnYourMindItems, getLastWeekItemCount } = useItems(userProfile?.id || null);

  const checkBirthday = (profile: UserProfile | null) => {
    if (!profile?.birthday_day || !profile?.birthday_month) return false;
    const today = new Date();
    return today.getDate() === profile.birthday_day &&
           (today.getMonth() + 1) === profile.birthday_month;
  };

  useEffect(() => {
    const checkExistingUser = async () => {
      if (!user) return;

      try {
        const profile = await getOrCreateUserProfile(user.id);

        if (profile) {
          setUserProfile(profile);
          setUserName(profile.name);
          setIsBirthday(checkBirthday(profile));

          const categories = await getUserCategories(profile.id);
          setUserCategories(categories);

          if (profile.onboarding_complete || profile.has_completed_onboarding) {
            setOnboardingStep('complete');
            const count = await getLastWeekItemCount(profile.id);
            setLastWeekCount(count);
          } else {
            setOnboardingStep('welcome');
          }
        } else {
          setOnboardingStep('welcome');
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
    return <LoadingScreen />;
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

  if (onboardingStep === 'welcome' && user) {
    return (
      <FullOnboardingFlow
        userId={user.id}
        onComplete={async (onboardingData: OnboardingData) => {
          try {
            setIsLoading(true);

            const profileUpdate = {
              name: onboardingData.name,
              birthday_day: onboardingData.birthdayDay,
              birthday_month: onboardingData.birthdayMonth,
              household: onboardingData.household,
              has_children: onboardingData.hasChildren,
              children: onboardingData.children,
              week_structure: onboardingData.weekStructure,
              day_start_time: onboardingData.dayStartTime,
              priority_areas: onboardingData.priorityAreas,
              nudge_preference: onboardingData.nudgePreference,
              onboarding_complete: true,
              has_completed_onboarding: true,
            };

            const { data: updatedProfile, error } = await supabase
              .from('user_profiles')
              .upsert({
                id: user.id,
                ...profileUpdate,
              })
              .select()
              .single();

            if (error) throw error;

            setUserProfile(updatedProfile);
            setUserName(updatedProfile.name);
            setIsBirthday(checkBirthday(updatedProfile));

            if (onboardingData.initialThoughts) {
              await categorizeAndCreateItems(onboardingData.initialThoughts, user.id);
            }

            const categories = await getUserCategories(user.id);
            setUserCategories(categories);

            const count = await getLastWeekItemCount(user.id);
            setLastWeekCount(count);

            setOnboardingStep('complete');
            await loadItems();
          } catch (err) {
            console.error('Error completing onboarding:', err);
            setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
          } finally {
            setIsLoading(false);
          }
        }}
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

  const mindItems = items.filter(item =>
    item.type === 'mind' ||
    item.type === 'idea' ||
    item.type === 'Ideas' ||
    (!item.has_date_time && item.category === 'Ideas')
  );

  const todayItems: TimelineItem[] = items
    .filter(item => (item.has_date_time && item.date) || (item.type === 'lookforward' && item.start_date))
    .map(item => ({
      id: item.id,
      time: item.time || null,
      title: item.type === 'lookforward' ? `${item.title} begins` : item.title,
      subtitle: item.description || '',
      category: item.category,
      completed: item.completed,
      date: item.date || item.start_date || null,
      detail: item.description || null,
      type: item.type,
      hasDateTime: item.has_date_time,
      targetMonth: item.target_month,
      created_at: item.created_at,
      start_date: item.start_date || null,
      end_date: item.end_date || null,
      excitement: item.excitement || null,
    }));

  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      loadItems();
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  console.log("23. App render - Total items:", items.length);
  console.log("24. App render - Today items:", todayItems.length);
  console.log("25. App render - Category counts:", categoryCounts);
  console.log("26. App render - On your mind items:", onYourMindItems.length);
  console.log("27. App render - All items:", items);
  console.log("28. Mind items filtered:", mindItems);
  console.log("29. Items by type:", items.map(i => ({ id: i.id, type: i.type, category: i.category, hasDateTime: i.has_date_time })));

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
          <Header
            userName={userName}
            todayCount={todayItems.filter(i => i.date === new Date().toISOString().split('T')[0]).length}
            isBirthday={isBirthday}
          />

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

          <AffirmationCard
            itemCount={lastWeekCount}
            mindItemCount={mindItems.length}
            isBirthday={isBirthday}
          />
          <TimelineSection items={todayItems} />
          <BoxesSection
            categories={userCategories}
            categoryCounts={categoryCounts}
            onBoxClick={(category) => {
              setSelectedCategory(category);
              setCurrentView('boxDetail');
            }}
          />
          <OnYourMindSection
            items={items}
            onItemsChange={loadItems}
          />
          <LookForwardSection
            items={todayItems}
            onRemoveItem={handleRemoveItem}
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
