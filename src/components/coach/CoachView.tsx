import { RefreshCw, WifiOff, Sparkles } from 'lucide-react'
import { useCoach } from '@/hooks/useCoach'
import { useEntries } from '@/hooks/useEntries'
import { getWeekRange, getTodayISO } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { getEntriesByDateRange } from '@/lib/db'
import CoachCard from './CoachCard'
import type { Settings, Entry, HabitData } from '@/types'

export default function CoachView({ settings }: { settings: Settings }) {
  const today = getTodayISO()
  const { entries: todayEntries, add } = useEntries(today)
  const [weekEntries, setWeekEntries] = useState<Entry[]>([])

  useEffect(() => {
    const { start, end } = getWeekRange(new Date())
    getEntriesByDateRange(start, end).then(setWeekEntries)
  }, [])

  const { response, loading, error, lastUpdated, session, refreshAllowed, refresh } =
    useCoach(todayEntries, weekEntries, settings)

  const sessionLabel = session === 'morning' ? 'Morning Brief' : 'Evening Brief'
  const sessionEmoji = session === 'morning' ? '☀️' : '🌙'
  const lastUpdatedText = lastUpdated ? `Updated ${formatRelative(lastUpdated)}` : null

  async function handleLogHabit(name: string) {
    const existing = todayEntries.find(e => e.domain === 'habit' && (e.data as HabitData).habit_name === name)
    if (!existing) await add('habit', { habit_name: name, completed: true })
  }

  return (
    <div style={{ padding: '24px 18px 8px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>{sessionEmoji}</span>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#F0F0F5' }}>{sessionLabel}</h1>
          </div>
          {lastUpdatedText && (
            <p style={{ fontSize: 12, color: '#33334A', fontFamily: 'JetBrains Mono, monospace' }}>{lastUpdatedText}</p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={!refreshAllowed || loading}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '9px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
            color: refreshAllowed && !loading ? '#888' : '#2A2A3A',
            cursor: refreshAllowed && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Refresh</span>
        </button>
      </div>

      {/* ── Offline ── */}
      {error === 'offline' && (
        <div className="glass" style={{ padding: 28, textAlign: 'center' }}>
          <WifiOff size={30} color="#33334A" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#55556A', fontSize: 15, fontWeight: 600 }}>Offline</p>
          <p style={{ color: '#33334A', fontSize: 13, marginTop: 5 }}>Connect to generate your brief</p>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && !response && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="animate-shimmer"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                height: 88,
                animationDelay: `${(i - 1) * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Response ── */}
      {response && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Summary card */}
          <div
            className="glow-teal"
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,181,0.07) 0%, rgba(0,200,150,0.04) 100%)',
              border: '1px solid rgba(0,240,181,0.18)',
              borderRadius: 18,
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Sparkles size={14} color="#00F0B5" />
              <span style={{ fontSize: 11, color: '#00F0B5', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Assessment
              </span>
            </div>
            <p style={{ fontSize: 15, color: '#C0C0D0', lineHeight: 1.7 }}>{response.summary}</p>
          </div>

          {/* Section label */}
          <p style={{ fontSize: 11, color: '#33334A', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
            Recommended Actions
          </p>

          {/* Recommendation cards */}
          {response.recommendations
            .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
            .map((rec, i) => (
              <CoachCard
                key={i}
                rec={rec}
                onLog={rec.category === 'habit' ? () => handleLogHabit(rec.action) : undefined}
              />
            ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!response && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
            background: 'rgba(0,240,181,0.07)', border: '1px solid rgba(0,240,181,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={28} color="#00F0B5" />
          </div>
          <p style={{ color: '#44445A', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            No brief for this session yet
          </p>
          <p style={{ color: '#33334A', fontSize: 13, marginBottom: 20 }}>
            Generate your {sessionLabel.toLowerCase()} to get started
          </p>
          <button
            onClick={refresh}
            style={{
              background: 'linear-gradient(135deg, #00F0B5 0%, #00C896 100%)',
              color: '#080810', border: 'none', borderRadius: 14,
              padding: '13px 28px', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,240,181,0.3)',
            }}
          >
            Generate Brief
          </button>
        </div>
      )}
    </div>
  )
}

function formatRelative(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}
