import { useState, useEffect, useRef } from 'react'
import { Trash2, Plus, Settings as SettingsIcon, X, ChevronDown, Scale, Flame, Beef } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine, Cell,
  ResponsiveContainer, LineChart, Line, Dot,
} from 'recharts'
import { useEntries } from '@/hooks/useEntries'
import { useToday } from '@/hooks/useToday'
import { getTodayISO, getWeekRange, getWeekDates, formatTime, dayLabel, calcDailyCalories, calcDailyProtein, getLatestWeight, kgToLbs, lbsToKg } from '@/lib/utils'
import { getEntriesByDateRange } from '@/lib/db'
import { clearAllData } from '@/lib/db'
import type { Settings, NutritionData, WeightData, Entry } from '@/types'

// ─── colour tokens ────────────────────────────────────────────────────────────
const C = {
  cal: '#F97316',
  protein: '#F59E0B',
  weight: '#6366F1',
  bg: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',
  muted: '#44445A',
  text: '#F0F0F5',
  dim: '#8A8A99',
}

// ─── shared styles ─────────────────────────────────────────────────────────
const glass: React.CSSProperties = {
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}

const eyebrow: React.CSSProperties = {
  fontSize: 10, color: C.muted, fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 99,
        width: `${Math.min(pct, 100)}%`,
        background: color,
        boxShadow: pct > 5 ? `0 0 8px ${color}55` : 'none',
        transition: 'width 0.5s ease',
      }} />
    </div>
  )
}

