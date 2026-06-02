import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const ENABLE_SERVICE_WORKER = import.meta.env.VITE_ENABLE_SERVICE_WORKER === "true";
const THANDIZO_CACHE_PREFIX = "thandizo-";

function clearLegacyServiceWorkers() {
  if (!("serviceWorker" in navigator)) return Promise.resolve();

  const unregisterExistingWorkers = navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())));

  const clearThandizoCaches = "caches" in window
    ? caches
        .keys()
        .then((cacheNames) => Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(THANDIZO_CACHE_PREFIX))
            .map((cacheName) => caches.delete(cacheName)),
        ))
    : Promise.resolve([]);

  return Promise.all([unregisterExistingWorkers, clearThandizoCaches]).then(() => undefined);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return Promise.resolve();

  if (!ENABLE_SERVICE_WORKER) {
    return clearLegacyServiceWorkers();
  }

  return navigator.serviceWorker
    .register("/service-worker.js", { updateViaCache: "none" })
    .then((registration) => registration.update())
    .then(() => undefined);
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
