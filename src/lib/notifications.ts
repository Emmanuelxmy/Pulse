// Web Push notification utilities

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string
const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY     = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ── Helpers ──────────────────────────────────────────────
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function getPermissionState(): NotificationPermission {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

// ── Permission ───────────────────────────────────────────
export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// ── Push subscription ────────────────────────────────────
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
    })
    return sub
  } catch {
    return null
  }
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export async function unsubscribeFromPush(): Promise<void> {
  const sub = await getExistingSubscription()
  if (sub) await sub.unsubscribe()
}

// ── Save subscription to Supabase ────────────────────────
export async function saveSubscription(
  sub: PushSubscription,
  prefs: NotificationPrefs,
): Promise<void> {
  if (!SUPABASE_URL || SUPABASE_URL.includes('placeholder')) return
  await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ id: 'default', subscription: sub.toJSON(), preferences: prefs }),
  })
}

// ── Send a test notification (via edge function) ─────────
export async function sendTestNotification(): Promise<void> {
  const sub = await getExistingSubscription()
  if (!sub) throw new Error('Not subscribed to push')
  const res = await fetch(`${SUPABASE_URL}/functions/v1/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      title: '✦ Pulse',
      body: 'Notifications are working!',
      url: '/',
    }),
  })
  if (!res.ok) throw new Error(await res.text())
}

// ── Notification preferences type ────────────────────────
export interface NotificationPrefs {
  morning: boolean       // 7 AM brief reminder
  evening: boolean       // 7 PM brief reminder
  habits: boolean        // 9 PM habit check
  protein: boolean       // noon protein check
}

export const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  morning: true,
  evening: true,
  habits: true,
  protein: false,
}
