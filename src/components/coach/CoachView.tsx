import { RefreshCw, WifiOff, Brain } from 'lucide-react'
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
  const lastUpdatedText = lastUpdated
    ? `Updated ${formatRelative(lastUpdated)}`
    : null

  async function handleLogHabit(name: string) {
    const existing = todayEntries.find(
      e => e.domain === 'habit' && (e.data as HabitData).habit_name === name,
    )
    if (!existing) {
      await add('habit', { habit_name: name, completed: true })
    }
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Brain size={18} color="#00F0B5" />
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F5' }}>{sessionLabel}</h1>
          </div>
          {lastUpdatedText && (
            <p style={{ fontSize: 12, color: '#444', marginTop: 2 }}>{lastUpdatedText}</p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={!refreshAllowed || loading}
          style={{
            background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10,
            padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6,
            color: refreshAllowed ? '#888' : '#333', cursor: refreshAllowed ? 'pointer' : 'not-allowed',
          }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span style={{ fontSize: 12, fontWeight: 500 }}>Refresh</span>
        </button>
      </div>

      {/* Offline state */}
      {error === 'offline' && (
        <div style={{
          background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 14,
          padding: '24px', textAlign: 'center',
        }}>
          <WifiOff size={32} color="#444" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#666', fontSize: 15 }}>Offline</p>
          <p style={{ color: '#444', fontSize: 13, marginTop: 4 }}>
            Connect to get AI recommendations
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !response && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: '#141414', border: '1px solid #1E1E1E', borderRadius: 14,
              padding: 16, height: 90,
              animation: 'pulse 1.5s ease infinite',
            }} />
          ))}
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="flex flex-col gap-4">
          {/* Summary card */}
          <div style={{
            background: '#0F1F1A', border: '1px solid #00F0B530', borderRadius: 14, padding: '18px',
          }}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00F0B5' }} />
              <span style={{ fontSize: 12, color: '#00F0B5', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Assessment
              </span>
            </div>
            <p style={{ fontSize: 15, color: '#D0D0D0', lineHeight: 1.65 }}>
              {response.summary}
            </p>
          </div>

          {/* Recommendation cards */}
          <h2 style={{ fontSize: 12, color: '#555', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Actions
          </h2>
          {response.recommendations
            .sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 }
              return order[a.priority] - order[b.priority]
            })
            .map((rec, i) => (
              <CoachCard
                key={i}
                rec={rec}
                onLog={rec.category === 'habit' ? () => handleLogHabit(rec.action) : undefined}
              />
            ))}
        </div>
      )}

      {/* Empty state */}
      {!response && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Brain size={40} color="#222" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#444', fontSize: 15 }}>No brief yet for this session</p>
          <button
            onClick={refresh}
            style={{
              marginTop: 16, background: '#00F0B5', color: '#0A0A0A', border: 'none',
              borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Generate Brief
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.4 }
        }
      `}</style>
    </div>
  )
}

function formatRelative(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}
