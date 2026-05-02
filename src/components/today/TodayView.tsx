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

  const circumference = 2 * Math.PI * 54
  const offset = circumference - (stats.progress / 100) * circumference

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  async function handleAddTraining(data: TrainingData) { await add('training', data) }
  async function handleAddNutrition(data: NutritionData) { await add('nutrition', data) }
  async function handleAddTask(data: TaskData) { await add('task', data) }
  async function handleToggleHabit(name: string, completed: boolean, existing?: Entry) {
    if (existing) await update({ ...existing, data: { habit_name: name, completed } })
    else await add('habit', { habit_name: name, completed })
  }

  const proteinPct = Math.min((stats.protein / settings.protein_target_g) * 100, 100)

  return (
    <div style={{ padding: '24px 18px 8px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 13, color: '#44445A', fontWeight: 500, marginBottom: 3 }}>
          {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0F0F5', lineHeight: 1.15 }}>
          {formatDate(today)}
        </h1>
        <p style={{ fontSize: 14, color: '#44445A', marginTop: 3 }}>{greeting}</p>
      </div>

      {/* ── Progress card ── */}
      <div
        className="glass glow-teal"
        style={{ padding: '20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 18 }}
      >
        {/* Ring */}
        <div style={{ position: 'relative', flexShrink: 0, width: 128, height: 128 }}>
          <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="64" cy="64" r="54" fill="none"
              stroke="#00F0B5" strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)',
                filter: 'drop-shadow(0 0 8px rgba(0,240,181,0.5))',
              }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="font-data" style={{ fontSize: 28, fontWeight: 700, color: '#F0F0F5', lineHeight: 1 }}>
              {stats.progress}%
            </span>
            <span style={{ fontSize: 10, color: '#44445A', marginTop: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              done
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Protein */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#44445A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Protein</span>
              <span className="font-data" style={{ fontSize: 12, color: '#F0F0F5' }}>
                <span style={{ color: '#00F0B5' }}>{stats.protein}</span>
                <span style={{ color: '#2A2A3A' }}>/{settings.protein_target_g}g</span>
              </span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg, #00F0B5, #00D4A0)',
                width: `${proteinPct}%`,
                transition: 'width 0.5s ease',
                boxShadow: proteinPct > 10 ? '0 0 8px rgba(0,240,181,0.4)' : 'none',
              }} />
            </div>
          </div>

          {/* Calories (only shown if any have been logged via AI) */}
          {stats.totalCalories > 0 && (
            <StatRow label="Calories" value={`${stats.totalCalories} kcal`} />
          )}

          {/* Habits */}
          <StatRow label="Habits" value={`${stats.completedHabits}/${stats.totalHabits}`} />

          {/* Sessions */}
          <StatRow label="Sessions" value={`${stats.trainingSessions} today`} />
        </div>
      </div>

      {/* ── Quick entry tiles ── */}
      <div style={{ marginBottom: 20 }}>
        <QuickEntry
          entries={entries}
          settings={settings}
          onAddTraining={handleAddTraining}
          onAddNutrition={handleAddNutrition}
          onAddTask={handleAddTask}
          onToggleHabit={handleToggleHabit}
        />
      </div>

      {/* ── Today's log ── */}
      <div>
        <p style={{
          fontSize: 11, color: '#44445A', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12,
        }}>
          Today's Log
        </p>
        <EntryFeed entries={entries} onUpdate={update} onDelete={remove} />
      </div>

      {/* ── Ask Coach FAB ── */}
      <button
        onClick={() => navigate('/coach')}
        style={{
          position: 'fixed',
          bottom: 'calc(86px + env(safe-area-inset-bottom))',
          right: 18,
          background: 'linear-gradient(135deg, #00F0B5 0%, #00C896 100%)',
          color: '#080810',
          border: 'none',
          borderRadius: 99,
          padding: '13px 18px',
          display: 'flex', alignItems: 'center', gap: 7,
          fontWeight: 700, fontSize: 14,
          cursor: 'pointer',
          boxShadow: '0 6px 28px rgba(0,240,181,0.35)',
          zIndex: 40,
        }}
      >
        <Brain size={17} strokeWidth={2.2} />
        Coach
      </button>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#44445A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span className="font-data" style={{ fontSize: 12, color: '#F0F0F5' }}>{value}</span>
    </div>
  )
}
