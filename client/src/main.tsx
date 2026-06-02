import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const ENABLE_SERVICE_WORKER = import.meta.env.VITE_ENABLE_SERVICE_WORKER === "true";
const THANDIZO_CACHE_PREFIX = "thandizo-";

async function clearLegacyServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith(THANDIZO_CACHE_PREFIX))
        .map((cacheName) => caches.delete(cacheName)),
    );
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (!ENABLE_SERVICE_WORKER) {
    await clearLegacyServiceWorkers();
    return;
  }

  const registration = await navigator.serviceWorker.register("/service-worker.js", {
    updateViaCache: "none",
  });

  await registration.update();
}

window.addEventListener("load", () => {
  if (!import.meta.env.PROD) return;

  registerServiceWorker().catch((error) => {
    console.warn("Service worker maintenance failed:", error);
  });
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Application root element #root was not found");
}

createRoot(rootElement).render(<App />);
