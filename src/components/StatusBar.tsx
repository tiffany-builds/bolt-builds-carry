import { Capacitor } from '@capacitor/core';
export function StatusBar() {
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <div className="flex items-center justify-between py-3 px-5">
      <span className="font-ui text-sm font-medium text-text">
        {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
      </span>
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
