import { useState } from 'react'
import { Sparkles, ChevronRight, AlertCircle } from 'lucide-react'
import { estimateMacros } from '@/lib/nutrition'
import type { NutritionData, MealType, QualityType, MacroEstimate } from '@/types'

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const QUALITY: QualityType[] = ['high', 'moderate', 'low']
const QUALITY_COLORS: Record<QualityType, string> = {
  high: '#00F0B5', moderate: '#F59E0B', low: '#EF4444',
}

interface Props { onSave: (data: NutritionData) => void }

type Mode = 'ai' | 'manual'

export default function NutritionEntry({ onSave }: Props) {
  const [mode, setMode] = useState<Mode>('ai')

  // AI mode state
  const [description, setDescription] = useState('')
  const [estimating, setEstimating] = useState(false)
  const [estimate, setEstimate] = useState<MacroEstimate | null>(null)
  const [aiError, setAiError] = useState('')

  // Manual / confirmed state
  const [meal, setMeal]       = useState<MealType>('lunch')
  const [protein, setProtein] = useState(0)
  const [carbs, setCarbs]     = useState<number | undefined>(undefined)
  const [fat, setFat]         = useState<number | undefined>(undefined)
  const [calories, setCalories] = useState<number | undefined>(undefined)
  const [quality, setQuality] = useState<QualityType>('high')
  const [notes, setNotes]     = useState('')

  async function handleEstimate() {
    if (!description.trim()) return
    setEstimating(true)
    setAiError('')
    setEstimate(null)
    try {
      const result = await estimateMacros(description.trim())
      setEstimate(result)
      // Pre-fill manual fields from estimate
      setMeal(result.meal_type)
      setProtein(result.protein_g)
      setCarbs(result.carbs_g)
      setFat(result.fat_g)
      setCalories(result.calories)
      setQuality(result.quality)
    } catch {
      setAiError('Could not estimate — check your connection or try again.')
    }
    setEstimating(false)
  }

  function handleSave() {
    onSave({
      meal,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      calories,
      quality,
      notes: notes || description,
      raw_text: description || undefined,
    })
  }

  const canSave = protein > 0 || (mode === 'manual')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Mode toggle ── */}
      <div style={{
        display: 'flex', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 4,
      }}>
        {(['ai', 'manual'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: mode === m ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: mode === m ? '#F59E0B' : '#44445A',
            }}
          >
            {m === 'ai' ? '✦ AI Scan' : 'Manual'}
          </button>
        ))}
      </div>

      {/* ── AI mode ── */}
      {mode === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>What did you eat?</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={'e.g. "chicken breast with rice and broccoli, and a glass of milk"'}
              rows={3}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                padding: '12px 14px', color: '#F0F0F5', fontSize: 14,
                fontFamily: 'DM Sans, sans-serif', outline: 'none', resize: 'none',
                lineHeight: 1.6,
              }}
            />
          </div>

          <button
            onClick={handleEstimate}
            disabled={estimating || !description.trim()}
            style={{
              width: '100%',
              background: estimating || !description.trim()
                ? 'rgba(245,158,11,0.08)'
                : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: estimating || !description.trim() ? '#44445A' : '#080810',
              fontWeight: 700, fontSize: 14, borderRadius: 12, padding: '14px',
              border: '1px solid rgba(245,158,11,0.2)',
              cursor: estimating || !description.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
            }}
          >
            {estimating
              ? <><Spinner /> Analysing…</>
              : <><Sparkles size={16} /> Estimate Macros</>
            }
          </button>

          {/* Error */}
          {aiError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '10px 14px',
            }}>
              <AlertCircle size={14} color="#EF4444" />
              <span style={{ fontSize: 13, color: '#EF4444' }}>{aiError}</span>
            </div>
          )}

          {/* ── Macro result card ── */}
          {estimate && (
            <div style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.18)',
              borderRadius: 16, padding: '16px 18px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {/* Foods list */}
              <div>
                <p style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Identified foods
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {estimate.foods.map((f, i) => (
                    <span key={i} style={{
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: 99, padding: '3px 10px', fontSize: 12, color: '#F0F0F5',
                    }}>{f}</span>
                  ))}
                </div>
              </div>

              {/* Macro grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                <MacroCell label="Protein" value={estimate.protein_g} unit="g" color="#00F0B5" />
                <MacroCell label="Carbs"   value={estimate.carbs_g}   unit="g" color="#60A5FA" />
                <MacroCell label="Fat"     value={estimate.fat_g}     unit="g" color="#F59E0B" />
                <MacroCell label="kcal"    value={estimate.calories}  unit=""  color="#A78BFA" />
              </div>

              {/* Quality + reasoning */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  background: `${QUALITY_COLORS[estimate.quality]}15`,
                  color: QUALITY_COLORS[estimate.quality],
                  border: `1px solid ${QUALITY_COLORS[estimate.quality]}30`,
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                  textTransform: 'capitalize',
                }}>
                  {estimate.quality} quality
                </span>
                <span style={{ fontSize: 11, color: '#44445A', maxWidth: '60%', textAlign: 'right', lineHeight: 1.4 }}>
                  {estimate.reasoning}
                </span>
              </div>

              {/* Meal type (editable) */}
              <div>
                <label style={{ ...labelStyle, marginBottom: 6 }}>Meal type</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {MEALS.map(m => (
                    <button key={m} onClick={() => setMeal(m)} style={pillStyle(m === meal, '#F59E0B')}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                style={{
                  width: '100%', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#080810', fontWeight: 700, fontSize: 15, borderRadius: 12,
                  padding: '14px', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                Save meal <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Manual mode ── */}
      {mode === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Meal */}
          <div>
            <label style={labelStyle}>Meal</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MEALS.map(m => (
                <button key={m} onClick={() => setMeal(m)} style={pillStyle(m === meal, '#F59E0B')}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Macro inputs row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <NumberInput label="Protein (g)" value={protein} color="#00F0B5"
              onChange={setProtein} quickAdd={[10, 20, 30, 40]} required />
            <NumberInput label="Calories" value={calories ?? 0} color="#A78BFA"
              onChange={v => setCalories(v || undefined)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <NumberInput label="Carbs (g)" value={carbs ?? 0} color="#60A5FA"
              onChange={v => setCarbs(v || undefined)} />
            <NumberInput label="Fat (g)" value={fat ?? 0} color="#F59E0B"
              onChange={v => setFat(v || undefined)} />
          </div>

          {/* Quality */}
          <div>
            <label style={labelStyle}>Quality</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {QUALITY.map(q => (
                <button key={q} onClick={() => setQuality(q)} style={pillStyle(q === quality, QUALITY_COLORS[q])}>
                  {q.charAt(0).toUpperCase() + q.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <input
              type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="What did you eat?"
              style={inputStyle}
            />
          </div>

          <button onClick={handleSave} disabled={!canSave} style={{
            width: '100%', background: canSave
              ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
              : 'rgba(245,158,11,0.08)',
            color: canSave ? '#080810' : '#44445A',
            fontWeight: 700, fontSize: 15, borderRadius: 12,
            padding: '14px', border: 'none',
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}>
            Save
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────

function MacroCell({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div style={{
      background: `rgba(255,255,255,0.04)`, border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 10, padding: '10px 8px', textAlign: 'center',
    }}>
      <p className="font-data" style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>
        {value}{unit}
      </p>
      <p style={{ fontSize: 10, color: '#44445A', marginTop: 4, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </p>
    </div>
  )
}

function NumberInput({
  label, value, color, onChange, quickAdd, required: _req,
}: {
  label: string; value: number; color: string
  onChange: (v: number) => void; quickAdd?: number[]; required?: boolean
}) {
  return (
    <div>
      <label style={{ ...labelStyle, color }}>{label}</label>
      <input
        type="number" value={value || ''} onChange={e => onChange(Number(e.target.value))}
        placeholder="0"
        style={{ ...inputStyle, fontSize: 20, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color }}
      />
      {quickAdd && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {quickAdd.map(g => (
            <button key={g} onClick={() => onChange(value + g)} style={{
              flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '7px 0', color: '#44445A', fontSize: 11,
              fontWeight: 600, cursor: 'pointer',
            }}>+{g}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14, border: '2px solid rgba(8,8,16,0.3)',
      borderTop: '2px solid #080810', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

// ── Styles ──────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#44445A', fontWeight: 700, display: 'block',
  letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4,
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
  padding: '11px 14px', color: '#F0F0F5', fontSize: 15,
  fontFamily: 'DM Sans, sans-serif', outline: 'none',
}
function pillStyle(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500, border: 'none',
    cursor: 'pointer', transition: 'all 0.15s',
    background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
    color: active ? color : '#44445A',
    outline: active ? `1px solid ${color}35` : '1px solid transparent',
  }
}
