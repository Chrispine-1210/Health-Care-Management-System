import { usePlatform } from "@/hooks/usePlatform";
import { AlertCircle, Smartphone, Monitor, Globe } from "lucide-react";

export function PlatformBar() {
  const { platform, isPWA } = usePlatform();

  if (platform === 'web' && !isPWA) return null;

  const getPlatformInfo = () => {
    switch (platform) {
      case 'electron':
        return { icon: Monitor, label: 'Desktop App', color: 'bg-purple-100 text-purple-800' };
      case 'pwa':
        return { icon: Globe, label: 'Installed App', color: 'bg-blue-100 text-blue-800' };
      case 'mobile':
        return { icon: Smartphone, label: 'Mobile App', color: 'bg-green-100 text-green-800' };
      default:
        return { icon: AlertCircle, label: 'Web App', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const info = getPlatformInfo();
  const Icon = info.icon;

  return (
    <div className={`${info.color} px-3 py-2 text-xs font-medium flex items-center gap-2`}>
      <Icon className="w-4 h-4" />
      {info.label}
    </div>
  );
}
