import { api } from './api'

export async function getPushConfig() {
  const [{ data: config }, { data: subscription }] = await Promise.all([
    api.get('/push/config/'),
    api.get('/push/subscription/'),
  ])
  return { ...config, subscribed: subscription.subscribed }
}

function decodeBase64Url(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0))
}

export async function enablePush(publicKey) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Ce navigateur ne prend pas en charge les notifications push.')
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Autorisez les notifications dans les réglages du navigateur.')
  const registration = await navigator.serviceWorker.register('/service-worker.js')
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeBase64Url(publicKey),
  })
  await api.post('/push/subscription/', subscription.toJSON())
}

export async function disablePush() {
  const registration = await navigator.serviceWorker.getRegistration('/service-worker.js')
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) {
    await api.delete('/push/subscription/', { data: { endpoint: subscription.endpoint } })
    await subscription.unsubscribe()
  } else {
    await api.delete('/push/subscription/')
  }
}
