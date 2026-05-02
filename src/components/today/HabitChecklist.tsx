import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { Entry, HabitData, Settings } from '@/types'

interface Props {
  entries: Entry[]
  settings: Settings
  onToggle: (habitName: string, completed: boolean, existingEntry?: Entry) => void
}

export default function HabitChecklist({ entries, settings, onToggle }: Props) {
  const [states, setStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const map: Record<string, boolean> = {}
    for (const e of entries) {
      if (e.domain === 'habit') {
        const d = e.data as HabitData
        map[d.habit_name] = d.completed
      }
    }
    setStates(map)
  }, [entries])

  function getEntry(name: string) {
    return entries.find(e => e.domain === 'habit' && (e.data as HabitData).habit_name === name)
  }

  function toggle(name: string) {
    const next = !states[name]
    setStates(prev => ({ ...prev, [name]: next }))
    onToggle(name, next, getEntry(name))
  }

  return (
    <div className="flex flex-col gap-2">
      {settings.habits.map(habit => {
        const done = !!states[habit]
        return (
          <button
            key={habit}
            onClick={() => toggle(habit)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: done ? '#00F0B512' : '#1A1A1A',
              border: `1px solid ${done ? '#00F0B530' : '#2A2A2A'}`,
              borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
              transition: 'all 0.15s', textAlign: 'left',
            }}
          >
            <span style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? '#00F0B5' : '#2A2A2A',
              transition: 'all 0.15s',
            }}>
              {done && <Check size={14} color="#0A0A0A" strokeWidth={3} />}
            </span>
            <span style={{
              fontSize: 15, fontWeight: 500,
              color: done ? '#F5F5F5' : '#888',
              textDecoration: done ? 'none' : 'none',
            }}>
              {habit}
            </span>
          </button>
        )
      })}
    </div>
  )
}
