/// <reference lib="webworker" />

// Bundled by @ducanh2912/next-pwa and imported into the generated sw.js.
declare const self: ServiceWorkerGlobalScope;

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const data = event.notification.data as { url?: string } | undefined;
  const url = data?.url ?? "/";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find((c) => new URL(c.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        if ("navigate" in existing) await existing.navigate(url);
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});

// Ready for real Web Push later (requires a push server, not used yet)
self.addEventListener("push", (event: PushEvent) => {
  const payload = (event.data?.json() ?? {}) as { title?: string; body?: string; url?: string };
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Lịch sinh hoạt", {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      data: { url: payload.url ?? "/" },
    }),
  );
});

export {};
