import { TimelineItem } from '../types';
import { getCategoryColor } from '../utils/categoryColors';
import { formatDayLabel, formatTime, getWeekDays, getTodayDateString } from '../utils/dateFormatting';
import { getCategoryEmoji } from '../utils/mindNudges';

interface TimelineItemProps {
  item: TimelineItem;
}

function TimelineItemCard({ item }: TimelineItemProps) {
  const borderColor = getCategoryColor(item.category);
  const isCompleted = item.completed;

  return (
    <div
      className={`bg-surface rounded-xl p-4 border-l-4 flex gap-4 transition-all ${
        isCompleted ? 'opacity-40' : ''
      }`}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex-shrink-0 w-12">
        <p className={`font-ui text-sm font-medium ${isCompleted ? 'line-through' : ''}`}>
          {item.time ? formatTime(item.time) : '—'}
        </p>
      </div>
      <div className="flex-1">
        <h3 className={`font-ui font-medium text-text mb-1 ${isCompleted ? 'line-through' : ''}`}>
          {getCategoryEmoji(item.category)} {item.title}
        </h3>
        {item.detail && (
          <p className="font-ui text-sm text-muted font-light">{item.detail}</p>
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
  );
}

interface TimelineSectionProps {
  items: TimelineItem[];
}

interface DayGroup {
  date: Date;
  dateStr: string;
  isToday: boolean;
  items: TimelineItem[];
}

export function TimelineSection({ items }: TimelineSectionProps) {
  console.log("28. TimelineSection render - items:", items);

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
                Nothing on today yet
              </p>
            ) : (
              day.items.map((item) => (
                <TimelineItemCard key={item.id} item={item} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
