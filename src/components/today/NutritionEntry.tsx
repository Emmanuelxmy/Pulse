import { useState } from 'react'
import type { NutritionData, MealType, QualityType } from '@/types'

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
}
const QUALITY: QualityType[] = ['high', 'moderate', 'low']
const QUALITY_LABELS: Record<QualityType, string> = {
  high: 'High', moderate: 'Moderate', low: 'Low',
}
const QUALITY_COLORS: Record<QualityType, string> = {
  high: '#00F0B5', moderate: '#F59E0B', low: '#EF4444',
}
const QUICK_ADD = [10, 20, 30, 40]

interface Props { onSave: (data: NutritionData) => void }

export default function NutritionEntry({ onSave }: Props) {
  const [meal, setMeal] = useState<MealType>('lunch')
  const [protein, setProtein] = useState(0)
  const [quality, setQuality] = useState<QualityType>('high')
  const [notes, setNotes] = useState('')

  function handleSave() {
    onSave({ meal, protein_g: protein, quality, notes })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Meal pills */}
      <div>
        <label style={labelStyle}>Meal</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {MEALS.map(m => (
            <button key={m} onClick={() => setMeal(m)} style={pillStyle(m === meal, '#F59E0B')}>
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Protein input */}
      <div>
        <label style={labelStyle}>Protein (g)</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="number"
            value={protein || ''}
            onChange={e => setProtein(Number(e.target.value))}
            placeholder="0"
            style={{ ...inputStyle, marginTop: 0, flex: 1, fontSize: 22, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}
          />
        </div>
        {/* Quick-add buttons */}
        <div className="flex gap-2 mt-2">
          {QUICK_ADD.map(g => (
            <button
              key={g}
              onClick={() => setProtein(p => p + g)}
              style={{
                flex: 1, background: '#1E1E1E', border: '1px solid #2A2A2A',
                borderRadius: 10, padding: '10px 0', color: '#F59E0B', fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              +{g}g
            </button>
          ))}
        </div>
      </div>

      {/* Quality */}
      <div>
        <label style={labelStyle}>Quality</label>
        <div className="flex gap-2 mt-1">
          {QUALITY.map(q => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              style={pillStyle(q === quality, QUALITY_COLORS[q])}
            >
              {QUALITY_LABELS[q]}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes</label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="What did you eat?"
          style={inputStyle}
        />
      </div>

      <button onClick={handleSave} style={saveStyle}>Save</button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: '#888', fontWeight: 500, display: 'block', marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1E1E1E', border: '1px solid #2A2A2A', borderRadius: 10,
  padding: '12px 14px', color: '#F5F5F5', fontSize: 15, marginTop: 6,
  fontFamily: 'DM Sans, sans-serif', outline: 'none',
}
const saveStyle: React.CSSProperties = {
  width: '100%', background: '#F59E0B', color: '#0A0A0A', fontWeight: 700,
  fontSize: 15, borderRadius: 12, padding: '14px', border: 'none', cursor: 'pointer',
  marginTop: 4,
}

function pillStyle(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500, border: 'none',
    cursor: 'pointer', transition: 'all 0.15s',
    background: active ? `${color}20` : '#1E1E1E',
    color: active ? color : '#888',
    outline: active ? `1px solid ${color}40` : '1px solid transparent',
  }
}
