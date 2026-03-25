import { TimelineItem } from '../types';
import { getContextualEmoji } from '../utils/mindNudges';
import { formatLookforwardDate, getDaysUntil } from '../utils/lookforwardHelpers';

interface LookForwardSectionProps {
  items: TimelineItem[];
  onRemoveItem: (itemId: string) => void;
}

export function LookForwardSection({ items, onRemoveItem }: LookForwardSectionProps) {
  const lookforwardItems = items.filter(item => item.type === 'lookforward');

  if (lookforwardItems.length === 0) {
    return null;
  }

  return (
    <div style={{
      padding: '0 28px',
      marginTop: '24px',
      marginBottom: '24px'
    }}>
      <div style={{
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--taupe)',
        fontWeight: 500,
        marginBottom: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        Something to look forward to
      </div>

      {lookforwardItems.map(item => (
        <div
          key={item.id}
          style={{
            background: 'linear-gradient(135deg, rgba(196,113,74,0.08), rgba(212,194,133,0.12))',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '12px',
            border: '1px solid rgba(196,113,74,0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '14px',
            fontSize: '18px',
            opacity: 0.4
          }}>
            ✦
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '24px' }}>
              {getContextualEmoji(item.title, item.category)}
            </span>
            <div>
              <div style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '17px',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'var(--deep)',
                lineHeight: 1.2
              }}>
                {item.title}
              </div>
              {item.start_date && (
                <div style={{
                  fontSize: '11px',
                  color: 'var(--terra)',
                  fontWeight: 500,
                  marginTop: '2px',
                  letterSpacing: '0.04em'
                }}>
                  {formatLookforwardDate(item.start_date, item.end_date)}
                </div>
              )}
            </div>
          </div>

          {item.excitement && (
            <div style={{
              fontSize: '13px',
              color: 'var(--bark)',
              fontWeight: 300,
              lineHeight: 1.5,
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic'
            }}>
              "{item.excitement}"
            </div>
          )}

          <div style={{
            marginTop: '10px',
            fontSize: '11px',
            color: 'var(--taupe)',
            fontWeight: 400
          }}>
            {item.start_date && getDaysUntil(item.start_date)}
          </div>

          <button
            onClick={() => onRemoveItem(item.id)}
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '14px',
              background: 'none',
              border: 'none',
              fontSize: '14px',
              color: 'var(--taupe)',
              cursor: 'pointer',
              padding: 0
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
