import { dayLabel } from '@/lib/utils'
import type { Entry, HabitData } from '@/types'

interface Props {
  habits: string[]
  weekDates: string[]
  entriesByDate: Record<string, Entry[]>
}

export default function HabitGrid({ habits, weekDates, entriesByDate }: Props) {
  function isDone(habit: string, date: string): boolean {
    const entries = entriesByDate[date] ?? []
    return entries.some(
      e => e.domain === 'habit' && (e.data as HabitData).habit_name === habit && (e.data as HabitData).completed,
    )
  }

  function streak(habit: string): number {
    let s = 0
    const sorted = [...weekDates].reverse()
    for (const d of sorted) {
      if (isDone(habit, d)) s++
      else break
    }
    return s
  }

  return (
    <div>
      <h3 style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 12 }}>Habits</h3>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        <div />
        {weekDates.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#444' }}>{dayLabel(d)}</div>
        ))}
      </div>
      {habits.map(habit => {
        const s = streak(habit)
        return (
          <div
            key={habit}
            style={{ display: 'grid', gridTemplateColumns: '120px repeat(7, 1fr)', gap: 6, marginBottom: 8, alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {habit.length > 14 ? habit.slice(0, 13) + '…' : habit}
              </span>
              {s > 0 && (
                <span style={{ fontSize: 10, color: '#00F0B5', fontFamily: 'JetBrains Mono, monospace' }}>
                  {s}🔥
                </span>
              )}
            </div>
            {weekDates.map(d => {
              const done = isDone(habit, d)
              return (
                <div
                  key={d}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: '50%',
                    background: done ? '#00F0B5' : '#1E1E1E',
                    border: `1px solid ${done ? '#00F0B540' : '#2A2A2A'}`,
                    maxWidth: 28, margin: '0 auto',
                  }}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
