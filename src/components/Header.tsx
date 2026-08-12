interface HeaderProps {
  userName?: string;
  todayCount?: number;
  isBirthday?: boolean;
  onOpenSettings?: () => void;
  onOpenMenu?: () => void;
  onOpenCalendar?: () => void;
}

export function Header({ userName = 'Tiffany', todayCount = 0, isBirthday = false, onOpenSettings, onOpenMenu, onOpenCalendar }: HeaderProps) {
  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="animate-fade-up stagger-1">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="font-display italic text-3xl font-light text-text leading-tight">
            {isBirthday ? (
              `Happy Birthday, ${userName}. 🎂`
            ) : (
              <>{dayName} looks manageable, <em style={{color: '#C4714A', fontStyle: 'italic'}}>{userName}</em>.</>
            )}
          </h1>
          <p className="font-ui text-sm text-muted font-light">
            {formattedDate} · {todayCount} {todayCount === 1 ? 'thing' : 'things'} on today
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', flexShrink: 0 }}>
          {/* Calendar button */}
          <button
            onClick={onOpenCalendar}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#FDF9F4',
              border: '1.5px solid #D4C4B4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Calendar"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3.5" width="14" height="12" rx="2.5" stroke="#C4714A" strokeWidth="1.5"/>
              <line x1="2" y1="7.5" x2="16" y2="7.5" stroke="#C4714A" strokeWidth="1.5"/>
              <line x1="6" y1="2" x2="6" y2="5" stroke="#C4714A" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="2" x2="12" y2="5" stroke="#C4714A" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="6.5" cy="11" r="1" fill="#C4714A"/>
              <circle cx="9.5" cy="11" r="1" fill="#C4714A"/>
              <circle cx="12.5" cy="11" r="1" fill="#C4714A"/>
            </svg>
          </button>
          {/* Menu button */}
          <button
            onClick={onOpenMenu}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#FDF9F4',
              border: '1.5px solid #D4C4B4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Menu"
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <line x1="1" y1="1" x2="17" y2="1" stroke="#C4714A" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="1" y1="7" x2="17" y2="7" stroke="#C4714A" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="1" y1="13" x2="17" y2="13" stroke="#C4714A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
