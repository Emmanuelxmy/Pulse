import type { Entry, NutritionData, WeightData } from '@/types'

export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  }
}

export function getWeekDates(weekStart: string): string[] {
  const dates: string[] = []
  const start = new Date(weekStart + 'T00:00:00')
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

export function calcDailyProtein(entries: Entry[]): number {
  return entries
    .filter(e => e.domain === 'nutrition')
    .reduce((sum, e) => sum + ((e.data as NutritionData).protein_g ?? 0), 0)
}

export function calcDailyCalories(entries: Entry[]): number {
  return entries
    .filter(e => e.domain === 'nutrition')
    .reduce((sum, e) => sum + ((e.data as NutritionData).calories ?? 0), 0)
}

export function getLatestWeight(entries: Entry[]): number | null {
  const weightEntries = entries.filter(e => e.domain === 'weight')
  if (!weightEntries.length) return null
  const latest = weightEntries.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  return (latest.data as WeightData).weight_kg
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function dayLabel(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10
}
