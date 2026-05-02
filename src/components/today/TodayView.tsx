import { useNavigate } from 'react-router-dom'
import { Brain } from 'lucide-react'
import { useEntries } from '@/hooks/useEntries'
import { useToday } from '@/hooks/useToday'
import { formatDate, getTodayISO } from '@/lib/utils'
import QuickEntry from './QuickEntry'
import EntryFeed from './EntryFeed'
import type { Settings, TrainingData, NutritionData, TaskData, Entry } from '@/types'

export default function TodayView({ settings }: { settings: Settings }) {
  const today = getTodayISO()
  const { entries, add, update, remove } = useEntries(today)
  const stats = useToday(entries, settings)
  const navigate = useNavigate()

  const circumference = 2 * Math.PI * 52
  const offset = circumference - (stats.progress / 100) * circumference

  async function handleAddTraining(data: TrainingData) {
    await add('training', data)
  }

  async function handleAddNutrition(data: NutritionData) {
    await add('nutrition', data)
  }

  async function handleAddTask(data: TaskData) {
    await add('task', data)
  }

  async function handleToggleHabit(name: string, completed: boolean, existing?: Entry) {
    if (existing) {
      await update({ ...existing, data: { habit_name: name, completed } })
    } else {
      await add('habit', { habit_name: name, completed })
    }
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <p style={{ fontSize: 13, color: '#555', fontWeight: 500, marginBottom: 2 }}>
          {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#F5F5F5', lineHeight: 1.2 }}>
          {formatDate(today)}
        </h1>
      </div>

      {/* Progress Ring + Protein */}
      <div className="flex items-center gap-5 mb-6">
        {/* Ring */}
        <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#1E1E1E" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="#00F0B5" strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace' }}>
              {stats.progress}%
            </span>
            <span style={{ fontSize: 10, color: '#555', marginTop: -2 }}>done</span>
          </div>
        </div>

        {/* Stats column */}
        <div className="flex flex-col gap-3 flex-1">
          {/* Protein bar */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span style={{ fontSize: 12, color: '#888' }}>Protein</span>
              <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: '#F5F5F5' }}>
                <span style={{ color: '#00F0B5' }}>{stats.protein}g</span>
                <span style={{ color: '#444' }}> / {settings.protein_target_g}g</span>
              </span>
            </div>
            <div style={{ height: 5, background: '#1E1E1E', borderRadius: 99 }}>
              <div style={{
                height: '100%', borderRadius: 99, background: '#00F0B5',
                width: `${Math.min((stats.protein / settings.protein_target_g) * 100, 100)}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Habits */}
          <div className="flex justify-between">
            <span style={{ fontSize: 12, color: '#888' }}>Habits</span>
            <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#F5F5F5' }}>
              {stats.completedHabits}<span style={{ color: '#444' }}>/{stats.totalHabits}</span>
            </span>
          </div>

          {/* Training */}
          <div className="flex justify-between">
            <span style={{ fontSize: 12, color: '#888' }}>Sessions</span>
            <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#F5F5F5' }}>
              {stats.trainingSessions}
              <span style={{ color: '#444' }}> today</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Entry tiles */}
      <div className="mb-6">
        <QuickEntry
          entries={entries}
          settings={settings}
          onAddTraining={handleAddTraining}
          onAddNutrition={handleAddNutrition}
          onAddTask={handleAddTask}
          onToggleHabit={handleToggleHabit}
        />
      </div>

      {/* Today's log */}
      <div className="mb-4">
        <h2 style={{ fontSize: 13, color: '#555', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          Today's Log
        </h2>
        <EntryFeed entries={entries} onUpdate={update} onDelete={remove} />
      </div>

      {/* Floating Ask Coach FAB */}
      <button
        onClick={() => navigate('/coach')}
        style={{
          position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom))', right: 20,
          background: '#00F0B5', color: '#0A0A0A', border: 'none', borderRadius: 99,
          padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 8,
          fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 20px #00F0B540',
          zIndex: 40,
        }}
      >
        <Brain size={18} strokeWidth={2} />
        Ask Coach
      </button>
    </div>
  )
}
