import { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Item {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  category: string;
  time_frame: string;
  created_at: string;
}

interface BoxDetailViewProps {
  categoryName: string;
  categoryEmoji: string;
  userId: string;
  onBack: () => void;
}

export function BoxDetailView({ categoryName, categoryEmoji, userId, onBack }: BoxDetailViewProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [swipingItemId, setSwipingItemId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  useEffect(() => {
    loadItems();
  }, [categoryName, userId]);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .eq('category', categoryName)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error loading items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplete = async (itemId: string, currentCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ completed: !currentCompleted })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(item =>
        item.id === itemId ? { ...item, completed: !currentCompleted } : item
      ));
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== itemId));
      setSwipingItemId(null);
      setSwipeOffset(0);
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    setTouchStart(e.touches[0].clientX);
    setSwipingItemId(itemId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingItemId) return;
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 100));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 60 && swipingItemId) {
      deleteItem(swipingItemId);
    } else {
      setSwipeOffset(0);
      setSwipingItemId(null);
    }
  };

  const activeItems = items.filter(item => !item.completed);

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:border-accent/30 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-text" />
          </button>
          <div>
            <div className="text-3xl mb-1">{categoryEmoji}</div>
            <h1 className="font-ui font-medium text-2xl text-text">{categoryName}</h1>
            <p className="font-ui text-sm text-muted">
              {activeItems.length} {activeItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : activeItems.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="font-ui text-muted font-light">Nothing in this box yet</p>
            <p className="font-ui text-sm text-muted/70">
              Items you capture will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-xl"
                onTouchStart={(e) => handleTouchStart(e, item.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-end px-6 rounded-xl">
                  <span className="text-surface font-ui font-medium">Delete</span>
                </div>

                <div
                  className="bg-surface border border-border p-4 rounded-xl transition-transform"
                  style={{
                    transform: swipingItemId === item.id ? `translateX(-${swipeOffset}px)` : 'translateX(0)',
                  }}
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
                      {item.time_frame && item.time_frame !== 'future' && (
                        <p className="font-ui text-xs text-muted/70 mt-2 capitalize">
                          {item.time_frame.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
