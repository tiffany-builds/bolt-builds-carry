import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { getContextualEmoji } from '../utils/mindNudges';
import { getCategoryDisplayName } from '../utils/categoryHelpers';
import { supabase } from '../lib/supabase';

interface Item {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  category: string;
  time_frame: string;
  created_at: string;
  date: string | null;
  time: string | null;
  has_date_time: boolean;
  type: string;
  start_date?: string | null;
  end_date?: string | null;
}

interface BoxDetailViewProps {
  categoryName: string;
  categoryEmoji: string;
  userId: string;
  onBack: () => void;
  items: Item[];
  onItemComplete: (itemId: string) => void;
  onItemDelete: (itemId: string) => void;
}

export function BoxDetailView({ categoryName, categoryEmoji, items, onBack, onItemComplete, onItemDelete }: BoxDetailViewProps) {
  const [swipingItemId, setSwipingItemId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

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
      onItemDelete(swipingItemId);
      setSwipingItemId(null);
      setSwipeOffset(0);
    } else {
      setSwipeOffset(0);
      setSwipingItemId(null);
    }
  };

  const updateItemTitle = async (itemId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    await supabase
      .from('items')
      .update({ title: newTitle.trim() })
      .eq('id', itemId);
  };

  const handleTitleClick = (item: Item) => {
    setEditingId(item.id);
    setEditingText(item.title);
  };

  const handleTitleBlur = async (itemId: string) => {
    if (editingText.trim() && editingText !== items.find(i => i.id === itemId)?.title) {
      await updateItemTitle(itemId, editingText);
    }
    setEditingId(null);
    setEditingText('');
  };

  const handleTitleKeyDown = async (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingText.trim() && editingText !== items.find(i => i.id === itemId)?.title) {
        await updateItemTitle(itemId, editingText);
      }
      setEditingId(null);
      setEditingText('');
    }
  };

  const displayName = getCategoryDisplayName(categoryName);

  return (
    <div className="min-h-screen bg-cream pb-32">
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
            <h1 className="font-ui font-medium text-2xl text-text">{displayName}</h1>
            <p className="font-ui text-sm text-muted">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="font-ui text-muted font-light">Nothing in here yet. Probably a good sign.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
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
                      onClick={() => onItemComplete(item.id)}
                      className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-border hover:border-accent transition-all flex items-center justify-center mt-0.5 active:scale-95"
                    >
                      {item.completed && (
                        <Check className="w-4 h-4 text-accent" strokeWidth={3} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => handleTitleBlur(item.id)}
                          onKeyDown={(e) => handleTitleKeyDown(e, item.id)}
                          className="font-ui font-medium text-text bg-transparent border-b border-accent/30 outline-none w-full"
                          autoFocus
                        />
                      ) : (
                        <h3
                          className="font-ui font-medium text-text cursor-pointer hover:text-accent/70 transition-colors"
                          onClick={() => handleTitleClick(item)}
                        >
                          {getContextualEmoji(item.title, item.category)} {item.title}
                        </h3>
                      )}
                      {item.description && (
                        <p className="font-ui text-sm text-muted mt-1">{item.description}</p>
                      )}
                      {/* Date display */}
                      {(item.date || item.start_date) && (
                        <p className="font-ui text-xs text-accent font-medium mt-1">
                          {new Date((item.date || item.start_date) + 'T00:00:00').toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {item.time && ` · ${item.time.slice(0, 5)}`}
                        </p>
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
