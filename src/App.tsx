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
import { FullOnboardingFlow, OnboardingData } from './components/onboarding/FullOnboardingFlow';
import { useAuth } from './hooks/useAuth';
import { useOnboarding } from './hooks/useOnboarding';
import { useItems } from './hooks/useItems';
import { UserProfile, UserCategory, TimelineItem } from './types';
import { supabase } from './lib/supabase';
import { categorizeAndCreateItems } from './hooks/useItemCategorization';

type OnboardingStep = 'welcome' | 'name' | 'family' | 'ready' | 'complete';
type View = 'home' | 'boxDetail' | 'everything';

// Default categories to use when no saved categories exist
const DEFAULT_CATEGORIES: UserCategory[] = [
  { id: 'kids', user_id: '', name: 'Kids', emoji: '🧒', color: '#A8B89A', order_index: 0 },
  { id: 'household', user_id: '', name: 'Household', emoji: '🏠', color: '#C4714A', order_index: 1 },
  { id: 'health', user_id: '', name: 'Health', emoji: '❤️', color: '#A0B4C0', order_index: 2 },
  { id: 'errands', user_id: '', name: 'Errands', emoji: '🛍', color: '#D4C285', order_index: 3 },
  { id: 'me', user_id: '', name: 'Me', emoji: '🏃‍♀️', color: '#B0A8C4', order_index: 4 },
  { id: 'ideas', user_id: '', name: 'Ideas', emoji: '✨', color: '#C4B5A5', order_index: 5 },
  { id: 'work', user_id: '', name: 'Work', emoji: '💼', color: '#8B7355', order_index: 6 },
  { id: 'projects', user_id: '', name: 'Projects', emoji: '📋', color: '#9E8E80', order_index: 7 },
];

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
  const [isBirthday, setIsBirthday] = useState(false);
  const [hasCompletedOnboardingThisSession, setHasCompletedOnboardingThisSession] = useState(false);

  const { user, isLoading: authLoading } = useAuth();
  const { createUserProfile, getOrCreateUserProfile, updateUserProfile, addUserCategories, completeOnboarding, getUserCategories } = useOnboarding();
  const { items, isLoading: itemsLoading, loadItems, getCategoryCounts, getOnYourMindItems, getLastWeekItemCount, addItemsToLocalState } = useItems(user?.id || null);

  const checkBirthday = (profile: UserProfile | null) => {
    if (!profile?.birthday_day || !profile?.birthday_month) return false;
    const today = new Date();
    return today.getDate() === profile.birthday_day &&
           (today.getMonth() + 1) === profile.birthday_month;
  };

  useEffect(() => {
    const checkExistingUser = async () => {
      if (!user) return;

      // Don't overwrite if user just completed onboarding
      if (hasCompletedOnboardingThisSession) return;

      try {
        const profile = await getOrCreateUserProfile(user.id);

        if (profile) {
          setUserProfile(profile);
          setUserName(profile.first_name);
          setIsBirthday(checkBirthday(profile));

          const categories = await getUserCategories(profile.id);
          if (categories && categories.length > 0) {
            setUserCategories(categories);
          } else {
            // Use defaults if no saved categories
            setUserCategories(DEFAULT_CATEGORIES);
          }

          if (profile.onboarding_complete) {
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
      }
    };

    if (!authLoading) {
      checkExistingUser();
    }
  }, [user, authLoading, hasCompletedOnboardingThisSession, getOrCreateUserProfile, getUserCategories, getLastWeekItemCount]);

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
            onClick={() => {
              setError(null);
              setIsLoading(false);
            }}
            className="bg-accent text-surface rounded-xl px-6 py-3 font-ui font-medium hover:bg-accent/90 transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (onboardingStep !== 'complete' && !hasCompletedOnboardingThisSession && user) {
    return (
      <FullOnboardingFlow
        userId={user.id}
        onComplete={async (onboardingData: OnboardingData) => {
          setIsLoading(true);

          // Save the name locally regardless
          const name = onboardingData.name || 'there';
          setUserName(name);

          // Always set default categories after onboarding
          const selectedCats = onboardingData.selectedCategories || DEFAULT_CATEGORIES.map(c => c.name);
          const userCats = DEFAULT_CATEGORIES.filter(c => selectedCats.includes(c.name));
          setUserCategories(userCats.length >= 3 ? userCats : DEFAULT_CATEGORIES);

          // Try to save to Supabase but don't block on failure
          try {
            console.log("Attempting to save profile:", onboardingData);

            const profileUpdate = {
              id: user.id,
              first_name: name,
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
            };

            const { data: updatedProfile, error } = await supabase
              .from('profiles')
              .upsert(profileUpdate, { onConflict: 'id' })
              .select()
              .single();

            if (error) {
              console.log('Profile save attempted but failed:', error);
            } else {
              console.log("Profile saved successfully");
              setUserProfile(updatedProfile);
              setIsBirthday(checkBirthday(updatedProfile));
            }

            // Try to save categories to Supabase in background
            if (user?.id) {
              for (const cat of userCats) {
                await supabase
                  .from('user_categories')
                  .upsert({
                    user_id: user.id,
                    name: cat.name,
                    emoji: cat.emoji,
                    color: cat.color,
                    order_index: cat.order_index
                  }, { onConflict: 'user_id,name' });
              }
            }

            if (onboardingData.initialThoughts) {
              await categorizeAndCreateItems(onboardingData.initialThoughts, user.id);
            }

            const count = await getLastWeekItemCount(user.id);
            setLastWeekCount(count);

            await loadItems();
          } catch (err) {
            // Log but don't throw — let user through anyway
            console.log('Profile save attempted:', err);
          }

          // Always proceed to home screen
          setHasCompletedOnboardingThisSession(true);
          setIsLoading(false);
          setOnboardingStep('complete');
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
    }
  };


  return (
    <div className="min-h-screen bg-[#E8DDD0] pb-32">
      <div className="max-w-2xl mx-auto">
        <StatusBar />
        <div className="px-5 space-y-8">
          <Header
            userName={userName}
            todayCount={todayItems.filter(i => i.date === new Date().toISOString().split('T')[0]).length}
            isBirthday={isBirthday}
          />
          <AffirmationCard
            itemCount={lastWeekCount}
            mindItemCount={mindItems.length}
            isBirthday={isBirthday}
          />
          <TimelineSection items={todayItems} />
          <BoxesSection
            categories={userCategories.length > 0 ? userCategories : DEFAULT_CATEGORIES}
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
        userId={user?.id || null}
        userCategories={userCategories.length > 0 ? userCategories.map(c => c.name) : DEFAULT_CATEGORIES.map(c => c.name)}
        onSubmitSuccess={loadItems}
        onItemsAdded={addItemsToLocalState}
        onEverythingClick={() => setCurrentView('everything')}
      />
    </div>
  );
}

export default App;
