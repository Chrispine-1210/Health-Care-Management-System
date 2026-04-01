import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for offline support and PWA
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.log('Service Worker registration failed:', error);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
