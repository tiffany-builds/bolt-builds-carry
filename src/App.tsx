import { useState, useEffect } from 'react';
import { StatusBar } from './components/StatusBar';
import { Header } from './components/Header';
import { AffirmationCard } from './components/AffirmationCard';
import { TimelineSection } from './components/TimelineSection';
import { BoxesSection } from './components/BoxesSection';
import { FloatingActionButton } from './components/FloatingActionButton';
import { SignIn } from './components/auth/SignIn';
import { LoadingScreen } from './components/LoadingScreen';
import { BoxDetailView } from './components/BoxDetailView';
import { EverythingYouCarry } from './components/EverythingYouCarry';
import { OnYourMindSection } from './components/OnYourMindSection';
import { LookForwardSection } from './components/LookForwardSection';
import { CalendarView } from './components/CalendarView';
import { FullOnboardingFlow, OnboardingData } from './components/onboarding/FullOnboardingFlow';
import { Toast } from './components/Toast';
import { useAuth } from './hooks/useAuth';
import { useItems } from './hooks/useItems';
import { UserProfile, UserCategory, TimelineItem } from './types';
import { supabase } from './lib/supabase';
import { categorizeAndCreateItems } from './hooks/useItemCategorization';
import { generateRecurringInstances } from './utils/recurringItems';
import { getTodayDateString } from './utils/dateFormatting';

type OnboardingStep = 'welcome' | 'name' | 'family' | 'ready' | 'complete';
type View = 'home' | 'boxDetail' | 'everything' | 'calendar';

