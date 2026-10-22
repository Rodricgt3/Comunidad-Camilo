const CACHE = "cg-garage-v1";
const BUILD_ASSETS = [];
const SCOPE = new URL("./", self.location.href).href;
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          SCOPE,
          SCOPE + "index.html",
          SCOPE + "manifest.json",
          SCOPE + "icons/icon-144.png",
          SCOPE + "icons/icon-192.png",
          SCOPE + "icons/apple-touch-icon.png",
          ...BUILD_ASSETS.map((path) => SCOPE + path),
        ]),
      )
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("cg-garage-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.href.startsWith(SCOPE)
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches
              .open(CACHE)
              .then((cache) => cache.put(SCOPE + "index.html", copy));
          }
          return response;
        })
        .catch(() => caches.match(SCOPE + "index.html")),
    );
    return;
  }
  if (url.pathname.includes("/assets/") || url.pathname.includes("/icons/"))
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches
                .open(CACHE)
                .then((cache) => cache.put(event.request, copy));
            }
            return response;
          }),
      ),
    );
});
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { notification: { body: event.data?.text() } };
  }
  const notification = data.notification || data.data || {};
  event.waitUntil(
    self.registration.showNotification(
      notification.title || "Camilo Guerra Cars",
      {
        body: notification.body || "Hay novedades en el garage.",
        icon: SCOPE + "icons/icon-192.png",
        badge: SCOPE + "icons/icon-192.png",
        data: { url: data.data?.url || SCOPE + "#/garage" },
      },
    ),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let url;
  try {
    url = new URL(event.notification.data?.url || SCOPE);
  } catch {
    url = new URL(SCOPE);
  }
  if (!url.href.startsWith(SCOPE)) url = new URL(SCOPE);
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        const client = clients.find((c) => c.url.startsWith(SCOPE));
        if (client) {
          await client.navigate(url.href);
          return client.focus();
        }
        return self.clients.openWindow(url.href);
      }),
  );
});
