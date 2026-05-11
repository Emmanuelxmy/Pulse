import type { Goal } from '@/types'

const CAT_COLOR: Record<string, string> = {
  strength:  '#6366F1',
  nutrition: '#F59E0B',
  cardio:    '#00F0B5',
}

export default function GoalProgress({ goals }: { goals: Goal[] }) {
  if (!goals.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {goals.map(goal => {
        const c = CAT_COLOR[goal.category] ?? '#6366F1'
        const pct = goal.target_value > 0
          ? Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100)
          : 0
        const daysLeft = goal.target_date
          ? Math.max(0, Math.ceil((new Date(goal.target_date + 'T00:00:00').getTime() - Date.now()) / 86400000))
          : null

        return (
          <div key={goal.id} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: '#F0F0F5', fontWeight: 600, letterSpacing: '-0.01em' }}>
                {goal.description}
              </span>
              <span className="font-data" style={{ fontSize: 12, letterSpacing: '-0.01em' }}>
                <span style={{ color: c }}>{goal.current_value}</span>
                <span style={{ color: '#2A2A38' }}> / {goal.target_value} {goal.target_unit}</span>
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{
                height: '100%', borderRadius: 99, width: `${pct}%`,
                background: `linear-gradient(90deg, ${c}cc, ${c})`,
                boxShadow: pct > 5 ? `0 0 8px ${c}55` : 'none',
                transition: 'width 0.5s ease',
              }} />
            </div>

            {daysLeft !== null && (
              <span style={{ fontSize: 10.5, color: daysLeft < 14 ? '#EF4444' : '#44445A' }}>
                {daysLeft}d left
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
