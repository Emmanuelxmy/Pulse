import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { isCalendarConnected, createCalendarEvent } from '@/lib/calendar'
import { getTodayISO } from '@/lib/utils'
import type { TaskData, PriorityType, Settings } from '@/types'

const PRIORITY: PriorityType[] = ['high', 'medium', 'low']
const PRIORITY_COLORS: Record<PriorityType, string> = {
  high: '#EF4444', medium: '#F59E0B', low: '#888',
}

interface Props { settings: Settings; onSave: (data: TaskData) => void }

export default function TaskEntry({ settings, onSave }: Props) {
  const [category, setCategory] = useState(settings.task_categories[0] ?? 'Katalyst')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<PriorityType>('medium')
  const [syncCal, setSyncCal] = useState(false)
  const [calConnected, setCalConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setCalConnected(isCalendarConnected())
  }, [])

  async function handleSave() {
    if (!description.trim()) return
    const taskData: TaskData = {
      category,
      description: description.trim(),
      completed: false,
      priority,
    }

    if (syncCal && calConnected) {
      setSyncing(true)
      try {
        const eventId = await createCalendarEvent(taskData, getTodayISO())
        taskData.gcal_event_id = eventId
      } catch {}
      setSyncing(false)
    }

    onSave(taskData)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Category pills */}
      <div>
        <label style={labelStyle}>Category</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {settings.task_categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={pillStyle(c === category, '#F5F5F5')}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Task</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What needs to get done?"
          style={inputStyle}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          autoFocus
        />
      </div>

      {/* Priority */}
      <div>
        <label style={labelStyle}>Priority</label>
        <div className="flex gap-2 mt-1">
          {PRIORITY.map(p => (
            <button key={p} onClick={() => setPriority(p)} style={pillStyle(p === priority, PRIORITY_COLORS[p])}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar sync toggle — only shown if connected */}
      {calConnected && (
        <button
          onClick={() => setSyncCal(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: syncCal ? '#4285F420' : '#1A1A1A',
            border: `1px solid ${syncCal ? '#4285F440' : '#2A2A2A'}`,
            borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
          }}
        >
          <Calendar size={16} color={syncCal ? '#4285F4' : '#555'} />
          <span style={{ fontSize: 14, color: syncCal ? '#4285F4' : '#555', fontWeight: 500 }}>
            Add to Google Calendar
          </span>
          <div style={{
            marginLeft: 'auto', width: 36, height: 20, borderRadius: 99,
            background: syncCal ? '#4285F4' : '#2A2A2A', position: 'relative',
            transition: 'background 0.2s',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: syncCal ? 18 : 3,
              width: 14, height: 14, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s',
            }} />
          </div>
        </button>
      )}

      <button onClick={handleSave} disabled={syncing} style={saveStyle}>
        {syncing ? 'Adding to Calendar…' : 'Add Task'}
      </button>
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
  width: '100%', background: '#F5F5F5', color: '#0A0A0A', fontWeight: 700,
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
