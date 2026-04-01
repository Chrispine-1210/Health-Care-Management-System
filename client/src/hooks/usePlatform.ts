export function usePlatform() {
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const isAndroid = /Android/.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isDesktop = !isMobile;
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  return {
    isElectron,
    isMobile,
    isAndroid,
    isIOS,
    isDesktop,
    isPWA,
    platform: isElectron ? 'electron' : isPWA ? 'pwa' : isMobile ? 'mobile' : 'web',
  };
}
