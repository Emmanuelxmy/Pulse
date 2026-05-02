import type { Entry, TrainingData } from '@/types'

interface Props {
  entries: Entry[]
  sessionsTarget: number
}

export default function WeekSummary({ entries, sessionsTarget }: Props) {
  const training = entries.filter(e => e.domain === 'training')
  const sessions = training.length
  const totalMin = training.reduce((s, e) => s + (e.data as TrainingData).duration_min, 0)
  const avgRpe = sessions > 0
    ? Math.round(training.reduce((s, e) => s + (e.data as TrainingData).rpe, 0) / sessions * 10) / 10
    : 0

  const stats = [
    { label: 'Sessions', value: `${sessions}/${sessionsTarget}`, color: sessions >= sessionsTarget ? '#00F0B5' : '#F59E0B' },
    { label: 'Total time', value: `${totalMin}m`, color: '#F5F5F5' },
    { label: 'Avg RPE', value: avgRpe > 0 ? `${avgRpe}` : '—', color: '#F5F5F5' },
  ]

  return (
    <div>
      <h3 style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 12 }}>Training</h3>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, color }) => (
          <div
            key={label}
            style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, padding: '14px 12px' }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
