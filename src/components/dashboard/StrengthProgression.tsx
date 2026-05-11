import { useState, useMemo } from 'react'
import type { Entry, StrengthData } from '@/types'

const INDIGO = '#6366F1'

interface Props { entries: Entry[] }

export default function StrengthProgression({ entries }: Props) {
  const strengthEntries = useMemo(
    () => entries.filter(e => e.domain === 'strength').sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  )

  const exerciseNames = useMemo(() => {
    const names = new Set<string>()
    for (const e of strengthEntries) {
      for (const ex of (e.data as StrengthData).exercises) {
        if (ex.name) names.add(ex.name)
      }
    }
    return Array.from(names)
  }, [strengthEntries])

  const [selected, setSelected] = useState<string | null>(null)
  const activeExercise = selected ?? exerciseNames[0] ?? null

  const chartData = useMemo(() => {
    if (!activeExercise) return []
    const points: { date: string; weight: number; isPR: boolean }[] = []
    let maxSeen = 0
    for (const entry of strengthEntries) {
      const match = (entry.data as StrengthData).exercises
        .find(ex => ex.name.toLowerCase() === activeExercise.toLowerCase())
      if (match) {
        const isPR = match.weight_lbs > maxSeen
        if (isPR) maxSeen = match.weight_lbs
        points.push({ date: entry.date, weight: match.weight_lbs, isPR: isPR && points.length > 0 })
      }
    }
    return points
  }, [strengthEntries, activeExercise])

  // Gain info
  const firstW = chartData[0]?.weight ?? 0
  const lastW = chartData[chartData.length - 1]?.weight ?? 0
  const gainLbs = lastW - firstW
  const weeks = chartData.length > 1
    ? Math.max(1, Math.round((new Date(chartData[chartData.length - 1].date).getTime() - new Date(chartData[0].date).getTime()) / (7 * 86400000)))
    : 0

  if (exerciseNames.length === 0) {
    return (
      <div>
        <p style={eyebrow}>Strength progression</p>
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <p style={{ color: '#33334A', fontSize: 13 }}>Log strength workouts to see progression</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <p style={eyebrow}>Working set · lb</p>
        {gainLbs > 0 && weeks > 0 && (
          <span className="font-data" style={{
            fontSize: 11, color: INDIGO,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ↑ +{gainLbs} in {weeks}w
          </span>
        )}
      </div>

      {/* Exercise pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {exerciseNames.map(name => {
          const active = name === activeExercise
          return (
            <button
              key={name}
              onClick={() => setSelected(name)}
              style={{
                fontSize: 11, padding: '5px 10px', borderRadius: 99,
                border: active ? `1px solid ${INDIGO}55` : '1px solid rgba(255,255,255,0.07)',
                background: active ? `${INDIGO}22` : 'rgba(255,255,255,0.04)',
                color: active ? INDIGO : '#8A8A99',
                fontWeight: 600, letterSpacing: '-0.005em',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {name}
            </button>
          )
        })}
      </div>

      {/* SVG line chart */}
      {chartData.length > 0 ? (
        <SvgLineChart data={chartData} />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ color: '#33334A', fontSize: 13 }}>No data for {activeExercise}</p>
        </div>
      )}

      {/* Time labels */}
      {chartData.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 9.5, color: '#44445A' }}>
            {chartData.length} wks ago
          </span>
          <span style={{ fontSize: 9.5, color: '#44445A' }}>today</span>
        </div>
      )}
    </div>
  )
}

function SvgLineChart({ data }: { data: { weight: number; isPR: boolean }[] }) {
  const W = 296, H = 110, padX = 8, padY = 12
  const weights = data.map(d => d.weight)
  let minW = Math.min(...weights)
  let maxW = Math.max(...weights)
  if (minW === maxW) { minW -= 10; maxW += 10 }
  const range = maxW - minW || 1

  const pts = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * (W - padX * 2),
    y: padY + (1 - (d.weight - minW) / range) * (H - padY * 2),
    weight: d.weight,
    isPR: d.isPR,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = linePath + ` L${pts[pts.length - 1].x.toFixed(1)} ${H} L${pts[0].x.toFixed(1)} ${H} Z`

  const current = data[data.length - 1]?.weight

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="strengthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INDIGO} stopOpacity="0.28" />
            <stop offset="100%" stopColor={INDIGO} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map(p => (
          <line
            key={p}
            x1={padX} x2={W - padX}
            y1={padY + p * (H - padY * 2)} y2={padY + p * (H - padY * 2)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2 4"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#strengthGrad)" />

        {/* Line */}
        <path
          d={linePath} fill="none"
          stroke={INDIGO} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 4px ${INDIGO}88)` }}
        />

        {/* Dots */}
        {pts.map((p, i) => {
          const isLast = i === pts.length - 1
          return (
            <circle
              key={i}
              cx={p.x} cy={p.y}
              r={p.isPR ? 4 : isLast ? 3.5 : 2}
              fill={p.isPR ? '#F59E0B' : isLast ? INDIGO : '#0A0A10'}
              stroke={p.isPR ? '#F59E0B' : INDIGO}
              strokeWidth="1.6"
            />
          )
        })}
      </svg>

      {/* Current value badge */}
      {current !== undefined && (
        <div style={{
          position: 'absolute', right: 0, top: -2,
          background: `${INDIGO}22`, border: `1px solid ${INDIGO}44`,
          padding: '3px 7px', borderRadius: 6,
        }}>
          <span className="font-data" style={{ fontSize: 11, color: INDIGO, fontWeight: 700 }}>
            {current}
          </span>
        </div>
      )}
    </div>
  )
}

const eyebrow: React.CSSProperties = {
  fontSize: 10.5, color: '#44445A', fontWeight: 700,
  letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 0,
}
