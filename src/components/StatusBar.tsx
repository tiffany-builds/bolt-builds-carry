import { useEffect, useState } from 'react';

export function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="flex items-center justify-between py-3 px-5">
      <span className="font-ui text-sm font-medium text-text">{formattedTime}</span>
      <div className="flex items-center gap-1">
        <div className="w-1 h-1 bg-text rounded-full"></div>
        <div className="w-1 h-1 bg-text rounded-full"></div>
        <div className="w-1 h-1 bg-text rounded-full"></div>
        <div className="w-1 h-1 bg-text rounded-full"></div>
        <div className="w-1 h-1 bg-muted rounded-full"></div>
      </div>
    </div>
  );
}
