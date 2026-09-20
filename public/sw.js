// Service worker for owner order alerts.
//
// Pushes arrive without a payload on purpose (see src/lib/webpush.ts), so this
// asks the site what is new. That also means no customer data ever passes
// through the browser vendor's push servers.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let title = "New order";
      let body = "Open the admin panel to see it.";
      let url = "/admin";

      try {
        // Same-origin fetch, so the admin session cookie is sent automatically.
        const res = await fetch("/api/admin/push/latest", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.orderNo) {
            title = `New order ${data.orderNo}`;
            body = `Rs ${data.total} - ${data.customerName}, ${data.city}`;
            url = `/admin/orders/${data.orderNo}`;
          }
        }
      } catch {
        // Offline or signed out - still show the generic alert.
      }

      await self.registration.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "ks-order",
        renotify: true,
        requireInteraction: true,
        data: { url },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/admin";

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if (client.url.includes("/admin")) {
          await client.focus();
          return client.navigate(url);
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
