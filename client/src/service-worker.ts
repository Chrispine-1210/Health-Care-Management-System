/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = "thandizo-shell-v2";
const APP_SHELL_ASSETS = ["/", "/index.html", "/manifest.json", "/favicon.png"];

sw.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL_ASSETS);
    }),
  );

  sw.skipWaiting();
});

sw.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ),
    ),
  );

  sw.clients.claim();
});

sw.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === sw.location.origin;

  if (!isSameOrigin) {
    return;
  }

  // Keep authenticated API traffic out of the cache.
  if (url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ success: false, message: "Offline" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put("/index.html", responseClone);
          });
          return response;
        })
        .catch(async () => {
          const cachedShell = await caches.match("/index.html");
          return cachedShell || Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkResponse = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => cachedResponse || Response.error());

      return cachedResponse || networkResponse;
    }),
  );
});

sw.addEventListener("push", (event: PushEvent) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options: NotificationOptions = {
    body: data.body || "New update from Thandizo Pharmacy",
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: data.tag || "thandizo-notification",
    requireInteraction: Boolean(data.requireInteraction),
  };

  event.waitUntil(
    sw.registration.showNotification(data.title || "Thandizo Pharmacy", options),
  );
});

sw.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients: readonly Client[]) => {
      const existingClient = clients[0];

      if (existingClient && "focus" in existingClient) {
        return (existingClient as WindowClient).focus().then(() => {
          if ("navigate" in existingClient) {
            return (existingClient as WindowClient).navigate("/notifications");
          }
          return undefined;
        });
      }

      return sw.clients.openWindow("/notifications");
    }),
  );
});
