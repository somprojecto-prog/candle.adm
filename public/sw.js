self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(d.title || "CTRL + SHIFT + CANDLE", {
      body: d.body || "Nova encomenda recebida.",
      icon: d.icon || "/icon-192.png",
      badge: d.badge || "/icon-192.png",
      tag: d.tag || "encomenda",
      data: { url: d.url || "/manager" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/manager";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(url).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
