import type { ZoneSplit as ZoneSplitData } from '@/lib/utils'

const ZONES = [
  { key: 'zone1_min' as const, label: 'Z1', color: '#FF8080' },
  { key: 'zone2_min' as const, label: 'Z2', color: '#FF3B30' },
  { key: 'hit_min'   as const, label: 'HIT', color: '#EF4444' },
]

const SIZE = 132, R = 50, SW = 14
const C = 2 * Math.PI * R

export default function ZoneSplit({ data }: { data: ZoneSplitData }) {
  const { total_min } = data

  if (total_min === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Placeholder ring */}
        <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
          <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={SW} />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="font-data" style={{ fontSize: 16, fontWeight: 700, color: '#2A2A38', lineHeight: 1 }}>—</span>
            <span style={{ fontSize: 9.5, color: '#44445A', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>cardio</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={eyebrow}>Zone split</p>
          <p style={{ fontSize: 13, color: '#33334A' }}>No cardio this week</p>
        </div>
      </div>
    )
  }

  // Build donut segments — accumulate offset
  let acc = 0
  const segments = ZONES.map(z => {
    const min = data[z.key]
    if (min === 0) return null
    const dash   = (min / total_min) * C
    const offset = -acc
    acc += dash
    return { ...z, min, pct: Math.round((min / total_min) * 100), dash, offset }
  }).filter(Boolean) as { label: string; color: string; min: number; pct: number; dash: number; offset: number }[]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Donut */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={SW} />
          {segments.map((seg, i) => (
            <circle key={i}
              cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
              stroke={seg.color} strokeWidth={SW}
              strokeDasharray={`${seg.dash} ${C - seg.dash}`}
              strokeDashoffset={seg.offset}
              style={{ filter: `drop-shadow(0 0 4px ${seg.color}66)` }}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="font-data" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {total_min}<span style={{ fontSize: 11, color: '#44445A', fontWeight: 500 }}> m</span>
          </span>
          <span style={{ fontSize: 9.5, color: '#44445A', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            cardio
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={eyebrow}>Zone split</p>
        {ZONES.map(z => {
          const min = data[z.key]
          const pct = Math.round((min / total_min) * 100)
          return (
            <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: z.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: '#F0F0F5', fontWeight: 500, flex: 1 }}>{z.label}</span>
              <span className="font-data" style={{ fontSize: 11.5, color: '#F0F0F5' }}>
                {min}<span style={{ color: '#44445A' }}>m</span>
              </span>
              <span className="font-data" style={{ fontSize: 10.5, color: '#44445A', width: 34, textAlign: 'right' }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const eyebrow: React.CSSProperties = {
  fontSize: 10.5, color: '#44445A', fontWeight: 700,
  letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 0,
}
