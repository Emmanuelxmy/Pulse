import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCoachRecommendations, getLastCoachUpdate, canManualRefresh } from '@/lib/coach'
import { getCoachCache, getEntriesByDomainAndDateRange } from '@/lib/db'
import { getCoachSession, getCoachCacheKey, getTodayISO } from '@/lib/utils'
import type { Entry, Settings, CoachResponse, CoachSession } from '@/types'

export function useCoach(todayEntries: Entry[], weekEntries: Entry[], settings: Settings) {
  const [response, setResponse] = useState<CoachResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [refreshAllowed, setRefreshAllowed] = useState(true)
  const [strengthEntries, setStrengthEntries] = useState<Entry[]>([])
  // Track whether we've done an auto-fetch so we don't repeat
  const autoFetched = useRef(false)

  const session: CoachSession = getCoachSession()
  const date = getTodayISO()
  const cacheKey = getCoachCacheKey(date, session)

  // Fetch recent strength entries for coach context
  useEffect(() => {
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    getEntriesByDomainAndDateRange('strength', fourteenDaysAgo.toISOString().slice(0, 10), date)
      .then(setStrengthEntries)
  }, [date])

  const updateRefreshAllowed = useCallback(async () => {
    const last = await getLastCoachUpdate(date, session)
    setLastUpdated(last)
    setRefreshAllowed(canManualRefresh(last))
  }, [date, session])

  // Load from cache on mount (don't auto-fetch yet — entries may not be loaded)
  useEffect(() => {
    autoFetched.current = false
    async function init() {
      const cached = await getCoachCache(cacheKey)
      if (cached) {
        setResponse(cached.response)
        setLastUpdated(cached.cachedAt)
        setRefreshAllowed(canManualRefresh(cached.cachedAt))
        autoFetched.current = true // cache satisfies the auto-fetch
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  // Auto-fetch once today's entries become available (they load async from IndexedDB)
  useEffect(() => {
    if (autoFetched.current || loading || !navigator.onLine) return
    if (todayEntries.length > 0) {
      autoFetched.current = true
      doFetch(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayEntries.length])

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
        strengthEntries,
        settings.goals ?? [],
        settings.body_stats ?? { age: 17, sex: 'male' },
        force,
      )
      setResponse(result)
      await updateRefreshAllowed()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
    setLoading(false)
  }

  const refresh = useCallback(() => {
    autoFetched.current = true
    return doFetch(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayEntries, weekEntries, settings, strengthEntries])

  return { response, loading, error, lastUpdated, session, refreshAllowed, refresh }
}
