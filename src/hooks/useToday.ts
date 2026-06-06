import { useMemo } from 'react'
import { calcDailyProtein, calcDailyCalories, getLatestWeight } from '@/lib/utils'
import type { Entry, Settings } from '@/types'

export function useToday(entries: Entry[], settings: Settings) {
  return useMemo(() => {
    const protein = calcDailyProtein(entries)
    const calories = calcDailyCalories(entries)
    const weight = getLatestWeight(entries)

    const proteinPct = Math.min((protein / (settings.protein_target_g || 1)) * 100, 100)
    const caloriePct = Math.min((calories / (settings.calorie_target || 1)) * 100, 100)

    return { protein, calories, weight, proteinPct, caloriePct }
  }, [entries, settings])
}
