import { useState } from 'react'
import { Dumbbell, Drumstick, CheckSquare, RotateCcw } from 'lucide-react'
import EntryModal from './EntryModal'
import TrainingEntry from './TrainingEntry'
import NutritionEntry from './NutritionEntry'
import TaskEntry from './TaskEntry'
import HabitChecklist from './HabitChecklist'
import type { Entry, Settings, TrainingData, NutritionData, TaskData } from '@/types'

const TILES = [
  { id: 'training',  label: 'Training',  Icon: Dumbbell,    color: '#00F0B5', title: 'Log Training' },
  { id: 'nutrition', label: 'Nutrition', Icon: Drumstick,   color: '#F59E0B', title: 'Log Nutrition' },
  { id: 'task',      label: 'Tasks',     Icon: CheckSquare, color: '#F5F5F5', title: 'Add Task' },
  { id: 'habit',     label: 'Habits',    Icon: RotateCcw,   color: '#A78BFA', title: 'Habits' },
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

  function close() { setOpen(null) }

  const activeModal = TILES.find(t => t.id === open)

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {TILES.map(({ id, label, Icon, color }) => (
          <button
            key={id}
            onClick={() => setOpen(id)}
            style={{
              background: '#141414',
              border: '1px solid #2A2A2A',
              borderRadius: 16,
              padding: '16px 0 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              cursor: 'pointer', transition: 'all 0.15s',
              minHeight: 80,
            }}
          >
            <Icon size={24} color={color} strokeWidth={1.8} />
            <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{label}</span>
          </button>
        ))}
      </div>

      {activeModal && (
        <EntryModal title={activeModal.title} onClose={close}>
          {open === 'training' && (
            <TrainingEntry
              settings={settings}
              onSave={data => { onAddTraining(data); close() }}
            />
          )}
          {open === 'nutrition' && (
            <NutritionEntry
              onSave={data => { onAddNutrition(data); close() }}
            />
          )}
          {open === 'task' && (
            <TaskEntry
              settings={settings}
              onSave={data => { onAddTask(data); close() }}
            />
          )}
          {open === 'habit' && (
            <HabitChecklist
              entries={entries}
              settings={settings}
              onToggle={(name, completed, existing) => {
                onToggleHabit(name, completed, existing)
              }}
            />
          )}
        </EntryModal>
      )}
    </>
  )
}
