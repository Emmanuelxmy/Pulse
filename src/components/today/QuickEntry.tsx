import { useState } from 'react'
import { Dumbbell, Drumstick, CheckSquare, RotateCcw } from 'lucide-react'
import EntryModal from './EntryModal'
import TrainingEntry from './TrainingEntry'
import NutritionEntry from './NutritionEntry'
import TaskEntry from './TaskEntry'
import HabitChecklist from './HabitChecklist'
import type { Entry, Settings, TrainingData, NutritionData, TaskData } from '@/types'

const TILES = [
  { id: 'training',  label: 'Training',  Icon: Dumbbell,    color: '#00F0B5', glow: 'rgba(0,240,181,0.18)',  title: 'Log Training' },
  { id: 'nutrition', label: 'Nutrition', Icon: Drumstick,   color: '#F59E0B', glow: 'rgba(245,158,11,0.18)', title: 'Log Nutrition' },
  { id: 'task',      label: 'Tasks',     Icon: CheckSquare, color: '#A78BFA', glow: 'rgba(167,139,250,0.18)',title: 'Add Task' },
  { id: 'habit',     label: 'Habits',    Icon: RotateCcw,   color: '#60A5FA', glow: 'rgba(96,165,250,0.18)', title: 'Habits' },
] as const

type TileId = typeof TILES[number]['id']

interface Props {
  entries: Entry[]
  settings: Settings
  onAddTraining: (data: TrainingData) => void
  onAddNutrition: (data: NutritionData) => void
  onAddTask: (data: TaskData) => void
  onToggleHabit: (name: string, completed: boolean, existing?: Entry) => void
}

export default function QuickEntry({
  entries, settings, onAddTraining, onAddNutrition, onAddTask, onToggleHabit,
}: Props) {
  const [open, setOpen] = useState<TileId | null>(null)
  const close = () => setOpen(null)
  const activeModal = TILES.find(t => t.id === open)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {TILES.map(({ id, label, Icon, color, glow }) => (
          <button
            key={id}
            onClick={() => setOpen(id)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18,
              padding: '16px 0 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              minHeight: 86,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* subtle color wash at top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 40,
              background: `radial-gradient(ellipse at 50% 0%, ${glow} 0%, transparent 100%)`,
              pointerEvents: 'none',
            }} />
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: `rgba(${hexToRgb(color)}, 0.12)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid rgba(${hexToRgb(color)}, 0.2)`,
            }}>
              <Icon size={18} color={color} strokeWidth={1.8} />
            </div>
            <span style={{ fontSize: 10.5, color: '#55556A', fontWeight: 600, letterSpacing: '0.02em' }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {activeModal && (
        <EntryModal title={activeModal.title} onClose={close}>
          {open === 'training' && <TrainingEntry settings={settings} onSave={d => { onAddTraining(d); close() }} />}
          {open === 'nutrition' && <NutritionEntry onSave={d => { onAddNutrition(d); close() }} />}
          {open === 'task' && <TaskEntry settings={settings} onSave={d => { onAddTask(d); close() }} />}
          {open === 'habit' && (
            <HabitChecklist
              entries={entries}
              settings={settings}
              onToggle={(name, completed, existing) => onToggleHabit(name, completed, existing)}
            />
          )}
        </EntryModal>
      )}
    </>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
