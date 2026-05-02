import { useMemo } from 'react'
import { calcDailyProtein, calcZoneSplit } from '@/lib/utils'
import type { Entry, Settings, HabitData, TaskData } from '@/types'

export function useToday(entries: Entry[], settings: Settings) {
  return useMemo(() => {
    const protein = calcDailyProtein(entries)
    const zoneSplit = calcZoneSplit(entries)
    const trainingSessions = entries.filter(e => e.domain === 'training').length

    const habitEntries = entries.filter(e => e.domain === 'habit')
    const completedHabits = habitEntries.filter(e => (e.data as HabitData).completed)
    const totalHabits = settings.habits.length

    const taskEntries = entries.filter(e => e.domain === 'task')
    const completedTasks = taskEntries.filter(e => (e.data as TaskData).completed).length

    // Progress: weight each category equally
    const scores: number[] = []
    // Training: did at least 1 session? (simple daily check)
    scores.push(trainingSessions > 0 ? 1 : 0)
    // Protein: hit target?
    scores.push(totalHabits > 0 ? Math.min(protein / settings.protein_target_g, 1) : 0)
    // Habits: fraction done
    scores.push(totalHabits > 0 ? completedHabits.length / totalHabits : 0)
    // Tasks: fraction done (or 1 if none added)
    scores.push(taskEntries.length > 0 ? completedTasks / taskEntries.length : 0)

    const progress = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)

    return {
      protein,
      zoneSplit,
      trainingSessions,
      completedHabits: completedHabits.length,
      totalHabits,
      completedTasks,
      totalTasks: taskEntries.length,
      progress,
    }
  }, [entries, settings])
}
