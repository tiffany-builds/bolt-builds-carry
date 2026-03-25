import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Item {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
}

interface OnYourMindSectionProps {
  items: Item[];
  onItemsChange: () => void;
}

export function OnYourMindSection({ items, onItemsChange }: OnYourMindSectionProps) {
  const toggleComplete = async (itemId: string, currentCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ completed: !currentCompleted })
        .eq('id', itemId);

      if (error) throw error;
      onItemsChange();
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="animate-fade-up stagger-3">
      <h2 className="text-xs uppercase tracking-wider text-muted font-ui font-medium mb-3">
        On your mind
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-surface border border-border p-4 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleComplete(item.id, item.completed)}
                className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-border hover:border-accent transition-all flex items-center justify-center mt-0.5 active:scale-95"
              >
                {item.completed && (
                  <Check className="w-4 h-4 text-accent" strokeWidth={3} />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <h3 className="font-ui font-medium text-text">{item.title}</h3>
                {item.description && (
                  <p className="font-ui text-sm text-muted mt-1">{item.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
