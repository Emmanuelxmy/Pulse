export type DomainType = 'training' | 'nutrition' | 'strength'
export type ZoneType = 'zone1' | 'zone2' | 'hit'
export type TrainingType = 'skierg' | 'run' | 'bike' | 'strength' | 'intervals' | 'other'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type QualityType = 'high' | 'moderate' | 'low'
export type PhaseType = 'phase1' | 'phase2'
export type CoachSession = 'morning' | 'night'
export type GoalCategory = 'strength' | 'nutrition' | 'cardio'

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
  raw_text?: string
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

export interface StrengthExercise {
  name: string
  sets: number
  reps: number
  weight_lbs: number
  notes?: string
}

export interface StrengthData {
  exercises: StrengthExercise[]
  raw_text: string
  progression_notes?: string
  session_notes?: string
}

export interface StrengthParseResult {
  exercises: StrengthExercise[]
  progression: string
}

export interface Goal {
  id: string
  category: GoalCategory
  description: string
  target_value: number
  target_unit: string
  current_value: number
  target_date?: string
  created_at: string
  exercise_name?: string
}

export interface BodyStats {
  height_cm?: number
  weight_kg?: number
  age: number
  sex: 'male' | 'female'
}

export type EntryData = TrainingData | NutritionData | StrengthData

export interface Entry {
  id: string
  created_at: string
  date: string
  domain: DomainType
  data: EntryData
  synced: boolean
}

export interface Recommendation {
  category: 'training' | 'nutrition' | 'strength' | 'goal'
  priority: 'high' | 'medium' | 'low'
  action: string
  reasoning: string
}

export interface CoachResponse {
  summary: string
  recommendations: Recommendation[]
}

export interface CoachCacheEntry {
  key: string
  response: CoachResponse
  cachedAt: number
}

export interface Settings {
  max_hr: number
  resting_hr: number
  zone1_ceiling_hr: number
  zone2_ceiling_hr: number
  hit_floor_hr: number
  protein_target_g: number
  calorie_target: number       // cut / goal calories
  calorie_maintenance: number  // maintenance calories (bar turns red above this)
  training_phase: PhaseType
  sessions_per_week_target: number
  polarized_ratio: [number, number]
  goals: Goal[]
  body_stats: BodyStats
}

export const DEFAULT_SETTINGS: Settings = {
  max_hr: 190,
  resting_hr: 42,
  zone1_ceiling_hr: 152,
  zone2_ceiling_hr: 165,
  hit_floor_hr: 165,
  protein_target_g: 140,
  calorie_target: 2650,
  calorie_maintenance: 3100,
  training_phase: 'phase1',
  sessions_per_week_target: 3,
  polarized_ratio: [80, 20],
  goals: [],
  body_stats: { age: 17, sex: 'male' },
}
