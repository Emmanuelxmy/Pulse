import { useState, useRef } from 'react'
import { Dumbbell, Drumstick, RotateCcw, Check, Calendar } from 'lucide-react'
import { formatTime, getTodayISO } from '@/lib/utils'
import { updateCalendarEvent } from '@/lib/calendar'
import type { Entry, TrainingData, NutritionData, TaskData, HabitData } from '@/types'

interface Props {
  entries: Entry[]
  onUpdate: (entry: Entry) => void
  onDelete: (id: string) => void
}

export default function EntryFeed({ entries, onUpdate, onDelete }: Props) {
  if (!entries.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: '#33334A', fontSize: 14 }}>
        Nothing logged yet — tap a tile to start
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map((entry, i) => (
        <EntryCard key={entry.id} entry={entry} index={i} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  )
}

function EntryCard({
  entry, index, onUpdate, onDelete,
}: { entry: Entry; index: number; onUpdate: (e: Entry) => void; onDelete: (id: string) => void }) {
  const [swipeX, setSwipeX] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const startX = useRef(0)

  function onTouchStart(e: React.TouchEvent) { startX.current = e.touches[0].clientX }
  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current
    if (dx < 0) setSwipeX(Math.max(dx, -80))
  }
  function onTouchEnd() {
    if (swipeX < -60) setDeleting(true)
    else setSwipeX(0)
  }

  if (deleting) {
    return (
      <div
        className="entry-card animate-fade-in"
        style={{
          ...cardStyle, justifyContent: 'space-between',
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.18)',
          animationDelay: `${index * 50}ms`,
        }}
      >
        <span style={{ color: '#EF4444', fontSize: 13 }}>Delete this entry?</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setDeleting(false)} style={cancelBtnStyle}>Cancel</button>
          <button onClick={() => onDelete(entry.id)} style={deleteBtnStyle}>Delete</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="entry-card animate-fade-in"
      style={{
        animationDelay: `${index * 50}ms`,
        transform: `translateX(${swipeX}px)`,
        transition: swipeX === 0 ? 'transform 0.2s ease' : 'none',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <CardContent entry={entry} onUpdate={onUpdate} />
    </div>
  )
}

function CardContent({ entry, onUpdate }: { entry: Entry; onUpdate: (e: Entry) => void }) {
  const { domain, data, created_at } = entry

  if (domain === 'training') {
    const d = data as TrainingData
    const zoneColor = d.zone === 'zone1' ? '#00F0B5' : d.zone === 'zone2' ? '#F59E0B' : '#EF4444'
    const zoneLabel = d.zone === 'zone1' ? 'Z1' : d.zone === 'zone2' ? 'Z2' : 'HIT'
    const zoneRgb = d.zone === 'zone1' ? '0,240,181' : d.zone === 'zone2' ? '245,158,11' : '239,68,68'
    return (
      <div style={cardStyle}>
        <div style={iconWrap('rgba(0,240,181,0.08)', 'rgba(0,240,181,0.14)')}>
          <Dumbbell size={15} color="#00F0B5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span style={titleStyle}>{d.type.charAt(0).toUpperCase() + d.type.slice(1)}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: `rgba(${zoneRgb},0.12)`, color: zoneColor, letterSpacing: '0.04em' }}>
              {zoneLabel}
            </span>
          </div>
          <div style={subStyle}>{d.duration_min}min{d.avg_hr ? ` · ${d.avg_hr}bpm` : ''} · RPE {d.rpe}</div>
        </div>
        <span style={timeStyle}>{formatTime(created_at)}</span>
      </div>
    )
  }

  if (domain === 'nutrition') {
    const d = data as NutritionData
    return (
      <div style={cardStyle}>
        <div style={iconWrap('rgba(245,158,11,0.08)', 'rgba(245,158,11,0.14)')}>
          <Drumstick size={15} color="#F59E0B" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={titleStyle}>{d.meal.charAt(0).toUpperCase() + d.meal.slice(1)}</span>
          <div style={subStyle}>
            <span style={{ color: '#00F0B5', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{d.protein_g}g</span>
            {' '}protein
            {d.calories ? <span style={{ color: '#A78BFA', fontFamily: 'JetBrains Mono, monospace' }}> · {d.calories}kcal</span> : null}
            {' · '}{d.quality}
          </div>
        </div>
        <span style={timeStyle}>{formatTime(created_at)}</span>
      </div>
    )
  }

  if (domain === 'task') {
    const d = data as TaskData
    function handleToggle() {
      const updated = { ...entry, data: { ...d, completed: !d.completed } }
      onUpdate(updated)
      if (d.gcal_event_id) {
        updateCalendarEvent(d.gcal_event_id, { ...d, completed: !d.completed }, entry.date ?? getTodayISO()).catch(() => {})
      }
    }
    return (
      <div style={cardStyle}>
        <button
          onClick={handleToggle}
          style={{
            width: 26, height: 26, borderRadius: 8, flexShrink: 0, border: 'none',
            background: d.completed ? '#00F0B5' : 'rgba(255,255,255,0.07)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {d.completed && <Check size={13} color="#080810" strokeWidth={3} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...titleStyle, textDecoration: d.completed ? 'line-through' : 'none', color: d.completed ? '#44445A' : '#F0F0F5' }}>
            {d.description}
          </span>
          <div style={{ ...subStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
            {d.category} · {d.priority}
            {d.gcal_event_id && <Calendar size={10} color="#60A5FA" />}
          </div>
        </div>
        <span style={timeStyle}>{formatTime(created_at)}</span>
      </div>
    )
  }

  if (domain === 'habit') {
    const d = data as HabitData
    return (
      <div style={cardStyle}>
        <div style={iconWrap('rgba(167,139,250,0.08)', 'rgba(167,139,250,0.14)')}>
          <RotateCcw size={15} color="#A78BFA" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...titleStyle, color: d.completed ? '#F0F0F5' : '#44445A' }}>{d.habit_name}</span>
          <div style={subStyle}>{d.completed ? '✓ Done' : 'Not done'}</div>
        </div>
        <span style={timeStyle}>{formatTime(created_at)}</span>
      </div>
    )
  }

  return null
}

const cardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
  padding: '12px 14px',
}
const titleStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#F0F0F5', display: 'block' }
const subStyle: React.CSSProperties = { fontSize: 12, color: '#44445A', marginTop: 2 }
const timeStyle: React.CSSProperties = {
  fontSize: 11, color: '#33334A', whiteSpace: 'nowrap', flexShrink: 0,
  fontFamily: 'JetBrains Mono, monospace',
}
const cancelBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', color: '#888',
  borderRadius: 8, padding: '6px 12px', fontSize: 12, border: 'none', cursor: 'pointer',
}
const deleteBtnStyle: React.CSSProperties = {
  background: '#EF4444', color: '#fff',
  borderRadius: 8, padding: '6px 12px', fontSize: 12, border: 'none', cursor: 'pointer', fontWeight: 700,
}
function iconWrap(bg: string, border: string): React.CSSProperties {
  return {
    width: 32, height: 32, borderRadius: 10, background: bg, border: `1px solid ${border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
}
