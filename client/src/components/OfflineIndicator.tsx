import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg flex items-center gap-2 z-50 shadow-lg" data-testid="offline-indicator">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">You're offline</span>
    </div>
  );
}
