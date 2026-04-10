// Scoremate Service Worker – Web Push

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Scoremate', body: event.data.text() }
  }

  const { title = 'Scoremate', body = '', url } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: url ? { url } : undefined,
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url
  if (!url) return

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing tab if open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Otherwise open new tab
        return clients.openWindow(url)
      })
  )
})
