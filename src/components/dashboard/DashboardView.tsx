import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getWeekRange, getWeekDates } from '@/lib/utils'
import { calcZoneSplit } from '@/lib/utils'
import { getEntriesByDateRange } from '@/lib/db'
import ZoneSplit from './ZoneSplit'
import ProteinTracker from './ProteinTracker'
import HabitGrid from './HabitGrid'
import WeekSummary from './WeekSummary'
import type { Entry, Settings, TaskData } from '@/types'

export default function DashboardView({ settings }: { settings: Settings }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [entries, setEntries] = useState<Entry[]>([])

  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() + weekOffset * 7)
  const { start, end } = getWeekRange(baseDate)
  const weekDates = getWeekDates(start)

  useEffect(() => {
    getEntriesByDateRange(start, end).then(setEntries)
  }, [start, end])

  const entriesByDate: Record<string, Entry[]> = {}
  for (const d of weekDates) entriesByDate[d] = []
  for (const e of entries) {
    if (!entriesByDate[e.date]) entriesByDate[e.date] = []
    entriesByDate[e.date].push(e)
  }

  const zoneSplit = calcZoneSplit(entries)

  const taskEntries = entries.filter(e => e.domain === 'task')
  const completedTasks = taskEntries.filter(e => (e.data as TaskData).completed).length

  const weekLabel = weekOffset === 0
    ? 'This week'
    : weekOffset === -1
    ? 'Last week'
    : `Week of ${new Date(start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <div className="px-4 pt-6 pb-4 flex flex-col gap-6">
      {/* Week selector */}
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F5' }}>Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            style={navBtn}
          >
            <ChevronLeft size={16} color="#888" />
          </button>
          <span style={{ fontSize: 13, color: '#888', minWidth: 80, textAlign: 'center' }}>{weekLabel}</span>
          <button
            onClick={() => setWeekOffset(o => Math.min(o + 1, 0))}
            disabled={weekOffset >= 0}
            style={{ ...navBtn, opacity: weekOffset >= 0 ? 0.3 : 1 }}
          >
            <ChevronRight size={16} color="#888" />
          </button>
        </div>
      </div>

      {/* Training summary */}
      <section style={sectionStyle}>
        <WeekSummary entries={entries} sessionsTarget={settings.sessions_per_week_target} />
      </section>

      {/* Zone split */}
      <section style={sectionStyle}>
        <ZoneSplit data={zoneSplit} />
      </section>

      {/* Protein tracker */}
      <section style={sectionStyle}>
        <ProteinTracker
          weekDates={weekDates}
          entriesByDate={entriesByDate}
          target={settings.protein_target_g}
        />
      </section>

      {/* Habit grid */}
      <section style={{ ...sectionStyle, overflowX: 'auto' }}>
        <HabitGrid
          habits={settings.habits}
          weekDates={weekDates}
          entriesByDate={entriesByDate}
        />
      </section>

      {/* Task completion */}
      <section style={sectionStyle}>
        <h3 style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 12 }}>Tasks</h3>
        <div className="flex items-center gap-4">
          <div style={{ flex: 1, background: '#1E1E1E', borderRadius: 99, height: 8 }}>
            <div style={{
              height: '100%', borderRadius: 99, background: '#F5F5F5',
              width: taskEntries.length > 0 ? `${(completedTasks / taskEntries.length) * 100}%` : '0%',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: '#F5F5F5', flexShrink: 0 }}>
            {completedTasks}/{taskEntries.length}
          </span>
        </div>
      </section>
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 16, padding: '18px',
}
const navBtn: React.CSSProperties = {
  background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8,
  padding: '6px', cursor: 'pointer', display: 'flex',
}
