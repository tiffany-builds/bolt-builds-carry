import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 2500 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 400);
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isCompletion = message.toLowerCase().includes('one less') ||
                       message.toLowerCase().includes('done') ||
                       message.toLowerCase().includes('completed');

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom) + 120px)',
        left: '14px',
        right: '14px',
        background: 'rgba(245,235,225,0.60)',
        backdropFilter: 'blur(8px)',
        borderRadius: '20px',
        border: '1px solid rgba(196,113,74,0.25)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 24px rgba(44,36,32,0.07)',
        zIndex: 55,
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        animation: 'borderBreath 3s ease-in-out infinite',
      }}
    >
      <div style={{
        width: '32px', height: '32px',
        borderRadius: '50%',
        background: 'rgba(196,113,74,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '14px',
        color: '#C4714A',
        fontWeight: 600,
      }}>
        {isCompletion ? '✓' : '✦'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '13px',
          color: '#2C2420',
          lineHeight: 1.4,
        }}>
          {message}
        </div>
      </div>
    </div>
  );
}
