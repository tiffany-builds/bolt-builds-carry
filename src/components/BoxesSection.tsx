import { UserCategory } from '../types';

interface BoxCardProps {
  name: string;
  emoji: string;
  count: number;
  onClick?: () => void;
}

function BoxCard({ name, emoji, count, onClick }: BoxCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 bg-surface rounded-xl p-5 border border-border w-36 hover:border-accent/30 transition-all active:scale-95"
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-ui font-medium text-text mb-1">{name}</h3>
      <p className="font-ui text-sm text-muted">{count} {count === 1 ? 'item' : 'items'}</p>
    </button>
  );
}

interface BoxesSectionProps {
  categories: UserCategory[];
  categoryCounts: Record<string, number>;
  onBoxClick: (category: UserCategory) => void;
}

export function BoxesSection({ categories, categoryCounts, onBoxClick }: BoxesSectionProps) {
  console.log("29. BoxesSection render - categories:", categories);
  console.log("30. BoxesSection render - categoryCounts:", categoryCounts);

  return (
    <div className="animate-fade-up stagger-4">
      <h2 className="text-xs uppercase tracking-wider text-muted font-ui font-medium mb-3">
        Your boxes
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
        {categories.map((category) => (
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
