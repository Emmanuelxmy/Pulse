import { useMemo } from 'react'
import { calcDailyProtein } from '@/lib/utils'
import type { Entry, Settings, NutritionData, StrengthData } from '@/types'

export function useToday(entries: Entry[], settings: Settings) {
  return useMemo(() => {
    const protein = calcDailyProtein(entries)
    const totalCalories = entries
      .filter(e => e.domain === 'nutrition')
      .reduce((sum, e) => sum + ((e.data as NutritionData).calories ?? 0), 0)
    const trainingSessions = entries.filter(e => e.domain === 'training').length
    const strengthSessions = entries.filter(e => e.domain === 'strength').length
    const strengthSets = entries
      .filter(e => e.domain === 'strength')
      .reduce((sum, e) => sum + (e.data as StrengthData).exercises.reduce((s, ex) => s + ex.sets, 0), 0)

    const scores: number[] = []
    scores.push(trainingSessions > 0 ? 1 : 0)
    scores.push(Math.min(protein / settings.protein_target_g, 1))
    scores.push(strengthSessions > 0 ? 1 : 0)

    const progress = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)

    return {
      protein,
      totalCalories,
      trainingSessions,
      strengthSessions,
      strengthSets,
      progress,
    }
  }, [entries, settings])
}
