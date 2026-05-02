import { useState, useEffect, useCallback } from 'react'
import { fetchCoachRecommendations, getLastCoachUpdate, canManualRefresh } from '@/lib/coach'
import { getCoachCache } from '@/lib/db'
import { getCoachSession, getCoachCacheKey, getTodayISO } from '@/lib/utils'
import type { Entry, Settings, CoachResponse, CoachSession } from '@/types'

export function useCoach(todayEntries: Entry[], weekEntries: Entry[], settings: Settings) {
  const [response, setResponse] = useState<CoachResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [refreshAllowed, setRefreshAllowed] = useState(true)

  const session: CoachSession = getCoachSession()
  const date = getTodayISO()
  const cacheKey = getCoachCacheKey(date, session)

  const updateRefreshAllowed = useCallback(async () => {
    const last = await getLastCoachUpdate(date, session)
    setLastUpdated(last)
    setRefreshAllowed(canManualRefresh(last))
  }, [date, session])

  // Load cached response or auto-fetch on first open of this session window
  useEffect(() => {
    async function init() {
      const cached = await getCoachCache(cacheKey)
      if (cached) {
        setResponse(cached.response)
        setLastUpdated(cached.cachedAt)
        setRefreshAllowed(canManualRefresh(cached.cachedAt))
        return
      }
      // No cache for this session window — auto-fetch if online
      if (navigator.onLine) {
        await doFetch(false)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  async function doFetch(force: boolean) {
    if (!navigator.onLine) {
      setError('offline')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCoachRecommendations(
        todayEntries,
        weekEntries,
        settings,
        session,
        date,
        force,
      )
      setResponse(result)
      await updateRefreshAllowed()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
    setLoading(false)
  }

  const refresh = useCallback(() => doFetch(true), [todayEntries, weekEntries, settings])

  return { response, loading, error, lastUpdated, session, refreshAllowed, refresh }
}
