import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  userName?: string;
  todayCount?: number;
}

export function Header({ userName = 'Tiffany', todayCount = 0 }: HeaderProps) {
  const { signOut } = useAuth();
  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="animate-fade-up stagger-1">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="font-display italic text-3xl font-light text-text leading-tight">
          {dayName} looks manageable, <em style={{color: '#C4714A', fontStyle: 'italic'}}>{userName}</em>.
        </h1>
        <button
          onClick={signOut}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center hover:border-accent/30 transition-all active:scale-95"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4 text-muted" />
        </button>
      </div>
      <p className="font-ui text-sm text-muted font-light">
        {formattedDate} · {todayCount} {todayCount === 1 ? 'thing' : 'things'} on today
      </p>
    </div>
  );
}
