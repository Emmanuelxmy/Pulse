import { useState, useEffect } from 'react'
import { syncUnsynced, pullEntriesFromSupabase } from '@/lib/sync'
import { getWeekRange, getTodayISO } from '@/lib/utils'

export function useSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      setSyncing(true)
      try {
        await syncUnsynced()
        const { start, end } = getWeekRange(new Date())
        await pullEntriesFromSupabase(start, end)
      } catch {}
      setSyncing(false)
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Sync on mount if online
    if (navigator.onLine) {
      handleOnline()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, syncing }
}

export function useSyncOnMount() {
  useEffect(() => {
    if (!navigator.onLine) return
    const today = getTodayISO()
    const { start, end } = getWeekRange(new Date())
    pullEntriesFromSupabase(start, end).catch(() => {})
    syncUnsynced().catch(() => {})
    // Pull a bit of history
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    pullEntriesFromSupabase(monthAgo.toISOString().slice(0, 10), today).catch(() => {})
  }, [])
}
