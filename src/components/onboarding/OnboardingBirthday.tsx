import { useState } from 'react';
import { ProgressDots } from './ProgressDots';

interface OnboardingBirthdayProps {
  onContinue: (data: { birthdayDay: number; birthdayMonth: number }) => void;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function OnboardingBirthday({ onContinue }: OnboardingBirthdayProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
      onContinue({ birthdayDay: dayNum, birthdayMonth: monthNum });
    }
  };

  const isValid = day && month && parseInt(day) >= 1 && parseInt(day) <= 31 && parseInt(month) >= 1 && parseInt(month) <= 12;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ProgressDots total={8} current={1} />

      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="font-display font-light italic text-4xl text-text">
              When's your birthday?
            </h1>
            <p className="font-ui font-light text-muted text-lg">
              So Carry can celebrate with you 🎂
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <label className="font-ui text-sm text-muted">Day</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-ui text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="15"
                />
              </div>
              <div className="flex-[2] space-y-2">
                <label className="font-ui text-sm text-muted">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-ui text-text focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="">Select month</option>
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="font-ui text-xs text-muted font-light">
              Carry will wish you a happy birthday every year.
            </p>

            <button
              type="submit"
              disabled={!isValid}
              className="w-full bg-accent text-surface rounded-xl px-6 py-4 font-ui font-medium hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
