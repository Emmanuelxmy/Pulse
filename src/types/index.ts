export type DomainType = 'training' | 'nutrition' | 'task' | 'habit'
export type ZoneType = 'zone1' | 'zone2' | 'hit'
export type TrainingType = 'skierg' | 'run' | 'bike' | 'strength' | 'intervals' | 'other'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type QualityType = 'high' | 'moderate' | 'low'
export type PriorityType = 'high' | 'medium' | 'low'
export type PhaseType = 'phase1' | 'phase2'
export type CoachSession = 'morning' | 'night'

export interface TrainingData {
  type: TrainingType
  duration_min: number
  avg_hr: number | null
  max_hr: number | null
  zone: ZoneType
  notes: string
  rpe: number
}

export interface NutritionData {
  meal: MealType
  protein_g: number
  carbs_g?: number
  fat_g?: number
  calories?: number
  quality: QualityType
  notes: string
  raw_text?: string   // original freeform description
}

export interface MacroEstimate {
  foods: string[]
  protein_g: number
  carbs_g: number
  fat_g: number
  calories: number
  quality: QualityType
  meal_type: MealType
  reasoning: string
}

export interface TaskData {
  category: string
  description: string
  completed: boolean
  priority: PriorityType
  gcal_event_id?: string
}

export interface HabitData {
  habit_name: string
  completed: boolean
}

export type EntryData = TrainingData | NutritionData | TaskData | HabitData

export interface Entry {
  id: string
  created_at: string
  date: string          // ISO date "YYYY-MM-DD"
  domain: DomainType
  data: EntryData
  synced: boolean
}

export interface Recommendation {
  category: 'training' | 'nutrition' | 'habit' | 'task'
  priority: 'high' | 'medium' | 'low'
  action: string
  reasoning: string
}

export interface CoachResponse {
  summary: string
  recommendations: Recommendation[]
}

export interface CoachCacheEntry {
  key: string           // "YYYY-MM-DD_morning" | "YYYY-MM-DD_night"
  response: CoachResponse
  cachedAt: number      // Date.now()
}

export interface Settings {
  max_hr: number
  resting_hr: number
  zone1_ceiling_hr: number
  zone2_ceiling_hr: number
  hit_floor_hr: number
  protein_target_g: number
  training_phase: PhaseType
  sessions_per_week_target: number
  polarized_ratio: [number, number]
  habits: string[]
  task_categories: string[]
}

export const DEFAULT_SETTINGS: Settings = {
  max_hr: 190,
  resting_hr: 42,
  zone1_ceiling_hr: 152,
  zone2_ceiling_hr: 165,
  hit_floor_hr: 165,
  protein_target_g: 140,
  training_phase: 'phase1',
  sessions_per_week_target: 3,
  polarized_ratio: [80, 20],
  habits: [
    'Lower back prehab',
    'Shoulder prehab',
    'Bed by 10:30pm',
    'No phone first 30min',
    'Read 20min',
  ],
  task_categories: ['Katalyst', 'School prep', 'Life admin'],
}
