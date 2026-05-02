import { useState, useEffect, useCallback } from 'react'
import { getSettings, saveSettings } from '@/lib/db'
import { syncSettings, pushSettings } from '@/lib/sync'
import { DEFAULT_SETTINGS } from '@/types'
import type { Settings } from '@/types'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Try local first for instant load
      const local = await getSettings()
      if (local) setSettings(local)
      setLoading(false)
      // Then sync from Supabase if online
      if (navigator.onLine) {
        try {
          const remote = await syncSettings()
          setSettings(remote)
        } catch {}
      }
    }
    load()
  }, [])

  const update = useCallback(async (patch: Partial<Settings>) => {
    const updated = { ...settings, ...patch }
    setSettings(updated)
    await saveSettings(updated)
    if (navigator.onLine) pushSettings(updated).catch(() => {})
  }, [settings])

  return { settings, loading, update }
}
