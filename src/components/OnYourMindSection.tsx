import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { addNudgesToMindItems, getContextualEmoji, type MindItem } from '../utils/mindNudges';

interface OnYourMindSectionProps {
  items: MindItem[];
  onItemsChange: (itemId: string) => void;
}

export function OnYourMindSection({ items, onItemsChange }: OnYourMindSectionProps) {
  const mindItems = items.filter(item =>
    item.type === 'mind' ||
    item.type === 'idea' ||
    item.type === 'Ideas' ||
    (!item.hasDateTime && item.category === 'Ideas')
  );

  //("OnYourMindSection - Total items:", items.length);
  //("OnYourMindSection - Mind items:", mindItems);

  if (mindItems.length === 0) {
    return null;
  }

  const mindItemsWithNudges = addNudgesToMindItems(mindItems);

  const dismissMindItem = async (itemId: string) => {
    try {
      await supabase.from('items').update({ completed: true }).eq('id', itemId);
    } catch (err) {
    }
    onItemsChange(itemId);
  };

  return (
    <div className="animate-fade-up stagger-3">
      <h2 className="text-xs uppercase tracking-wider text-muted font-ui font-medium mb-3">
        On your mind
      </h2>
      <div className="space-y-3">
        {mindItemsWithNudges.map((item) => (
          <div
            key={item.id}
            className={`border border-border rounded-xl p-4 ${
              item.nudgeMessage
                ? 'bg-[#fef9f7]'
                : 'bg-surface'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-xl mt-0.5">
                {getContextualEmoji(item.title, item.category)}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-ui font-medium text-text text-[15px]">
                  {item.title}
                </h3>
                {item.detail && (
                  <p className="font-ui text-sm text-muted mt-1">
                    {item.detail}
                  </p>
                )}
                {item.nudgeMessage && (
                  <p className="font-ui text-sm text-[#c17854] mt-2">
                    {item.nudgeMessage}
                  </p>
                )}
              </div>

              <button
                onClick={() => dismissMindItem(item.id)}
                className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-border/50 transition-colors flex items-center justify-center text-muted hover:text-text"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
