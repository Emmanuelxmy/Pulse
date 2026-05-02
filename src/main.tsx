import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@/styles/globals.css'
import App from './App'

// Show a small banner when a new version is available so the installed
// PWA picks up changes without the user needing to remove + re-add it.
let swUpdateCb: (() => void) | null = null

const updateSW = registerSW({
  onNeedRefresh() {
    swUpdateCb?.()
  },
  onOfflineReady() {
    console.log('[Pulse] Ready for offline use')
  },
})

// Expose so App can wire up the banner
export function onSwUpdate(cb: () => void) {
  swUpdateCb = cb
}
export function applySwUpdate() {
  updateSW(true)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
