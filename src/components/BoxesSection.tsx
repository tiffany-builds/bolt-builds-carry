import { Box } from '../types';

interface BoxCardProps {
  box: Box;
  onClick?: () => void;
}

function BoxCard({ box, onClick }: BoxCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 bg-surface rounded-xl p-5 border border-border w-36 hover:border-accent/30 transition-all active:scale-95"
    >
      <div className="text-3xl mb-3">{box.emoji}</div>
      <h3 className="font-ui font-medium text-text mb-1">{box.name}</h3>
      <p className="font-ui text-sm text-muted">{box.count} items</p>
    </button>
  );
}

interface BoxesSectionProps {
  boxes: Box[];
}

export function BoxesSection({ boxes }: BoxesSectionProps) {
  return (
    <div className="animate-fade-up stagger-4">
      <h2 className="text-xs uppercase tracking-wider text-muted font-ui font-medium mb-3">
        Your boxes
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
        {boxes.map((box) => (
          <BoxCard key={box.id} box={box} />
        ))}
      </div>
    </div>
  );
}
