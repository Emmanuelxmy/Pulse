export type DomainType = 'nutrition' | 'weight'

export interface NutritionData {
  label: string
  calories: number
  protein_g: number
}

export interface WeightData {
  weight_kg: number
}

export type EntryData = NutritionData | WeightData

export interface Entry {
  id: string
  created_at: string
  date: string
  domain: DomainType
  data: EntryData
  synced: boolean
}

export interface Settings {
  protein_target_g: number
  calorie_target: number
  weight_target_kg?: number
  weight_unit: 'kg' | 'lbs'
}

export const DEFAULT_SETTINGS: Settings = {
  protein_target_g: 150,
  calorie_target: 2500,
  weight_unit: 'kg',
}
