import { useState, useEffect } from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { getContextualEmoji } from '../utils/mindNudges';

interface Item {
  id: string;
  title: string;
  description: string | null;
  category: string;
  completed: boolean;
  time_frame: string;
  created_at: string;
  emoji?: string | null;
}

interface EverythingYouCarryProps {
  userId: string;
  onBack: () => void;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function getCategoryEmoji(category: string): string {
  return DEFAULT_CATEGORIES.find(c => c.name === category)?.emoji || '📁';
}

export function EverythingYouCarry({ userId, onBack }: EverythingYouCarryProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadItems();
  }, [userId]);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .is('recurring_parent_id', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.log('Error loading items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplete = async (itemId: string, currentCompleted: boolean) => {
    try {
      await supabase
        .from('items')
        .update({ completed: !currentCompleted })
        .eq('id', itemId);
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, completed: !currentCompleted } : item
      ));
    } catch (err) {
      console.log('Error toggling item:', err);
    }
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

  const activeItems = items.filter(i => !i.completed);
  const completedItems = items.filter(i => i.completed);

  const completedByMonth: Record<string, Item[]> = {};
  completedItems.forEach(item => {
    const key = getMonthKey(item.created_at);
    if (!completedByMonth[key]) completedByMonth[key] = [];
    completedByMonth[key].push(item);
  });
  const sortedMonths = Object.keys(completedByMonth).sort((a, b) => b.localeCompare(a));

  const ItemCard = ({ item }: { item: Item }) => (
    <div
      className={`bg-surface border border-border p-4 rounded-xl transition-all ${
        item.completed ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleComplete(item.id, item.completed)}
          className="flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center mt-0.5 active:scale-95"
          style={{
            borderColor: item.completed ? '#C4714A' : 'rgba(44,36,32,0.2)',
            backgroundColor: item.completed ? '#C4714A' : 'transparent',
          }}
        >
          {item.completed && (
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className={`font-ui font-medium ${item.completed ? 'line-through text-muted' : 'text-text'}`}>
            {item.emoji || getContextualEmoji(item.title, item.category)} {item.title}
          </h3>
          {item.description && (
            <p className="font-ui text-sm text-muted mt-1">{item.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="font-ui text-xs text-muted/70">
              {getCategoryEmoji(item.category)} {item.category}
            </span>
            <span className="text-muted/40">·</span>
            <span className="font-ui text-xs text-muted/70">
              {new Date(item.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-8">

        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:border-accent/30 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-text" />
          </button>
          <div>
            <h1 className="font-display italic font-light text-2xl text-text">
              Everything you Carry.
            </h1>
            <p className="font-ui text-sm text-muted">
              {activeItems.length} active · {completedItems.length} completed
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider text-muted font-ui font-medium">
                Active
              </h2>
              {activeItems.length === 0 ? (
                <p className="font-ui text-sm text-muted font-light py-2">
                  All clear. Enjoy it while it lasts.
                </p>
              ) : (
                <div className="space-y-2">
                  {activeItems.map(item => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {completedItems.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs uppercase tracking-wider text-muted font-ui font-medium">
                  Completed
                </h2>
                <div className="space-y-2">
                  {sortedMonths.map(monthKey => {
                    const monthItems = completedByMonth[monthKey];
                    const isExpanded = expandedMonths.has(monthKey);
                    return (
                      <div key={monthKey} className="bg-surface border border-border rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleMonth(monthKey)}
                          className="w-full flex items-center justify-between p-4 hover:bg-cream/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4 text-muted" />
                              : <ChevronRight className="w-4 h-4 text-muted" />
                            }
                            <span className="font-ui font-medium text-text">
                              {formatMonthLabel(monthKey)}
                            </span>
                          </div>
                          <span className="font-ui text-sm text-muted">
                            {monthItems.length} {monthItems.length === 1 ? 'item' : 'items'}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                            {monthItems.map(item => (
                              <ItemCard key={item.id} item={item} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div className="text-center py-12">
                <p className="font-ui text-muted font-light">
                  Nothing yet. It won't stay this way for long.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
