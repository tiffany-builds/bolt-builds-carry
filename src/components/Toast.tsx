import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 2000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 bg-accent text-surface px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 transition-all duration-300 z-50 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      style={{ top: 'max(2rem, calc(env(safe-area-inset-top) + 1rem))' }}
    >
      <CheckCircle2 size={20} className="flex-shrink-0" />
      <span className="font-ui font-medium">{message}</span>
    </div>
  );
}
