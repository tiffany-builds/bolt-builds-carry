import { TimelineItem } from '../types';
import { getCategoryColor } from '../utils/categoryColors';

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
          {item.time}
        </p>
      </div>
      <div className="flex-1">
        <h3 className={`font-ui font-medium text-text mb-1 ${isCompleted ? 'line-through' : ''}`}>
          {item.title}
        </h3>
        <p className="font-ui text-sm text-muted font-light">{item.subtitle}</p>
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

export function TimelineSection({ items }: TimelineSectionProps) {
  return (
    <div className="animate-fade-up stagger-3">
      <h2 className="text-xs uppercase tracking-wider text-muted font-ui font-medium mb-3">
        Today
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <TimelineItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
