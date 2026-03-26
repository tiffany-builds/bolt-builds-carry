import { Mic } from 'lucide-react';
import { ProgressDots } from './ProgressDots';

interface OnboardingReadyProps {
  userName: string;
  household: string[];
  children: Array<{ name: string; age: number }>;
  priorityAreas: string[];
  onComplete: () => void;
}

const priorityLabels: Record<string, string> = {
  appointments: 'Appointments and admin',
  school: 'School and kids stuff',
  household: 'Household tasks',
  myHealth: 'Your own self care and health',
  birthdays: 'Birthdays and special dates',
  work: 'Work deadlines',
  shopping: 'Shopping and errands',
  trips: 'Planning ahead for trips',
};

export function OnboardingReady({ userName, household, children, priorityAreas, onComplete }: OnboardingReadyProps) {
  const getHouseholdSummary = () => {
    const labels = {
      partner: 'your partner',
      coparent: 'your co-parent',
      just_me: 'yourself',
      family: 'family members',
    };

    if (household.includes('just_me')) {
      return 'yourself';
    }

    const people = household.map(h => labels[h as keyof typeof labels]).filter(Boolean);
    if (people.length === 0) return 'your loved ones';
    if (people.length === 1) return people[0];
    if (people.length === 2) return `${people[0]} and ${people[1]}`;
    return `${people.slice(0, -1).join(', ')}, and ${people[people.length - 1]}`;
  };

  const getChildrenSummary = () => {
    if (children.length === 0) return '';
    if (children.length === 1) {
      return `${children[0].name} (${children[0].age})`;
    }
    const names = children.map(c => `${c.name} (${c.age})`);
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  };

  const topPriority = priorityAreas[0] ? priorityLabels[priorityAreas[0]] : null;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ProgressDots total={8} current={7} />

      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-md space-y-12 text-center">
          <h1 className="font-display font-light italic text-5xl text-text">
            Carry is ready.
          </h1>

          <div className="space-y-6">
            <p className="font-ui font-light text-lg text-text">
              Hi {userName}. Carry knows you're carrying for {getHouseholdSummary()}.
              {children.length > 0 && (
                <> {getChildrenSummary()} {children.length === 1 ? 'is' : 'are'} in good hands.</>
              )}
            </p>

            {topPriority && (
              <p className="font-display font-light italic text-lg text-accent">
                {topPriority} — Carry will keep a special eye on that.
              </p>
            )}

            <p className="font-ui font-light text-muted">
              Just talk. Carry figures out the rest.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-text/40 animate-pulse-ring"></div>
              <div className="relative w-16 h-16 bg-text rounded-full flex items-center justify-center text-surface">
                <Mic size={24} />
              </div>
            </div>

            <button
              onClick={onComplete}
              className="bg-accent text-surface rounded-xl px-8 py-4 font-ui font-medium hover:bg-accent/90 transition-all"
            >
              Let's go
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