// ─── Modal (bottom sheet) ─────────────────────────────────────────────────────
function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div
        style={{
          ...glass,
          width: '100%',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
          borderBottom: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── NumberInput ──────────────────────────────────────────────────────────────
function NumberInput({ label, value, onChange, unit, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ ...eyebrow, display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder={placeholder ?? '0'}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, padding: '12px 14px', background: 'none', border: 'none',
            color: C.text, fontSize: 16, outline: 'none', fontFamily: 'inherit',
          }}
        />
        {unit && (
          <span style={{ padding: '0 14px', color: C.muted, fontSize: 13, fontWeight: 600 }}>{unit}</span>
        )}
      </div>
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ ...eyebrow, display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '12px 14px', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
          borderRadius: 10, color: C.text, fontSize: 16, outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

function PrimaryButton({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onPress}
      style={{
        width: '100%', padding: '14px', marginTop: 4,
        background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.12)`,
        borderRadius: 12, color: C.text, fontSize: 15, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

// ─── Weekly chart helpers ─────────────────────────────────────────────────────
interface DayBar { day: string; value: number; isToday: boolean }

function WeekBarChart({ data, target, color }: {
  data: DayBar[]; target: number; color: string
}) {
  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={data} barCategoryGap="28%" margin={{ top: 6, right: 0, left: -28, bottom: 0 }}>
        <XAxis dataKey="day" tick={{ fontSize: 9, fill: C.muted, fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, Math.max(target * 1.3, 100)]} hide />
        <ReferenceLine y={target} stroke={color} strokeDasharray="3 3" strokeOpacity={0.35} strokeWidth={1} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.isToday ? color : `${color}55`}
              style={{ filter: entry.isToday ? `drop-shadow(0 0 4px ${color}88)` : 'none' }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function WeekLineChart({ data, color }: { data: DayBar[]; color: string }) {
  const hasValues = data.some(d => d.value > 0)
  if (!hasValues) {
    return (
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: C.muted }}>No data logged this week</span>
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
        <XAxis dataKey="day" tick={{ fontSize: 9, fill: C.muted, fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Line
          type="monotone" dataKey="value" stroke={color} strokeWidth={2}
          dot={({ cx, cy, payload }) => (
            payload.value > 0
              ? <Dot key={`dot-${payload.day}`} cx={cx} cy={cy} r={payload.isToday ? 4 : 2.5} fill={payload.isToday ? color : `${color}99`} stroke="none" />
              : <g key={`dot-${payload.day}`} />
          )}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ settings, onUpdate, onClose }: {
  settings: Settings; onUpdate: (p: Partial<Settings>) => void; onClose: () => void
}) {
  const [calTarget, setCalTarget] = useState(String(settings.calorie_target))
  const [proteinTarget, setProteinTarget] = useState(String(settings.protein_target_g))
  const [weightGoal, setWeightGoal] = useState(
    settings.weight_target_kg != null
      ? String(settings.weight_unit === 'lbs'
          ? kgToLbs(settings.weight_target_kg)
          : settings.weight_target_kg)
      : ''
  )
  const [unit, setUnit] = useState<'kg' | 'lbs'>(settings.weight_unit ?? 'kg')
  const [confirmClear, setConfirmClear] = useState(false)

  function save() {
    const cal = parseInt(calTarget) || settings.calorie_target
    const prot = parseInt(proteinTarget) || settings.protein_target_g
    const wGoalVal = weightGoal
      ? (unit === 'lbs' ? lbsToKg(parseFloat(weightGoal)) : parseFloat(weightGoal))
      : undefined
    onUpdate({ calorie_target: cal, protein_target_g: prot, weight_target_kg: wGoalVal, weight_unit: unit })
    onClose()
  }

  async function handleClear() {
    await clearAllData()
    window.location.reload()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div
        style={{
          ...glass,
          width: '100%', maxHeight: '90dvh', overflowY: 'auto',
          borderRadius: '20px 20px 0 0', borderBottom: 'none',
          padding: '20px 20px calc(24px + env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* handle */}
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 99, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Settings</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Daily targets */}
        <p style={{ ...eyebrow, marginBottom: 14 }}>Daily targets</p>

        <NumberInput label="Calories" value={calTarget} onChange={setCalTarget} unit="kcal" />
        <NumberInput label="Protein" value={proteinTarget} onChange={setProteinTarget} unit="g" />

        <div style={{ marginBottom: 14 }}>
          <label style={{ ...eyebrow, display: 'block', marginBottom: 6 }}>Weight goal</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
              borderRadius: 10, overflow: 'hidden',
            }}>
              <input
                type="number" inputMode="decimal" value={weightGoal} placeholder="–"
                onChange={e => setWeightGoal(e.target.value)}
                style={{ flex: 1, padding: '12px 14px', background: 'none', border: 'none', color: C.text, fontSize: 16, outline: 'none', fontFamily: 'inherit' }}
              />
              <span style={{ padding: '0 14px', color: C.muted, fontSize: 13, fontWeight: 600 }}>{unit}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['kg', 'lbs'] as const).map(u => (
                <button key={u} onClick={() => setUnit(u)} style={{
                  padding: '0 14px', borderRadius: 10, border: `1px solid ${unit === u ? C.weight : C.border}`,
                  background: unit === u ? `${C.weight}22` : 'rgba(255,255,255,0.04)',
                  color: unit === u ? C.weight : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        <PrimaryButton onPress={save}>Save</PrimaryButton>

        {/* Danger zone */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <p style={{ ...eyebrow, marginBottom: 14 }}>Data</p>
          {confirmClear ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmClear(false)} style={{
                flex: 1, padding: '12px', borderRadius: 10, border: `1px solid ${C.border}`,
                background: 'rgba(255,255,255,0.04)', color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleClear} style={{
                flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Yes, clear all</button>
            </div>
          ) : (
            <button onClick={() => setConfirmClear(true)} style={{
              width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.03)', color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Clear all data</button>
          )}
        </div>

        <p style={{ marginTop: 28, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
          Pulse v1.0
        </p>
      </div>
    </div>
  )
}

// ─── Main Tracker View ────────────────────────────────────────────────────────
export default function TodayView({ settings, onUpdateSettings }: {
  settings: Settings
  onUpdateSettings: (p: Partial<Settings>) => void
}) {
  const today = getTodayISO()
  const { entries, add, remove } = useEntries(today)
  const { protein, calories, weight, proteinPct, caloriePct } = useToday(entries, settings)

  const [weekEntries, setWeekEntries] = useState<Entry[]>([])
  const [showMealModal, setShowMealModal] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showWeekly, setShowWeekly] = useState(false)

  // Meal form state
  const [mealLabel, setMealLabel] = useState('')
  const [mealCals, setMealCals] = useState('')
  const [mealProtein, setMealProtein] = useState('')

  // Weight form state
  const displayUnit = settings.weight_unit ?? 'kg'
  const [weightInput, setWeightInput] = useState('')

  const { start, end } = getWeekRange(new Date())
  const weekDates = getWeekDates(start)

  useEffect(() => {
    getEntriesByDateRange(start, end).then(all =>
      setWeekEntries(all.filter(e => e.domain === 'nutrition' || e.domain === 'weight'))
    )
  }, [start, end, entries]) // re-fetch when today's entries change

  // Build per-day stats for weekly charts
  const weekCalData: DayBar[] = weekDates.map(d => {
    const dayEntries = weekEntries.filter(e => e.date === d)
    return { day: dayLabel(d), value: calcDailyCalories(dayEntries), isToday: d === today }
  })
  const weekProteinData: DayBar[] = weekDates.map(d => {
    const dayEntries = weekEntries.filter(e => e.date === d)
    return { day: dayLabel(d), value: calcDailyProtein(dayEntries), isToday: d === today }
  })
  const weekWeightData: DayBar[] = weekDates.map(d => {
    const dayEntries = weekEntries.filter(e => e.date === d)
    const wkg = getLatestWeight(dayEntries)
    const val = wkg != null ? (displayUnit === 'lbs' ? kgToLbs(wkg) : wkg) : 0
    return { day: dayLabel(d), value: val, isToday: d === today }
  })

  // Weekday averages for the header
  const calAvg = Math.round(weekCalData.reduce((s, d) => s + d.value, 0) / weekCalData.filter(d => d.value > 0).length) || 0
  const proteinAvg = Math.round(weekProteinData.reduce((s, d) => s + d.value, 0) / weekProteinData.filter(d => d.value > 0).length) || 0

  function resetMealForm() { setMealLabel(''); setMealCals(''); setMealProtein('') }

  async function saveMeal() {
    const data: NutritionData = {
      label: mealLabel || 'Meal',
      calories: parseFloat(mealCals) || 0,
      protein_g: parseFloat(mealProtein) || 0,
    }
    await add('nutrition', data)
    resetMealForm()
    setShowMealModal(false)
  }

  async function saveWeight() {
    const raw = parseFloat(weightInput)
    if (!raw) return
    const kg = displayUnit === 'lbs' ? lbsToKg(raw) : raw
    const data: WeightData = { weight_kg: kg }
    await add('weight', data)
    setWeightInput('')
    setShowWeightModal(false)
  }

  const displayWeight = weight != null
    ? (displayUnit === 'lbs' ? kgToLbs(weight) : weight)
    : null

  const weightGoalDisplay = settings.weight_target_kg != null
    ? (displayUnit === 'lbs' ? kgToLbs(settings.weight_target_kg) : settings.weight_target_kg)
    : null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Calorie colour
  const calColor = caloriePct >= 100 ? '#EF4444' : caloriePct > 80 ? C.cal : '#10B981'

  return (
    <div style={{ padding: '16px 18px 8px', maxWidth: 480, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 4, letterSpacing: '0.01em' }}>
          {dateStr}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          {greeting}.
        </h1>
      </div>

      {/* ── Daily targets card ── */}
      <div style={{ ...glass, padding: '18px 18px 16px', marginBottom: 12 }}>
        {/* Calories row */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={12} color={C.cal} strokeWidth={2.5} />
              <span style={{ ...eyebrow }}>Calories</span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, letterSpacing: '-0.02em' }}>
              <span style={{ color: calColor, fontWeight: 700 }}>{calories.toLocaleString()}</span>
              <span style={{ color: C.muted }}> / {settings.calorie_target.toLocaleString()}</span>
            </span>
          </div>
          <ProgressBar pct={caloriePct} color={calColor} />
        </div>

        {/* Protein row */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Beef size={12} color={C.protein} strokeWidth={2.5} />
              <span style={{ ...eyebrow }}>Protein</span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, letterSpacing: '-0.02em' }}>
              <span style={{ color: C.protein, fontWeight: 700 }}>{protein}g</span>
              <span style={{ color: C.muted }}> / {settings.protein_target_g}g</span>
            </span>
          </div>
          <ProgressBar pct={proteinPct} color={C.protein} />
        </div>

        {/* Weight row */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Scale size={12} color={C.weight} strokeWidth={2.5} />
              <span style={{ ...eyebrow }}>Weight</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              {displayWeight != null ? (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: C.weight, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {displayWeight} {displayUnit}
                </span>
              ) : (
                <span style={{ fontSize: 12, color: C.muted }}>Not logged</span>
              )}
              {weightGoalDisplay != null && (
                <span style={{ fontSize: 11, color: C.muted }}>
                  goal {weightGoalDisplay} {displayUnit}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick-add buttons ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button onClick={() => setShowMealModal(true)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '12px', borderRadius: 12,
          background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)',
          color: C.cal, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Plus size={15} strokeWidth={2.5} /> Log Meal
        </button>
        <button onClick={() => setShowWeightModal(true)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '12px', borderRadius: 12,
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)',
          color: C.weight, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Plus size={15} strokeWidth={2.5} /> Log Weight
        </button>
      </div>

      {/* ── Today's log ── */}
      {entries.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={eyebrow}>Today's log</p>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted }}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
            {entries.map(entry => (
              <EntryRow key={entry.id} entry={entry} displayUnit={displayUnit} onDelete={() => remove(entry.id)} />
            ))}
          </div>
        </>
      )}

      {entries.length === 0 && (
        <div style={{
          ...glass,
          padding: '28px 20px', marginBottom: 28, textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: C.muted }}>Nothing logged yet today</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>Tap Log Meal or Log Weight to start</p>
        </div>
      )}

      {/* ── This Week ── */}
      <button
        onClick={() => setShowWeekly(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', marginBottom: 14,
        }}
      >
        <p style={eyebrow}>This week</p>
        <ChevronDown
          size={14} color={C.muted} strokeWidth={2}
          style={{ transform: showWeekly ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      {showWeekly && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Calories chart */}
          <div style={{ ...glass, padding: '14px 14px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Flame size={11} color={C.cal} strokeWidth={2.5} />
                <span style={eyebrow}>Calories</span>
              </div>
              {calAvg > 0 && (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted }}>
                  avg {calAvg.toLocaleString()} kcal
                </span>
              )}
            </div>
            <WeekBarChart data={weekCalData} target={settings.calorie_target} color={C.cal} />
          </div>

          {/* Protein chart */}
          <div style={{ ...glass, padding: '14px 14px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Beef size={11} color={C.protein} strokeWidth={2.5} />
                <span style={eyebrow}>Protein</span>
              </div>
              {proteinAvg > 0 && (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted }}>
                  avg {proteinAvg}g
                </span>
              )}
            </div>
            <WeekBarChart data={weekProteinData} target={settings.protein_target_g} color={C.protein} />
          </div>

          {/* Weight trend */}
          <div style={{ ...glass, padding: '14px 14px 8px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <Scale size={11} color={C.weight} strokeWidth={2.5} />
              <span style={eyebrow}>Weight trend</span>
            </div>
            <WeekLineChart data={weekWeightData} color={C.weight} />
          </div>
        </div>
      )}

      {/* ── Settings floating button ── */}
      <button
        onClick={() => setShowSettings(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(20px + env(safe-area-inset-bottom))',
          right: 20,
          zIndex: 40,
          width: 44, height: 44,
          borderRadius: 99,
          background: 'rgba(12,12,18,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
        }}
      >
        <SettingsIcon size={18} color={C.muted} strokeWidth={1.8} />
      </button>

      {/* ── Modals ── */}
      {showMealModal && (
        <Modal title="Log Meal" onClose={() => { setShowMealModal(false); resetMealForm() }}>
          <TextInput label="Label" value={mealLabel} onChange={setMealLabel} placeholder="e.g. Breakfast, Chicken salad…" />
          <NumberInput label="Calories" value={mealCals} onChange={setMealCals} unit="kcal" />
          <NumberInput label="Protein" value={mealProtein} onChange={setMealProtein} unit="g" />
          <PrimaryButton onPress={saveMeal}>Save meal</PrimaryButton>
        </Modal>
      )}

      {showWeightModal && (
        <Modal title="Log Weight" onClose={() => { setShowWeightModal(false); setWeightInput('') }}>
          <NumberInput
            label={`Weight (${displayUnit})`}
            value={weightInput}
            onChange={setWeightInput}
            unit={displayUnit}
            placeholder={displayWeight != null ? String(displayWeight) : '0'}
          />
          <PrimaryButton onPress={saveWeight}>Save weight</PrimaryButton>
        </Modal>
      )}

      {showSettings && (
        <SettingsPanel settings={settings} onUpdate={onUpdateSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

// ─── Entry Row ────────────────────────────────────────────────────────────────
function EntryRow({ entry, displayUnit, onDelete }: {
  entry: Entry; displayUnit: 'kg' | 'lbs'; onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      timerRef.current = setTimeout(() => setConfirming(false), 2500)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
      onDelete()
    }
  }

  const isNutrition = entry.domain === 'nutrition'
  const data = entry.data as (NutritionData & WeightData)

  let primary = ''
  let secondary = ''

  if (isNutrition) {
    primary = data.label || 'Meal'
    const parts: string[] = []
    if (data.calories) parts.push(`${data.calories} kcal`)
    if (data.protein_g) parts.push(`${data.protein_g}g protein`)
    secondary = parts.join(' · ')
  } else {
    const wVal = displayUnit === 'lbs' ? kgToLbs(data.weight_kg) : data.weight_kg
    primary = `${wVal} ${displayUnit}`
    secondary = 'Weight'
  }

  const accentColor = isNutrition ? C.cal : C.weight

  return (
    <div style={{
      ...glass,
      padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: 99, flexShrink: 0,
        background: accentColor, boxShadow: `0 0 6px ${accentColor}88`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.2, marginBottom: 2 }}>{primary}</p>
        <p style={{ fontSize: 11, color: C.muted }}>{secondary}</p>
      </div>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>
        {formatTime(entry.created_at)}
      </span>
      <button
        onClick={handleDelete}
        style={{
          background: confirming ? 'rgba(239,68,68,0.12)' : 'none',
          border: confirming ? '1px solid rgba(239,68,68,0.25)' : '1px solid transparent',
          borderRadius: 8, padding: '5px 8px', cursor: 'pointer',
          color: confirming ? '#EF4444' : C.muted,
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        {confirming
          ? <span style={{ fontSize: 10, fontWeight: 700 }}>delete?</span>
          : <Trash2 size={13} strokeWidth={1.8} />
        }
      </button>
    </div>
  )
}
