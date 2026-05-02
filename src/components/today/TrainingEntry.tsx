import { useState } from 'react'
import { classifyZone } from '@/lib/utils'
import type { Settings, TrainingData, TrainingType } from '@/types'

const TYPES: TrainingType[] = ['skierg', 'run', 'bike', 'strength', 'intervals', 'other']
const TYPE_LABELS: Record<TrainingType, string> = {
  skierg: 'SkiErg', run: 'Run', bike: 'Bike',
  strength: 'Strength', intervals: 'Intervals', other: 'Other',
}

interface Props { settings: Settings; onSave: (data: TrainingData) => void }

export default function TrainingEntry({ settings, onSave }: Props) {
  const [type, setType] = useState<TrainingType>('skierg')
  const [duration, setDuration] = useState('')
  const [avgHr, setAvgHr] = useState('')
  const [maxHr, setMaxHr] = useState('')
  const [rpe, setRpe] = useState(5)
  const [notes, setNotes] = useState('')

  const zone = avgHr ? classifyZone(Number(avgHr), settings) : null
  const zoneLabel = zone === 'zone1' ? 'Zone 1 ✓' : zone === 'zone2' ? 'Zone 2 ⚠' : zone === 'hit' ? 'HIT 🔥' : null
  const zoneColor = zone === 'zone1' ? '#00F0B5' : zone === 'zone2' ? '#F59E0B' : '#EF4444'

  function handleSave() {
    if (!duration) return
    onSave({
      type,
      duration_min: Number(duration),
      avg_hr: avgHr ? Number(avgHr) : null,
      max_hr: maxHr ? Number(maxHr) : null,
      zone: zone ?? 'zone1',
      notes,
      rpe,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Type pills */}
      <div>
        <label style={labelStyle}>Type</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={pillStyle(t === type)}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label style={labelStyle}>Duration (minutes)</label>
        <input
          type="number"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          placeholder="30"
          style={inputStyle}
        />
      </div>

      {/* Avg HR + Zone badge */}
      <div>
        <label style={labelStyle}>Avg HR (bpm)</label>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="number"
            value={avgHr}
            onChange={e => setAvgHr(e.target.value)}
            placeholder="145"
            style={{ ...inputStyle, marginTop: 0, flex: 1 }}
          />
          {zoneLabel && (
            <span style={{
              background: `${zoneColor}20`,
              color: zoneColor,
              padding: '4px 10px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              {zoneLabel}
            </span>
          )}
        </div>
        {zone === 'zone2' && (
          <p style={{ fontSize: 11, color: '#F59E0B', marginTop: 4 }}>
            Try to stay under 152 or go above 165 bpm
          </p>
        )}
      </div>

      {/* Max HR */}
      <div>
        <label style={labelStyle}>Max HR (bpm) — optional</label>
        <input
          type="number"
          value={maxHr}
          onChange={e => setMaxHr(e.target.value)}
          placeholder="165"
          style={inputStyle}
        />
      </div>

      {/* RPE Slider */}
      <div>
        <label style={labelStyle}>
          RPE — <span style={{ color: '#00F0B5' }}>{rpe}</span>/10
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={rpe}
          onChange={e => setRpe(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#00F0B5', marginTop: 8 }}
        />
        <div className="flex justify-between" style={{ fontSize: 11, color: '#555' }}>
          <span>Easy</span><span>Max effort</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes</label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How did it feel?"
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
  width: '100%', background: '#00F0B5', color: '#0A0A0A', fontWeight: 700,
  fontSize: 15, borderRadius: 12, padding: '14px', border: 'none', cursor: 'pointer',
  marginTop: 4,
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500, border: 'none',
    cursor: 'pointer', transition: 'all 0.15s',
    background: active ? '#00F0B520' : '#1E1E1E',
    color: active ? '#00F0B5' : '#888',
    outline: active ? '1px solid #00F0B540' : '1px solid transparent',
  }
}
