// Dropify Service Worker — handles Web Push notifications

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'New release', body: event.data.text() };
  }

  const options = {
    body: payload.body ?? '',
    icon: payload.icon ?? '/icon-192x192.png',
    badge: payload.badge ?? '/badge-72x72.png',
    tag: payload.tag ?? 'dropify-release',
    data: payload.data ?? {},
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open Spotify' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Dropify', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url ?? '/dashboard';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
