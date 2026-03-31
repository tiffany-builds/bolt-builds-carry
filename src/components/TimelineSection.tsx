import { useState } from 'react';
import { TimelineItem } from '../types';
import { getCategoryColor } from '../utils/categoryColors';
import { formatDayLabel, formatTime, getWeekDays, getTodayDateString } from '../utils/dateFormatting';
import { getContextualEmoji } from '../utils/mindNudges';
import { supabase } from '../lib/supabase';
import { Check } from 'lucide-react';

interface TimelineItemProps {
  item: TimelineItem;
  onComplete: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  swipingId: string | null;
  swipeOffset: number;
  onTouchStart: (e: React.TouchEvent, id: string) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (itemId: string) => void;
}

function TimelineItemCard({ item, onComplete, onDelete, swipingId, swipeOffset, onTouchStart, onTouchMove, onTouchEnd }: TimelineItemProps) {
  const borderColor = getCategoryColor(item.category);
  const isCompleted = item.completed;
  const displayEmoji = item.emoji || getContextualEmoji(item.title, item.category);

  const handleComplete = async () => {
    try {
      await supabase
        .from('items')
        .update({ completed: true })
        .eq('id', item.id);

      onComplete(item.id);
    } catch (err) {
      console.error('Error completing item:', err);
    }
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', marginBottom: '8px' }}>
      <div style={{
        position: 'absolute', inset: 0, background: '#ef4444',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: '20px', borderRadius: '12px'
      }}>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>Delete</span>
      </div>
      <div
        style={{
          transform: swipingId === item.id ? `translateX(-${swipeOffset}px)` : 'translateX(0)',
          transition: swipingId === item.id ? 'none' : 'transform 0.2s ease'
        }}
        onTouchStart={(e) => onTouchStart(e, item.id)}
        onTouchMove={onTouchMove}
        onTouchEnd={() => onTouchEnd(item.id)}
      >
        <div
          className={`bg-surface rounded-xl p-4 border-l-4 flex gap-4 transition-all ${
            isCompleted ? 'opacity-40' : ''
          }`}
          style={{ borderLeftColor: borderColor }}
        >
          <div className="flex-shrink-0 w-12 flex flex-col items-center gap-2">
            <p className={`font-ui text-sm font-medium ${isCompleted ? 'line-through' : ''}`}>
              {item.time ? formatTime(item.time) : '—'}
            </p>
            <button
              onClick={handleComplete}
              className="w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-200 ease-in-out"
              style={{
                borderColor: isCompleted ? '#C4714A' : 'rgba(44,36,32,0.2)',
                backgroundColor: isCompleted ? '#C4714A' : 'transparent',
              }}
              aria-label="Mark as complete"
            >
              {isCompleted && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </button>
          </div>
          <div className="flex-1">
            <h3 className={`font-ui font-medium text-text mb-1 ${isCompleted ? 'line-through' : ''}`}>
              {displayEmoji} {item.title}
              {((item as any).recurring || (item as any).recurring_parent_id) && (
                <span style={{
                  fontSize: '10px',
                  color: 'var(--muted)',
                  marginLeft: '6px',
                  opacity: 0.7
                }}>↻</span>
              )}
            </h3>
            {item.detail && (
              <p className="font-ui text-sm text-muted font-light">{item.detail}</p>
            )}
            {item.date && (
              <p className="font-ui text-xs text-muted/70 mt-1">
                {new Date(item.date + 'T00:00:00').toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <span
              className="text-xs font-ui font-medium px-2 py-1 rounded-full"
              style={{ backgroundColor: `${borderColor}20`, color: borderColor }}
            >
              {item.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimelineSectionProps {
  items: TimelineItem[];
  onItemComplete: (itemId: string) => void;
  onItemDelete: (itemId: string) => void;
  onShowToast: (message: string) => void;
}

interface DayGroup {
  date: Date;
  dateStr: string;
  isToday: boolean;
  items: TimelineItem[];
}

export function TimelineSection({ items, onItemComplete, onItemDelete, onShowToast }: TimelineSectionProps) {
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  const weekDays = getWeekDays();
  const todayStr = getTodayDateString();

  const timelineItems = items.filter(i => i.date);

  const itemsByDay: DayGroup[] = weekDays.map(day => {
    const dateStr = day.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const dayItems = timelineItems
      .filter(i => i.date === dateStr)
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
    return { date: day, dateStr, isToday, items: dayItems };
  });

  const visibleDays = itemsByDay.filter(d => d.isToday || d.items.length > 0);

  const handleComplete = (itemId: string) => {
    onItemComplete(itemId);
    onShowToast('Done — one less thing to carry');
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    setTouchStartX(e.touches[0].clientX);
    setSwipingId(id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingId) return;
    const diff = touchStartX - e.touches[0].clientX;
    if (diff > 0) setSwipeOffset(Math.min(diff, 100));
  };

  const handleTouchEnd = async (itemId: string) => {
    if (swipeOffset > 80) {
      onItemDelete(itemId);
    }
    setSwipeOffset(0);
    setSwipingId(null);
  };

  return (
    <div className="animate-fade-up stagger-3">
      {visibleDays.map((day, index) => (
        <div key={day.dateStr} className={index > 0 ? 'mt-6' : ''}>
          <h2 className="text-xs uppercase tracking-wider text-muted font-ui font-medium mb-3">
            {day.isToday ? 'Today' : formatDayLabel(day.date)}
          </h2>
          <div className="space-y-3">
            {day.items.length === 0 && day.isToday ? (
              <p className="font-ui text-sm text-muted font-light py-4">
                A quiet day. Rare — enjoy it.
              </p>
            ) : (
              day.items.map((item) => (
                <TimelineItemCard
                  key={item.id}
                  item={item}
                  onComplete={handleComplete}
                  onDelete={onItemDelete}
                  swipingId={swipingId}
                  swipeOffset={swipeOffset}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
