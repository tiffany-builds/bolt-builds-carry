import { getCategoryDisplayName } from '../utils/categoryHelpers';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';

interface BoxCardProps {
  name: string;
  emoji: string;
  count: number;
  onClick?: () => void;
}

function BoxCard({ name, emoji, count, onClick }: BoxCardProps) {
  const displayName = getCategoryDisplayName(name);
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 bg-surface rounded-xl p-5 border border-border w-36 hover:border-accent/30 transition-all active:scale-95"
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-ui font-medium text-text mb-1">{displayName}</h3>
      <p className="font-ui text-sm text-muted">{count} {count === 1 ? 'item' : 'items'}</p>
    </button>
  );
}

interface BoxesSectionProps {
  categoryCounts: Record<string, number>;
  onBoxClick: (category: { id: string; name: string; emoji: string; color: string }) => void;
}

export function BoxesSection({ categoryCounts, onBoxClick }: BoxesSectionProps) {
  return (
    <div className="animate-fade-up stagger-4">
      <h2 className="text-xs uppercase tracking-wider text-muted font-ui font-medium mb-3">
        Your boxes
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
        {DEFAULT_CATEGORIES.map((category) => (
          <BoxCard
            key={category.id}
            name={category.name}
            emoji={category.emoji}
            count={categoryCounts[category.name] || 0}
            onClick={() => onBoxClick(category)}
          />
        ))}
      </div>
    </div>
  );
}
