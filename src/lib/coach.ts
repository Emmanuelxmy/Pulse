import { supabase } from '@/lib/supabase'
import { getCoachCache, setCoachCache } from '@/lib/db'
import { getCoachCacheKey } from '@/lib/utils'
import type { Entry, Settings, CoachResponse, CoachSession, Goal, BodyStats } from '@/types'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export async function fetchCoachRecommendations(
  todayEntries: Entry[],
  weekEntries: Entry[],
  settings: Settings,
  session: CoachSession,
  date: string,
  strengthEntries: Entry[],
  goals: Goal[],
  bodyStats: BodyStats,
  forceRefresh = false,
): Promise<CoachResponse> {
  const cacheKey = getCoachCacheKey(date, session)

  if (!forceRefresh) {
    const cached = await getCoachCache(cacheKey)
    if (cached) return cached.response
  } else {
    const cached = await getCoachCache(cacheKey)
    if (cached && Date.now() - cached.cachedAt < TWO_HOURS_MS) {
      return cached.response
    }
  }

  const { data, error } = await supabase.functions.invoke('coach', {
    body: {
      today_entries: todayEntries,
      week_entries: weekEntries,
      strength_entries: strengthEntries,
      goals,
      body_stats: bodyStats,
      settings,
      session,
    },
  })

  if (error) throw new Error(error.message)

  const response = data as CoachResponse

  await setCoachCache({ key: cacheKey, response, cachedAt: Date.now() })

  return response
}

export async function getLastCoachUpdate(date: string, session: CoachSession): Promise<number | null> {
  const cached = await getCoachCache(getCoachCacheKey(date, session))
  return cached ? cached.cachedAt : null
}

export function canManualRefresh(cachedAt: number | null): boolean {
  if (!cachedAt) return true
  return Date.now() - cachedAt >= TWO_HOURS_MS
}
