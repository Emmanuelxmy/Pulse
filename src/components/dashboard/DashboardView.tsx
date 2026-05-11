import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getWeekRange, getWeekDates, calcZoneSplit, calcDailyProtein } from '@/lib/utils'
import { getEntriesByDateRange, getEntriesByDomainAndDateRange } from '@/lib/db'
import ZoneSplit from './ZoneSplit'
import ProteinTracker from './ProteinTracker'
import StrengthProgression from './StrengthProgression'
import GoalProgress from './GoalProgress'
import type { Entry, Settings, TrainingData, StrengthData } from '@/types'

export default function DashboardView({ settings }: { settings: Settings }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [entries, setEntries] = useState<Entry[]>([])
  const [prevEntries, setPrevEntries] = useState<Entry[]>([])
  const [strengthEntries, setStrengthEntries] = useState<Entry[]>([])

  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() + weekOffset * 7)
  const { start, end } = getWeekRange(baseDate)
  const weekDates = getWeekDates(start)

  const prevBase = new Date(baseDate)
  prevBase.setDate(prevBase.getDate() - 7)
  const { start: prevStart, end: prevEnd } = getWeekRange(prevBase)

  useEffect(() => {
    getEntriesByDateRange(start, end).then(setEntries)
    getEntriesByDateRange(prevStart, prevEnd).then(setPrevEntries)
  }, [start, end, prevStart, prevEnd])

  useEffect(() => {
    const ago = new Date()
    ago.setDate(ago.getDate() - 60)
    getEntriesByDomainAndDateRange('strength', ago.toISOString().slice(0, 10), new Date().toISOString().slice(0, 10))
      .then(setStrengthEntries)
  }, [])

  const entriesByDate: Record<string, Entry[]> = {}
  for (const d of weekDates) entriesByDate[d] = []
  for (const e of entries) {
    if (!entriesByDate[e.date]) entriesByDate[e.date] = []
    entriesByDate[e.date].push(e)
  }

  const zoneSplit = calcZoneSplit(entries)

  // Week label
  const startDate = new Date(start + 'T00:00:00')
  const endDate   = new Date(end   + 'T00:00:00')
  const dateRange = [
    startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    endDate.toLocaleDateString('en-US',   { month: 'short', day: 'numeric' }),
  ].join(' – ')
  const getISOWeek = (d: Date) => {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7))
    const y1 = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1))
    return Math.ceil((((dt.getTime() - y1.getTime()) / 86400000) + 1) / 7)
  }
  const weekIndicator = `W${getISOWeek(startDate)} · ${startDate.getFullYear()}`

  // Summary stats
  const trainingSessions = entries.filter(e => e.domain === 'training').length
  const prevTrainingSessions = prevEntries.filter(e => e.domain === 'training').length

  const strengthVol = entries.filter(e => e.domain === 'strength')
    .reduce((v, e) => v + (e.data as StrengthData).exercises.reduce((s, ex) => s + ex.sets * ex.reps * ex.weight_lbs, 0), 0)
  const prevStrengthVol = prevEntries.filter(e => e.domain === 'strength')
    .reduce((v, e) => v + (e.data as StrengthData).exercises.reduce((s, ex) => s + ex.sets * ex.reps * ex.weight_lbs, 0), 0)

  const avgProtein = Math.round(weekDates.reduce((s, d) => s + calcDailyProtein(entriesByDate[d] ?? []), 0) / 7)
  const prevAvgProtein = Math.round(prevEntries.length > 0
    ? weekDates.reduce((s, d) => {
        const prev = new Date(d + 'T00:00:00')
        prev.setDate(prev.getDate() - 7)
        return s + calcDailyProtein(prevEntries.filter(e => e.date === prev.toISOString().slice(0, 10)))
      }, 0) / 7
    : 0)

  const volDisplay = strengthVol >= 1000 ? `${Math.round(strengthVol / 1000)}k` : String(strengthVol || '—')
  const sessionDelta  = trainingSessions - prevTrainingSessions
  const volDeltaPct   = prevStrengthVol   > 0 ? Math.round(((strengthVol    - prevStrengthVol)   / prevStrengthVol)   * 100) : null
  const proteinDeltaPct = prevAvgProtein  > 0 ? Math.round(((avgProtein     - prevAvgProtein)     / prevAvgProtein)    * 100) : null

  // Mini activity bars for week nav
  const today = new Date().toISOString().slice(0, 10)
  const miniBarData = weekDates.map(date => {
    const dayEs = entriesByDate[date] ?? []
    const trainEntry = dayEs.find(e => e.domain === 'training')
    const strEntry   = dayEs.find(e => e.domain === 'strength')
    let val = 0, type: 'cardio' | 'strength' | null = null
    if (trainEntry) {
      val  = Math.min(100, ((trainEntry.data as TrainingData).duration_min / 60) * 100)
      type = 'cardio'
    } else if (strEntry) {
      const sets = (strEntry.data as StrengthData).exercises.reduce((s, ex) => s + ex.sets, 0)
      val  = Math.min(100, (sets / 18) * 100)
      type = 'strength'
    }
    return {
      d: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
      val, type, active: date === today,
    }
  })

  const summaryCards = [
    { label: 'Sessions', val: trainingSessions || '0', sub: `/ ${settings.sessions_per_week_target} target`, color: '#00F0B5',
      delta: sessionDelta !== 0 ? (sessionDelta > 0 ? `+${sessionDelta}` : `${sessionDelta}`) : null, deltaPos: sessionDelta >= 0 },
    { label: 'Volume',   val: volDisplay,              sub: 'lb total',   color: '#6366F1',
      delta: volDeltaPct   != null ? (volDeltaPct   > 0 ? `+${volDeltaPct}%`   : `${volDeltaPct}%`)   : null, deltaPos: (volDeltaPct   ?? 0) >= 0 },
    { label: 'Protein',  val: avgProtein || '—',       sub: 'avg g/day',  color: '#F59E0B',
      delta: proteinDeltaPct != null ? (proteinDeltaPct > 0 ? `+${proteinDeltaPct}%` : `${proteinDeltaPct}%`) : null, deltaPos: (proteinDeltaPct ?? 0) >= 0 },
  ]

  return (
    <div style={{ padding: '16px 18px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#F0F0F5', letterSpacing: '-0.025em' }}>Progress</h1>
        <span className="font-data" style={{ fontSize: 11.5, color: '#8A8A99' }}>{weekIndicator}</span>
      </div>

      {/* Week navigator */}
      <div style={glass}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={() => setWeekOffset(o => o - 1)} style={chevBtn}>
            <ChevronLeft size={14} strokeWidth={2.2} color="#8A8A99" />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F5', letterSpacing: '-0.01em' }}>{dateRange}</span>
          <button onClick={() => setWeekOffset(o => Math.min(o + 1, 0))} disabled={weekOffset >= 0}
            style={{ ...chevBtn, opacity: weekOffset >= 0 ? 0.25 : 1 }}>
            <ChevronRight size={14} strokeWidth={2.2} color="#8A8A99" />
          </button>
        </div>
        {/* Mini bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, alignItems: 'end', height: 56 }}>
          {miniBarData.map((d, i) => {
            const c = d.type === 'cardio' ? '#00F0B5' : d.type === 'strength' ? '#6366F1' : 'transparent'
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: 40, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', height: `${Math.max(4, d.val)}%`, borderRadius: 4,
                    background: d.val ? `linear-gradient(180deg, ${c}, ${c}80)` : 'rgba(255,255,255,0.04)',
                    boxShadow: d.active && d.val ? `0 0 10px ${c}aa` : 'none',
                    border: d.active && d.val ? `1px solid ${c}` : 'none',
                  }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: d.active ? '#00F0B5' : '#44445A' }}>{d.d}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3-col summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {summaryCards.map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '12px 12px 11px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 9.5, color: '#44445A', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' }}>{s.label}</span>
            <span className="font-data" style={{ fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.val}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#44445A' }}>{s.sub}</span>
              {s.delta && (
                <span className="font-data" style={{ fontSize: 9.5, fontWeight: 600, color: s.deltaPos ? '#00F0B5' : '#EF4444' }}>{s.delta}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Zone split donut */}
      <div style={glass}>
        <ZoneSplit data={zoneSplit} />
      </div>

      {/* Protein chart */}
      <div style={glass}>
        <ProteinTracker weekDates={weekDates} entriesByDate={entriesByDate} target={settings.protein_target_g} />
      </div>

      {/* Strength progression */}
      <div style={glass}>
        <StrengthProgression entries={strengthEntries} />
      </div>

      {/* Goals */}
      {(settings.goals?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={eyebrow}>Goal progress</p>
          <GoalProgress goals={settings.goals ?? []} />
        </div>
      )}
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
const chevBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 14,
  background: 'rgba(255,255,255,0.05)', border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}
const eyebrow: React.CSSProperties = {
  fontSize: 10.5, color: '#44445A', fontWeight: 700,
  letterSpacing: '0.10em', textTransform: 'uppercase',
}
