import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  isDev: () => ipcRenderer.invoke('is-dev'),
  platform: process.platform,
});

declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      isDev: () => Promise<boolean>;
      platform: NodeJS.Platform;
    };
  }
}
