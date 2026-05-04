import { X, Archive, Calendar, Settings } from 'lucide-react';

interface NavigationSheetProps {
  onClose: () => void;
  onEverythingClick: () => void;
  onCalendarClick: () => void;
  onSettingsClick: () => void;
}

export function NavigationSheet({ onClose, onEverythingClick, onCalendarClick, onSettingsClick }: NavigationSheetProps) {
  const handleItem = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-text/30" />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-cream rounded-t-3xl shadow-2xl animate-fade-up"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-accent/20 rounded-full" />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between px-6 py-3 mb-2">
          <p className="font-display italic text-xl text-text font-light">Carry.</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:border-accent/30 transition-all"
          >
            <X className="w-3.5 h-3.5 text-muted" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-border mb-3" />

        {/* Nav items */}
        <div className="px-4 space-y-1">
          <button
            onClick={() => handleItem(onEverythingClick)}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-surface transition-all text-left active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Archive className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-ui font-medium text-text">Everything you Carry</p>
              <p className="font-ui text-xs text-muted mt-0.5">All your items in one place</p>
            </div>
          </button>

          <button
            onClick={() => handleItem(onCalendarClick)}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-surface transition-all text-left active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-ui font-medium text-text">Calendar</p>
              <p className="font-ui text-xs text-muted mt-0.5">Your week at a glance</p>
            </div>
          </button>

          <button
            onClick={() => handleItem(onSettingsClick)}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-surface transition-all text-left active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-ui font-medium text-text">Settings</p>
              <p className="font-ui text-xs text-muted mt-0.5">Account, sharing and more</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