function App() {
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [userName, setUserName] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedCategory, setSelectedCategory] = useState<UserCategory | null>(null);
  const [lastWeekCount, setLastWeekCount] = useState(0);
  const [isBirthday, setIsBirthday] = useState(false);
  const [hasCompletedOnboardingThisSession, setHasCompletedOnboardingThisSession] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [autoOpenFAB, setAutoOpenFAB] = useState(false);

  const { user, isLoading: authLoading } = useAuth();
  const { items, setItems, isLoading: itemsLoading, loadItems, getCategoryCounts, getOnYourMindItems, getLastWeekItemCount, addItemsToLocalState, removeItemFromState } = useItems(user?.id || null);

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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) console.log('Profile load error:', profileError);

        if (profile && profile.onboarding_complete) {
          setUserName(profile.first_name || '');
          setUserProfile(profile);
          setIsBirthday(checkBirthday(profile));
          setOnboardingStep('complete');

          // Generate recurring instances in background
          generateRecurringInstances(user.id).then(() => {
            loadItems();
          });

          const count = await getLastWeekItemCount(user.id);
          setLastWeekCount(count);
        } else {
          // Check localStorage as fallback
          const locallyOnboarded = localStorage.getItem(`carry_onboarded_${user.id}`);
          if (locallyOnboarded === 'true') {
            const localName = localStorage.getItem(`carry_name_${user.id}`) || '';
            setUserName(localName);
            setOnboardingStep('complete');
          } else {
            setOnboardingStep('welcome');
          }
        }
      } catch (err) {
        console.log('Error checking existing user:', err);
      }
    };

    const fixOldCategories = async () => {
      if (!user?.id) return;
      const alreadyFixed = localStorage.getItem(`carry_cats_fixed_${user.id}`);
      if (alreadyFixed) return;

      const categoryMap: Record<string, string> = {
        'Ideas': 'Me',
        'Other': 'Errands',
        'Projects': 'Work',
        'Household': 'Home',
        'Household Tasks': 'Home',
        'Kids': 'Family',
        'Shopping': 'Errands',
        'Exercise': 'Me',
      };

      for (const [oldCat, newCat] of Object.entries(categoryMap)) {
        await supabase
          .from('items')
          .update({ category: newCat })
          .eq('user_id', user.id)
          .eq('category', oldCat);
      }
      localStorage.setItem(`carry_cats_fixed_${user.id}`, 'true');
    };

    if (!authLoading) {
      checkExistingUser();
      fixOldCategories();
    }
  }, [user, authLoading, hasCompletedOnboardingThisSession, getLastWeekItemCount]);

  useEffect(() => {
    if (hasCompletedOnboardingThisSession) {
      setAutoOpenFAB(true);
    }
  }, [hasCompletedOnboardingThisSession]);

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
          const caringFor = onboardingData.caringFor || [];
          const children = onboardingData.children || [];

          setUserName(name);

          // Build child names string for Claude context
          const childNamesStr = children
            .filter(c => c.name)
            .map(c => c.name)
            .join(', ');

          // Persist to localStorage immediately after onboarding
          localStorage.setItem(`carry_onboarded_${user.id}`, 'true');
          localStorage.setItem(`carry_name_${user.id}`, name);
          localStorage.setItem(`carry_caring_for_${user.id}`, JSON.stringify(caringFor));
          localStorage.setItem(`carry_children_${user.id}`, childNamesStr);

          // Try to save to Supabase but don't block on failure
          try {
            const { data: updatedProfile, error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                first_name: name,
                caring_for: caringFor,
                onboarding_complete: true,
              }, { onConflict: 'id' })
              .select()
              .maybeSingle();

            if (profileError) {
              console.error('Profile save error:', profileError);
            } else {
              console.log('Profile saved successfully');
              if (updatedProfile) {
                setUserProfile(updatedProfile);
                setIsBirthday(checkBirthday(updatedProfile));
              }
            }

            if (onboardingData.initialThoughts) {
              const newItems = await categorizeAndCreateItems(onboardingData.initialThoughts, user.id);
              if (newItems && newItems.length > 0) {
                addItemsToLocalState(newItems);
              }
            }

            const count = await getLastWeekItemCount(user.id);
            setLastWeekCount(count);
          } catch (err) {
            // Log but don't throw — let user through anyway
            console.log('Profile save attempted:', err);
          }

          // Always proceed to home screen
          setIsLoading(false);
          setHasCompletedOnboardingThisSession(true);
          setOnboardingStep('complete');
        }}
      />
    );
  }

  if (currentView === 'boxDetail' && selectedCategory && user) {
    return (
      <>
        <BoxDetailView
          categoryName={selectedCategory.name}
          categoryEmoji={selectedCategory.emoji}
          userId={user.id}
         onBack={() => {
  setCurrentView('home');
  setSelectedCategory(null);
}}
          items={items.filter(i => i.category === selectedCategory.name && !i.completed)}
          onItemComplete={async (itemId) => {
            await supabase.from('items').update({ completed: true }).eq('id', itemId);
            setItems(prev => prev.filter(i => i.id !== itemId));
          }}
          onItemDelete={async (itemId) => {
            await supabase.from('items').delete().eq('id', itemId);
            setItems(prev => prev.filter(i => i.id !== itemId));
          }}
          onItemUpdate={(itemId, updates) => {
            setItems(prev => prev.map(item =>
              item.id === itemId ? { ...item, ...updates } : item
            ));
          }}
        />
        <FloatingActionButton
          userId={user.id}
          onSubmitSuccess={undefined}
          onItemsAdded={addItemsToLocalState}
          onEverythingClick={() => setCurrentView('everything')}
          onCalendarClick={() => setCurrentView('calendar')}
          autoOpenFAB={autoOpenFAB}
          onAutoOpenComplete={() => setAutoOpenFAB(false)}
        />
      </>
    );
  }

  if (currentView === 'everything' && user) {
    return (
      <EverythingYouCarry
        userId={user.id}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  if (currentView === 'calendar' && user) {
    const todayItems: TimelineItem[] = items
      .filter(item =>
        (item.has_date_time && item.date) ||
        (item.type === 'lookforward' && (item.start_date || item.date))
      )
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
        hasDateTime: item.has_date_time || item.type === 'lookforward',
        targetMonth: item.target_month,
        created_at: item.created_at,
        start_date: item.start_date || null,
        end_date: item.end_date || null,
        excitement: item.excitement || null,
        emoji: (item as any).emoji || null,
      }));

    return (
      <CalendarView
        userId={user.id}
        items={todayItems}
        onBack={() => setCurrentView('home')}
        onItemComplete={(itemId) => {
          removeItemFromState(itemId);
        }}
        onShowToast={(message) => setToastMessage(message)}
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
    .filter(item =>
      (item.has_date_time && item.date) ||
      (item.type === 'lookforward' && (item.start_date || item.date))
    )
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
      hasDateTime: item.has_date_time || item.type === 'lookforward',
      targetMonth: item.target_month,
      created_at: item.created_at,
      start_date: item.start_date || null,
      end_date: item.end_date || null,
      excitement: item.excitement || null,
      emoji: (item as any).emoji || null,
    }));

  const handleRemoveItem = async (itemId: string) => {
    try {
      await supabase.from('items').delete().eq('id', itemId);
    } catch (err) {
    }
    removeItemFromState(itemId);
  };


  return (
    <div className="min-h-screen bg-[#E8DDD0] pb-32">
      <div className="max-w-2xl mx-auto">
        <StatusBar />
        <div className="px-5 space-y-8">
          <Header
            userName={userName}
            todayCount={todayItems.filter(i => i.date === getTodayDateString()).length}
            isBirthday={isBirthday}
          />
          <AffirmationCard
            isBirthday={isBirthday}
            allDoneToday={
              todayItems.filter(i => i.date === getTodayDateString()).length > 0 &&
              todayItems.filter(i => i.date === getTodayDateString() && !i.completed).length === 0
            }
            lastWeekCount={lastWeekCount}
          />
          <TimelineSection
            items={todayItems}
            onItemComplete={removeItemFromState}
            onItemDelete={async (itemId) => {
              await supabase.from('items').delete().eq('id', itemId);
              removeItemFromState(itemId);
            }}
            onShowToast={setToastMessage}
          />
          <BoxesSection
            categoryCounts={categoryCounts}
            onBoxClick={(category) => {
              setSelectedCategory(category as UserCategory);
              setCurrentView('boxDetail');
            }}
          />
          <OnYourMindSection
            items={items}
            onItemsChange={removeItemFromState}
          />
          <LookForwardSection
            items={todayItems}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </div>
      <FloatingActionButton
        userId={user?.id || null}
        caringFor={userProfile?.caring_for || []}
        onSubmitSuccess={undefined}
        onItemsAdded={addItemsToLocalState}
        onEverythingClick={() => setCurrentView('everything')}
        onCalendarClick={() => setCurrentView('calendar')}
        autoOpenFAB={autoOpenFAB}
        onAutoOpenComplete={() => setAutoOpenFAB(false)}
      />
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

export default App;
