import { useState, useEffect } from 'react'
import { useEntries } from '@/hooks/useEntries'
import { useToday } from '@/hooks/useToday'
import { getTodayISO, getWeekRange, getWeekDates, calcZoneSplit } from '@/lib/utils'
import { getEntriesByDateRange, getEntriesByDomainAndDateRange } from '@/lib/db'
import QuickEntry from './QuickEntry'
import EntryFeed from './EntryFeed'
import ZoneSplit from '@/components/dashboard/ZoneSplit'
import ProteinTracker from '@/components/dashboard/ProteinTracker'
import StrengthProgression from '@/components/dashboard/StrengthProgression'
import GoalProgress from '@/components/dashboard/GoalProgress'
import type { Settings, TrainingData, NutritionData, StrengthData, Entry } from '@/types'

const RED = '#FF3B30'

export default function TodayView({ settings }: { settings: Settings }) {
  const today = getTodayISO()
  const { entries, add, update, remove } = useEntries(today)
  const stats = useToday(entries, settings)

  const [weekEntries, setWeekEntries] = useState<Entry[]>([])
  const [strengthHistory, setStrengthHistory] = useState<Entry[]>([])

  const { start, end } = getWeekRange(new Date())
  const weekDates = getWeekDates(start)

  useEffect(() => {
    getEntriesByDateRange(start, end).then(setWeekEntries)
  }, [start, end])

  useEffect(() => {
    const ago = new Date()
    ago.setDate(ago.getDate() - 60)
    getEntriesByDomainAndDateRange('strength', ago.toISOString().slice(0, 10), today)
      .then(setStrengthHistory)
  }, [today])

  const entriesByDate: Record<string, Entry[]> = {}
  for (const d of weekDates) entriesByDate[d] = []
  for (const e of weekEntries) {
    if (!entriesByDate[e.date]) entriesByDate[e.date] = []
    entriesByDate[e.date].push(e)
  }
  const zoneSplit = calcZoneSplit(weekEntries)

  const RING = 112
  const R = 50
  const circumference = 2 * Math.PI * R
  const offset = circumference - (stats.progress / 100) * circumference

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const proteinPct = Math.min((stats.protein / settings.protein_target_g) * 100, 100)
  const setsTarget = settings.sessions_per_week_target * 6

  async function handleAddTraining(data: TrainingData) { await add('training', data) }
  async function handleAddNutrition(data: NutritionData) { await add('nutrition', data) }
  async function handleAddStrength(data: StrengthData) { await add('strength', data) }

  return (
    <div style={{ padding: '16px 18px 8px' }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 12, color: '#44445A', fontWeight: 500, marginBottom: 4, letterSpacing: '-0.01em' }}>
          {dateStr}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0F0F5', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
          {greeting}.
        </h1>
      </div>

      {/* Progress card */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 4px 32px rgba(255,59,48,0.10)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        {/* Progress ring */}
        <div style={{ position: 'relative', flexShrink: 0, width: RING, height: RING }}>
          <svg width={RING} height={RING} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
            <circle
              cx={RING / 2} cy={RING / 2} r={R} fill="none"
              stroke={RED} strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)',
                filter: 'drop-shadow(0 0 6px rgba(255,59,48,0.5))',
              }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="font-data" style={{ fontSize: 30, fontWeight: 700, color: '#F0F0F5', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {stats.progress}<span style={{ fontSize: 16, color: '#8A8A99' }}>%</span>
            </span>
            <span style={{ fontSize: 10, color: '#44445A', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              done
            </span>
          </div>
        </div>

        {/* Stats column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {/* Protein bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, color: '#44445A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Protein</span>
              <span className="font-data" style={{ fontSize: 12, letterSpacing: '-0.01em' }}>
                <span style={{ color: '#F59E0B' }}>{stats.protein}</span>
                <span style={{ color: '#2A2A38' }}> / {settings.protein_target_g}g</span>
              </span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99, width: `${proteinPct}%`,
                background: 'linear-gradient(90deg, #F59E0Bcc, #F59E0B)',
                boxShadow: proteinPct > 5 ? '0 0 8px rgba(245,158,11,0.5)' : 'none',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          <StatRow label="Sessions">
            <span style={{ color: RED }}>{stats.trainingSessions}</span>
            <span style={{ color: '#2A2A38' }}> / {settings.sessions_per_week_target}</span>
          </StatRow>

          <StatRow label="Strength sets">
            <span style={{ color: '#6366F1' }}>{stats.strengthSets}</span>
            <span style={{ color: '#2A2A38' }}> / {setsTarget}</span>
          </StatRow>
        </div>
      </div>

      {/* Quick-entry tiles */}
      <div style={{ marginBottom: 22 }}>
        <QuickEntry
          entries={entries}
          settings={settings}
          onAddTraining={handleAddTraining}
          onAddNutrition={handleAddNutrition}
          onAddStrength={handleAddStrength}
        />
      </div>

      {/* Today's log */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <p style={eyebrow}>Today's Log</p>
        {entries.length > 0 && (
          <span className="font-data" style={{ fontSize: 10.5, color: '#44445A' }}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      <EntryFeed entries={entries} onUpdate={update} onDelete={remove} />

      {/* ── This Week ── */}
      <div style={{ marginTop: 32, marginBottom: 12 }}>
        <p style={eyebrow}>This Week</p>
      </div>

      <div style={glass}>
        <ZoneSplit data={zoneSplit} />
      </div>

      <div style={{ ...glass, marginTop: 10 }}>
        <ProteinTracker weekDates={weekDates} entriesByDate={entriesByDate} target={settings.protein_target_g} />
      </div>

      <div style={{ ...glass, marginTop: 10 }}>
        <StrengthProgression entries={strengthHistory} />
      </div>

      {(settings.goals?.length ?? 0) > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
          <p style={eyebrow}>Goal Progress</p>
          <GoalProgress goals={settings.goals ?? []} />
        </div>
      )}
    </div>
  )
}

function StatRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 10.5, color: '#44445A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span className="font-data" style={{ fontSize: 12.5, letterSpacing: '-0.01em' }}>{children}</span>
    </div>
  )
}

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16, padding: 16,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}

const eyebrow: React.CSSProperties = {
  fontSize: 10.5, color: '#44445A', fontWeight: 700,
  letterSpacing: '0.10em', textTransform: 'uppercase',
}
