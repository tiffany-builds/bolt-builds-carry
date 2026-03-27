import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Item {
  id: string;
  title: string;
  description: string | null;
  category: string;
  completed: boolean;
  time_frame: string;
  created_at: string;
}

interface EverythingYouCarryProps {
  userId: string;
  items: any[];
  onBack: () => void;
  onItemComplete: (itemId: string) => void;
}

export function EverythingYouCarry({ userId, items, onBack, onItemComplete }: EverythingYouCarryProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const toggleComplete = async (itemId: string, currentCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ completed: !currentCompleted })
        .eq('id', itemId);

      if (error) throw error;

      onItemComplete(itemId);
    } catch (err) {
      //('Error toggling item:', err);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'active') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  const groupedItems: Record<string, Item[]> = {};
  filteredItems.forEach(item => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category].push(item);
  });

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:border-accent/30 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-text" />
          </button>
          <div>
            <h1 className="font-ui font-medium text-2xl text-text">Everything you Carry</h1>
            <p className="font-ui text-sm text-muted">
              {items.length} total {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-ui text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-accent text-surface'
                : 'bg-surface border border-border text-muted hover:border-accent/30'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-ui text-sm font-medium transition-all ${
              filter === 'active'
                ? 'bg-accent text-surface'
                : 'bg-surface border border-border text-muted hover:border-accent/30'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-ui text-sm font-medium transition-all ${
              filter === 'completed'
                ? 'bg-accent text-surface'
                : 'bg-surface border border-border text-muted hover:border-accent/30'
            }`}
          >
            Completed
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="font-ui text-muted font-light">
              {filter === 'all' ? "You haven't captured anything yet" : `No ${filter} items`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} className="space-y-3">
                <h2 className="text-xs uppercase tracking-wider text-muted font-ui font-medium">
                  {category}
                </h2>
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-surface border border-border p-4 rounded-xl transition-all ${
                        item.completed ? 'opacity-60' : ''
                      }`}
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
                          <h3 className={`font-ui font-medium ${item.completed ? 'line-through text-muted' : 'text-text'}`}>
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="font-ui text-sm text-muted mt-1">{item.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {item.time_frame && item.time_frame !== 'future' && (
                              <p className="font-ui text-xs text-muted/70 capitalize">
                                {item.time_frame.replace('_', ' ')}
                              </p>
                            )}
                            <p className="font-ui text-xs text-muted/70">
                              {new Date(item.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
