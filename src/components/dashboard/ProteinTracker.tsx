import { calcDailyProtein, dayLabel } from '@/lib/utils'
import type { Entry } from '@/types'

interface Props {
  weekDates: string[]
  entriesByDate: Record<string, Entry[]>
  target: number
}

const AMBER = '#F59E0B'
const today = new Date().toISOString().slice(0, 10)

export default function ProteinTracker({ weekDates, entriesByDate, target }: Props) {
  const data = weekDates.map(date => ({
    day: dayLabel(date),
    val: calcDailyProtein(entriesByDate[date] ?? []),
    isToday: date === today,
  }))

  const maxY = Math.max(target * 1.2, 20)
  const avg  = Math.round(data.reduce((s, d) => s + d.val, 0) / data.filter(d => d.val > 0).length || 0)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <p style={eyebrow}>Protein · last 7 days</p>
        {avg > 0 && (
          <span className="font-data" style={{ fontSize: 11, color: AMBER }}>avg {avg}g</span>
        )}
      </div>

      {/* Chart area */}
      <div style={{ position: 'relative', height: 96 }}>
        {/* Target dashed line */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: `${100 - (target / maxY) * 100}%`,
          borderTop: `1px dashed ${AMBER}66`,
          zIndex: 2,
        }}>
          <span className="font-data" style={{
            position: 'absolute', right: 0, top: -15,
            fontSize: 9.5, color: AMBER,
            background: '#0A0A10', padding: '0 4px',
          }}>
            {target}g
          </span>
        </div>

        {/* Bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, alignItems: 'end', height: 80 }}>
          {data.map((d, i) => {
            const h = (d.val / maxY) * 100
            const met = d.val >= target
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{
                  width: '100%', height: `${Math.max(h, d.val > 0 ? 4 : 0)}%`, borderRadius: 4,
                  background: met
                    ? `linear-gradient(180deg, ${AMBER}, #C97E08)`
                    : d.isToday
                      ? `linear-gradient(180deg, ${AMBER}80, ${AMBER}55)`
                      : d.val > 0
                        ? `linear-gradient(180deg, ${AMBER}55, ${AMBER}30)`
                        : 'rgba(255,255,255,0.04)',
                  border: d.isToday ? `1px solid ${AMBER}` : 'none',
                  boxShadow: met ? `0 0 8px ${AMBER}55` : 'none',
                }} />
              </div>
            )
          })}
        </div>

        {/* Day labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginTop: 6 }}>
          {data.map((d, i) => (
            <div key={i} style={{
              fontSize: 9.5, textAlign: 'center', fontWeight: 600,
              color: d.isToday ? AMBER : '#44445A',
            }}>{d.day}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

const eyebrow: React.CSSProperties = {
  fontSize: 10.5, color: '#44445A', fontWeight: 700,
  letterSpacing: '0.10em', textTransform: 'uppercase',
}
