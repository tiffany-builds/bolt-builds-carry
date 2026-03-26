import { useState } from 'react';
import { ProgressDots } from './ProgressDots';

interface OnboardingWeekProps {
  onContinue: (data: { weekStructure: string; dayStartTime: string }) => void;
}

const weekOptions = [
  { value: 'mostly_home', emoji: '🏠', label: 'Mostly at home' },
  { value: 'mix', emoji: '🔄', label: 'Mix of home and work' },
  { value: 'mostly_out', emoji: '💼', label: 'Mostly out of the house' },
  { value: 'varies', emoji: '📅', label: 'It varies a lot' },
];

const timeOptions = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00'
];

export function OnboardingWeek({ onContinue }: OnboardingWeekProps) {
  const [weekStructure, setWeekStructure] = useState('');
  const [dayStartTime, setDayStartTime] = useState('07:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (weekStructure) {
      onContinue({ weekStructure, dayStartTime });
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ProgressDots total={8} current={3} />

      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="font-display font-light italic text-4xl text-text">
              How does your week tend to look?
            </h1>
            <p className="font-ui font-light text-muted text-lg">
              No right answer — just helps Carry understand your rhythm.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {weekOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setWeekStructure(option.value)}
                    className={`p-4 rounded-xl font-ui text-left transition-all ${
                      weekStructure === option.value
                        ? 'bg-accent text-surface'
                        : 'bg-surface border border-border text-text hover:border-accent/30'
                    }`}
                  >
                    <span className="text-2xl mr-3">{option.emoji}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="font-ui text-sm text-muted">
                What time do you usually start your day?
              </label>
              <select
                value={dayStartTime}
                onChange={(e) => setDayStartTime(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-ui text-text focus:outline-none focus:border-accent transition-colors"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>
                    {time.replace(':', ':').replace(/^0/, '')} {parseInt(time) < 12 ? 'am' : 'pm'}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!weekStructure}
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
