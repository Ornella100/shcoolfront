self.addEventListener('push', (event) => {
  const data = (() => {
    try { return event.data ? event.data.json() : {} }
    catch { return { body: event.data?.text() || '' } }
  })()
  event.waitUntil(self.registration.showNotification(data.title || 'SchoolConnect', {
    body: data.body || 'Vous avez une nouvelle information scolaire.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: data.url || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url.startsWith(self.location.origin))
    if (existing) return existing.navigate(target).then(() => existing.focus())
    return self.clients.openWindow(target)
  }))
})
