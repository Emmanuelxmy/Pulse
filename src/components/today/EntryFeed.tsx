import { useState, useRef } from 'react'
import { Flame, Leaf, Dumbbell } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { Entry, TrainingData, NutritionData, StrengthData } from '@/types'

interface Props {
  entries: Entry[]
  onUpdate: (entry: Entry) => void
  onDelete: (id: string) => void
}

export default function EntryFeed({ entries, onDelete }: Props) {
  if (!entries.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: '#2A2A38', fontSize: 14 }}>
        Nothing logged yet — tap a tile to start
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map((entry, i) => (
        <EntryCard key={entry.id} entry={entry} index={i} onDelete={onDelete} />
      ))}
    </div>
  )
}

function EntryCard({ entry, index, onDelete }: { entry: Entry; index: number; onDelete: (id: string) => void }) {
  const [swipeX, setSwipeX] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const startX = useRef(0)

  function onTouchStart(e: React.TouchEvent) { startX.current = e.touches[0].clientX }
  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current
    if (dx < 0) setSwipeX(Math.max(dx, -80))
  }
  function onTouchEnd() {
    if (swipeX < -60) setDeleting(true)
    else setSwipeX(0)
  }

  if (deleting) {
    return (
      <div style={{
        ...cardBase,
        justifyContent: 'space-between',
        background: 'rgba(239,68,68,0.07)',
        border: '1px solid rgba(239,68,68,0.18)',
      }}>
        <span style={{ color: '#EF4444', fontSize: 13 }}>Delete this entry?</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setDeleting(false)} style={cancelBtn}>Cancel</button>
          <button onClick={() => onDelete(entry.id)} style={deleteBtn}>Delete</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        animationDelay: `${index * 50}ms`,
        transform: `translateX(${swipeX}px)`,
        transition: swipeX === 0 ? 'transform 0.2s ease' : 'none',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <CardContent entry={entry} />
    </div>
  )
}

function CardContent({ entry }: { entry: Entry }) {
  const { domain, data, created_at } = entry

  if (domain === 'training') {
    const d = data as TrainingData
    const c = '#FF3B30'
    const zoneLabel = d.zone === 'zone1' ? 'Z1' : d.zone === 'zone2' ? 'Z2' : 'HIT'
    const meta = [
      d.duration_min && `${d.duration_min} min`,
      d.avg_hr && `${d.avg_hr} bpm`,
    ].filter(Boolean).join(' · ') || `RPE ${d.rpe}`
    return (
      <FeedCard
        color={c}
        icon={<Flame size={17} color={c} strokeWidth={1.8} />}
        title={d.type.charAt(0).toUpperCase() + d.type.slice(1)}
        meta={meta}
        tags={[zoneLabel, `RPE ${d.rpe}`]}
        time={formatTime(created_at)}
      />
    )
  }

  if (domain === 'nutrition') {
    const d = data as NutritionData
    const c = '#F59E0B'
    return (
      <FeedCard
        color={c}
        icon={<Leaf size={17} color={c} strokeWidth={1.8} />}
        title={d.meal.charAt(0).toUpperCase() + d.meal.slice(1)}
        meta={d.notes || d.quality}
        tags={[`${d.protein_g}g P`]}
        time={formatTime(created_at)}
      />
    )
  }

  if (domain === 'strength') {
    const d = data as StrengthData
    const c = '#6366F1'
    const exerciseNames = d.exercises.map(e => e.name).filter(Boolean).join(', ')
    const totalSets = d.exercises.reduce((s, e) => s + e.sets, 0)
    return (
      <FeedCard
        color={c}
        icon={<Dumbbell size={17} color={c} strokeWidth={1.8} />}
        title={`${d.exercises.length} lift${d.exercises.length !== 1 ? 's' : ''}`}
        meta={exerciseNames || 'Strength session'}
        tags={[`${totalSets} sets`]}
        time={formatTime(created_at)}
      />
    )
  }

  return null
}

function FeedCard({ color, icon, title, meta, tags, time }: {
  color: string
  icon: React.ReactNode
  title: string
  meta: string
  tags: string[]
  time: string
}) {
  return (
    <div style={cardBase}>
      {/* Domain icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 12,
        background: `${color}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: title + time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: '#F0F0F5',
            letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
          <span className="font-data" style={{ fontSize: 10.5, color: '#8A8A99', flexShrink: 0 }}>{time}</span>
        </div>

        {/* Row 2: meta + tags */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, gap: 8 }}>
          <span style={{
            fontSize: 11.5, color: '#8A8A99',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {meta}
          </span>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {tags.map(t => (
              <span key={t} className="font-data" style={{
                fontSize: 9.5, padding: '2px 6px', borderRadius: 6,
                background: `${color}14`, color, fontWeight: 600, letterSpacing: '0.02em',
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const cardBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
  padding: '12px 14px',
}
const cancelBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', color: '#888',
  borderRadius: 8, padding: '6px 12px', fontSize: 12, border: 'none', cursor: 'pointer',
}
const deleteBtn: React.CSSProperties = {
  background: '#EF4444', color: '#fff',
  borderRadius: 8, padding: '6px 12px', fontSize: 12, border: 'none', cursor: 'pointer', fontWeight: 700,
}
