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
      <p style={{ color: '#444', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
        Nothing logged yet today. Tap a tile above to start.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          index={i}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
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

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
  }
  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current
    if (dx < 0) setSwipeX(Math.max(dx, -80))
  }
  function onTouchEnd() {
    if (swipeX < -60) {
      setDeleting(true)
    } else {
      setSwipeX(0)
    }
  }

  if (deleting) {
    return (
      <div
        className="entry-card animate-fade-in flex items-center justify-between rounded-xl px-4 py-3"
        style={{ background: '#EF444420', border: '1px solid #EF444440', animationDelay: `${index * 40}ms` }}
      >
        <span style={{ color: '#EF4444', fontSize: 14 }}>Delete this entry?</span>
        <div className="flex gap-2">
          <button
            onClick={() => setDeleting(false)}
            style={{ background: '#1E1E1E', color: '#888', borderRadius: 8, padding: '6px 12px', fontSize: 13, border: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            style={{ background: '#EF4444', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 13, border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="entry-card animate-fade-in"
      style={{ animationDelay: `${index * 40}ms`, transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? 'transform 0.2s' : 'none' }}
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
    return (
      <div style={cardStyle}>
        <div style={iconWrap('#00F0B520')}><Dumbbell size={16} color="#00F0B5" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span style={cardTitle}>{d.type.charAt(0).toUpperCase() + d.type.slice(1)}</span>
            <span style={{ background: `${zoneColor}20`, color: zoneColor, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
              {zoneLabel}
            </span>
          </div>
          <div style={cardSub}>
            {d.duration_min}min{d.avg_hr ? ` · ${d.avg_hr} bpm avg` : ''} · RPE {d.rpe}
          </div>
        </div>
        <span style={timeStyle}>{formatTime(created_at)}</span>
      </div>
    )
  }

  if (domain === 'nutrition') {
    const d = data as NutritionData
    return (
      <div style={cardStyle}>
        <div style={iconWrap('#F59E0B20')}><Drumstick size={16} color="#F59E0B" /></div>
        <div className="flex-1 min-w-0">
          <span style={cardTitle}>{d.meal.charAt(0).toUpperCase() + d.meal.slice(1)}</span>
          <div style={cardSub}>
            <span style={{ color: '#00F0B5', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{d.protein_g}g</span> protein · {d.quality}
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
      // Sync completion state to Google Calendar
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
            background: d.completed ? '#00F0B5' : '#2A2A2A', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {d.completed && <Check size={13} color="#0A0A0A" strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          <span style={{ ...cardTitle, textDecoration: d.completed ? 'line-through' : 'none', color: d.completed ? '#555' : '#F5F5F5' }}>
            {d.description}
          </span>
          <div style={{ ...cardSub, display: 'flex', alignItems: 'center', gap: 6 }}>
            {d.category} · {d.priority}
            {d.gcal_event_id && <Calendar size={11} color="#4285F4" />}
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
        <div style={iconWrap('#A78BFA20')}><RotateCcw size={16} color="#A78BFA" /></div>
        <div className="flex-1 min-w-0">
          <span style={{ ...cardTitle, color: d.completed ? '#F5F5F5' : '#666' }}>{d.habit_name}</span>
          <div style={cardSub}>{d.completed ? '✓ Done' : 'Not done'}</div>
        </div>
        <span style={timeStyle}>{formatTime(created_at)}</span>
      </div>
    )
  }

  return null
}

const cardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12,
  padding: '12px 14px',
}
const cardTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: '#F5F5F5', display: 'block',
}
const cardSub: React.CSSProperties = {
  fontSize: 12, color: '#666', marginTop: 2,
}
const timeStyle: React.CSSProperties = {
  fontSize: 11, color: '#444', whiteSpace: 'nowrap', flexShrink: 0,
}
function iconWrap(bg: string): React.CSSProperties {
  return {
    width: 34, height: 34, borderRadius: 10, background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
}
