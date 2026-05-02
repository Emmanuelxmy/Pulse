import type { Recommendation } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  training: '#00F0B5',
  nutrition: '#F59E0B',
  habit: '#A78BFA',
  task: '#F5F5F5',
}
const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444', medium: '#F59E0B', low: '#888',
}

interface Props {
  rec: Recommendation
  onLog?: () => void
}

export default function CoachCard({ rec, onLog }: Props) {
  const color = CATEGORY_COLORS[rec.category] ?? '#888'
  const priorityColor = PRIORITY_COLORS[rec.priority]

  return (
    <div style={{
      background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14,
      padding: '16px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Category + Priority */}
      <div className="flex items-center justify-between">
        <span style={{
          background: `${color}20`, color, fontSize: 11, fontWeight: 700,
          padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {rec.category}
        </span>
        <span style={{
          background: `${priorityColor}15`, color: priorityColor,
          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
        }}>
          {rec.priority}
        </span>
      </div>

      {/* Action */}
      <p style={{ fontSize: 15, fontWeight: 600, color: '#F5F5F5', lineHeight: 1.4 }}>
        {rec.action}
      </p>

      {/* Reasoning */}
      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
        {rec.reasoning}
      </p>

      {/* Log it button */}
      {onLog && (
        <button
          onClick={onLog}
          style={{
            alignSelf: 'flex-start', background: `${color}20`, color, border: 'none',
            borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', marginTop: 2,
          }}
        >
          Mark done →
        </button>
      )}
    </div>
  )
}
