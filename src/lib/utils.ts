import type { Settings, ZoneType, Entry, TrainingData } from '@/types'

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
  // ISO week: Monday = 0 offset
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

export function classifyZone(avgHr: number, settings: Settings): ZoneType {
  if (avgHr < settings.zone1_ceiling_hr) return 'zone1'
  if (avgHr <= settings.zone2_ceiling_hr) return 'zone2'
  return 'hit'
}

export function calcDailyProtein(entries: Entry[]): number {
  return entries
    .filter(e => e.domain === 'nutrition')
    .reduce((sum, e) => sum + ((e.data as { protein_g: number }).protein_g ?? 0), 0)
}

export interface ZoneSplit {
  zone1_min: number
  zone2_min: number
  hit_min: number
  total_min: number
}

export function calcZoneSplit(entries: Entry[]): ZoneSplit {
  const training = entries.filter(e => e.domain === 'training')
  let zone1_min = 0, zone2_min = 0, hit_min = 0
  for (const e of training) {
    const d = e.data as TrainingData
    if (d.zone === 'zone1') zone1_min += d.duration_min
    else if (d.zone === 'zone2') zone2_min += d.duration_min
    else hit_min += d.duration_min
  }
  return { zone1_min, zone2_min, hit_min, total_min: zone1_min + zone2_min + hit_min }
}

export function getCoachSession(): 'morning' | 'night' {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'morning' : 'night'
}

export function getCoachCacheKey(date: string, session: 'morning' | 'night'): string {
  return `${date}_${session}`
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function minutesToDisplay(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function dayLabel(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
}
