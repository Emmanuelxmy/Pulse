import { useState } from 'react'
import { Flame, Leaf, Dumbbell, Plus } from 'lucide-react'
import EntryModal from './EntryModal'
import TrainingEntry from './TrainingEntry'
import NutritionEntry from './NutritionEntry'
import StrengthEntry from './StrengthEntry'
import type { Entry, Settings, TrainingData, NutritionData, StrengthData } from '@/types'

const TILES = [
  { id: 'training',  label: 'Training',  sub: 'Log a session',  Icon: Flame,    color: '#FF3B30', title: 'Log Training' },
  { id: 'nutrition', label: 'Nutrition', sub: 'Add a meal',     Icon: Leaf,     color: '#F59E0B', title: 'Log Nutrition' },
  { id: 'strength',  label: 'Strength',  sub: 'Parse workout',  Icon: Dumbbell, color: '#6366F1', title: 'Log Strength' },
] as const

type TileId = typeof TILES[number]['id']

interface Props {
  entries: Entry[]
  settings: Settings
  onAddTraining: (data: TrainingData) => void
  onAddNutrition: (data: NutritionData) => void
  onAddStrength: (data: StrengthData) => void
}

export default function QuickEntry({ settings, onAddTraining, onAddNutrition, onAddStrength }: Props) {
  const [open, setOpen] = useState<TileId | null>(null)
  const close = () => setOpen(null)
  const activeModal = TILES.find(t => t.id === open)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {TILES.map(({ id, label, sub, Icon, color }) => (
          <button
            key={id}
            onClick={() => setOpen(id)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: '14px 10px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 8,
              minHeight: 96,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {/* Corner radial glow */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 60, height: 60, borderRadius: 30,
              background: `radial-gradient(circle, ${color}22, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            {/* Icon box */}
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `${color}1a`, color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `inset 0 0 0 1px ${color}22`,
              flexShrink: 0,
            }}>
              <Icon size={17} strokeWidth={1.8} />
            </div>

            {/* Label + sub */}
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#F0F0F5', letterSpacing: '-0.01em' }}>{label}</div>
              <div style={{ fontSize: 10.5, color: '#8A8A99', marginTop: 2 }}>{sub}</div>
            </div>

            {/* + circle */}
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
              width: 22, height: 22, borderRadius: 11,
              background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8A8A99',
            }}>
              <Plus size={13} strokeWidth={2.4} />
            </div>
          </button>
        ))}
      </div>

      {activeModal && (
        <EntryModal title={activeModal.title} onClose={close}>
          {open === 'training' && <TrainingEntry settings={settings} onSave={d => { onAddTraining(d); close() }} />}
          {open === 'nutrition' && <NutritionEntry onSave={d => { onAddNutrition(d); close() }} />}
          {open === 'strength' && <StrengthEntry onSave={d => { onAddStrength(d); close() }} />}
        </EntryModal>
      )}
    </>
  )
}
