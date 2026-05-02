import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
clientsClaim()

// Injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST)

// ── Push notification handler ────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() as {
    title?: string
    body?: string
    url?: string
    icon?: string
  } ?? {}

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Pulse', {
      body: data.body ?? '',
      icon: data.icon ?? '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url ?? '/' },
      // Subtle vibration on Android
      // @ts-expect-error – vibrate is not in all TS libs yet
      vibrate: [80, 40, 80],
    })
  )
})

// ── Notification click → open / focus the app ────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        const existing = clientList.find((c) => 'focus' in c)
        if (existing) return (existing as WindowClient).focus()
        // Otherwise open a new window
        return self.clients.openWindow(url)
      })
  )
})
