import type { Recommendation } from '@/types'

const CATEGORY_META: Record<string, { color: string; rgb: string; label: string }> = {
  training:  { color: '#00F0B5', rgb: '0,240,181',   label: 'Training'  },
  nutrition: { color: '#F59E0B', rgb: '245,158,11',  label: 'Nutrition' },
  habit:     { color: '#A78BFA', rgb: '167,139,250', label: 'Habit'     },
  task:      { color: '#60A5FA', rgb: '96,165,250',  label: 'Task'      },
}
const PRIORITY_META: Record<string, { color: string; rgb: string }> = {
  high:   { color: '#EF4444', rgb: '239,68,68'   },
  medium: { color: '#F59E0B', rgb: '245,158,11'  },
  low:    { color: '#55556A', rgb: '85,85,106'   },
}

interface Props {
  rec: Recommendation
  onLog?: () => void
}

export default function CoachCard({ rec, onLog }: Props) {
  const cat = CATEGORY_META[rec.category] ?? CATEGORY_META.task
  const pri = PRIORITY_META[rec.priority] ?? PRIORITY_META.low

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          background: `rgba(${cat.rgb},0.12)`, color: cat.color,
          fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {cat.label}
        </span>
        <span style={{
          background: `rgba(${pri.rgb},0.1)`, color: pri.color,
          fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
        }}>
          {rec.priority}
        </span>
      </div>

      {/* Action */}
      <p style={{ fontSize: 15, fontWeight: 600, color: '#F0F0F5', lineHeight: 1.45 }}>
        {rec.action}
      </p>

      {/* Reasoning */}
      <p style={{ fontSize: 13, color: '#44445A', lineHeight: 1.6 }}>
        {rec.reasoning}
      </p>

      {/* Log button */}
      {onLog && (
        <button
          onClick={onLog}
          style={{
            alignSelf: 'flex-start',
            background: `rgba(${cat.rgb},0.1)`,
            color: cat.color,
            border: `1px solid rgba(${cat.rgb},0.2)`,
            borderRadius: 10, padding: '8px 16px',
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Mark done →
        </button>
      )}
    </div>
  )
}
