import { useState } from 'react'
import { Trash2, AlertCircle, Check, Zap } from 'lucide-react'
import { parseStrengthWorkout } from '@/lib/strength'
import type { StrengthData, StrengthExercise, StrengthParseResult } from '@/types'

interface Props { onSave: (data: StrengthData) => void }

type Mode = 'ai' | 'manual'

const INDIGO = '#6366F1'

export default function StrengthEntry({ onSave }: Props) {
  const [mode, setMode] = useState<Mode>('ai')
  const [description, setDescription] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseResult, setParseResult] = useState<StrengthParseResult | null>(null)
  const [aiError, setAiError] = useState('')
  const [exercises, setExercises] = useState<StrengthExercise[]>([])
  const [sessionNotes, setSessionNotes] = useState('')

  async function handleParse() {
    if (!description.trim()) return
    setParsing(true)
    setAiError('')
    setParseResult(null)
    try {
      const result = await parseStrengthWorkout(description.trim())
      setParseResult(result)
      setExercises(result.exercises)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Could not parse — try again.')
    }
    setParsing(false)
  }

  function handleSave() {
    if (exercises.length === 0) return
    onSave({
      exercises,
      raw_text: description,
      progression_notes: parseResult?.progression,
      session_notes: sessionNotes || undefined,
    })
  }

  function updateExercise(i: number, patch: Partial<StrengthExercise>) {
    setExercises(prev => prev.map((ex, j) => j === i ? { ...ex, ...patch } : ex))
  }

  function removeExercise(i: number) {
    setExercises(prev => prev.filter((_, j) => j !== i))
  }

  function addEmptyExercise() {
    setExercises(prev => [...prev, { name: '', sets: 3, reps: 10, weight_lbs: 0 }])
  }

  const showTable = exercises.length > 0 || mode === 'manual'
  const canSave = exercises.length > 0 && exercises.some(e => e.name)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Mode toggle */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: 4,
      }}>
        {(['ai', 'manual'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); if (m === 'manual' && exercises.length === 0) addEmptyExercise() }}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10,
              border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s',
              background: mode === m ? `${INDIGO}20` : 'transparent',
              color: mode === m ? INDIGO : '#44445A',
            }}
          >
            {m === 'ai' ? '✦ AI Parse' : 'Manual'}
          </button>
        ))}
      </div>

      {/* AI mode — textarea */}
      {mode === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={eyebrow}>Paste or type your session</p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={'e.g. Bench 135x5x3, OHP 95x4x3, curls 35x10x3'}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: 14,
                padding: '12px 14px',
                color: '#F0F0F5',
                fontSize: 12,
                fontFamily: '"JetBrains Mono", monospace',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.7,
                minHeight: 134,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Parse button */}
          <button
            onClick={handleParse}
            disabled={parsing || !description.trim()}
            style={{
              width: '100%',
              height: 48,
              background: parsing || !description.trim()
                ? `${INDIGO}18`
                : `linear-gradient(180deg, ${INDIGO}, #4F52D4)`,
              color: parsing || !description.trim() ? '#44445A' : '#fff',
              fontWeight: 600, fontSize: 14,
              borderRadius: 14, border: 'none',
              cursor: parsing || !description.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: parsing || !description.trim()
                ? 'none'
                : `0 8px 24px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)`,
              transition: 'all 0.15s',
            }}
          >
            {parsing ? (
              <><Spinner /> Parsing…</>
            ) : (
              <>
                {/* sparkle SVG */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/>
                  <path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>
                </svg>
                Parse Workout
              </>
            )}
          </button>

          {aiError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '10px 14px',
            }}>
              <AlertCircle size={14} color="#EF4444" />
              <span style={{ fontSize: 13, color: '#EF4444' }}>{aiError}</span>
            </div>
          )}
        </div>
      )}

      {/* Exercise table */}
      {showTable && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Parsed label (AI mode) */}
          {mode === 'ai' && parseResult && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={eyebrow}>Parsed · {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</p>
              <span style={{
                fontSize: 10.5, color: INDIGO,
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: '"JetBrains Mono", monospace', fontWeight: 600,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/>
                </svg>
                AI
              </span>
            </div>
          )}

          {/* Table */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.7fr 0.55fr 0.55fr 0.9fr 32px',
              padding: '8px 12px',
              fontSize: 9.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase',
              color: '#44445A',
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div>Exercise</div>
              <div style={{ textAlign: 'center' }}>Sets</div>
              <div style={{ textAlign: 'center' }}>Reps</div>
              <div style={{ textAlign: 'right' }}>Weight</div>
              <div />
            </div>

            {/* Exercise rows */}
            {exercises.map((ex, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1.7fr 0.55fr 0.55fr 0.9fr 32px',
                padding: '9px 12px', alignItems: 'center',
                borderBottom: i < exercises.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <input
                  value={ex.name}
                  onChange={e => updateExercise(i, { name: e.target.value })}
                  placeholder="Name"
                  style={{ ...cellInput, fontSize: 12.5, textAlign: 'left', paddingLeft: 0 }}
                />
                <input
                  type="number"
                  value={ex.sets || ''}
                  onChange={e => updateExercise(i, { sets: Number(e.target.value) })}
                  style={{ ...cellInput, textAlign: 'center' }}
                />
                <input
                  type="number"
                  value={ex.reps || ''}
                  onChange={e => updateExercise(i, { reps: Number(e.target.value) })}
                  style={{ ...cellInput, textAlign: 'center' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                  <input
                    type="number"
                    value={ex.weight_lbs || ''}
                    onChange={e => updateExercise(i, { weight_lbs: Number(e.target.value) })}
                    style={{ ...cellInput, width: 52, textAlign: 'right' }}
                  />
                  <span style={{ fontSize: 10.5, color: '#44445A', flexShrink: 0 }}>lb</span>
                </div>
                <button onClick={() => removeExercise(i)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#EF4444',
                }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Add exercise */}
          <button onClick={addEmptyExercise} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.10)',
            borderRadius: 12, padding: '10px',
            cursor: 'pointer', color: '#44445A', fontSize: 12, fontWeight: 600,
          }}>
            + Add Exercise
          </button>

          {/* Progression callout */}
          {parseResult?.progression && (
            <div style={{
              background: `linear-gradient(180deg, ${INDIGO}14, ${INDIGO}08)`,
              border: `1px solid ${INDIGO}33`,
              borderRadius: 14, padding: '14px',
              boxShadow: `0 4px 24px ${INDIGO}1a`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 7,
                  background: `${INDIGO}26`, color: INDIGO,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Zap size={13} strokeWidth={2} />
                </div>
                <span style={{
                  fontSize: 10.5, color: INDIGO, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>Progression</span>
              </div>
              <p style={{ fontSize: 12.5, color: '#C0C0D0', lineHeight: 1.55, letterSpacing: '-0.005em' }}>
                {parseResult.progression}
              </p>
            </div>
          )}

          {/* Session notes */}
          <div>
            <p style={eyebrow}>Session notes (optional)</p>
            <input
              type="text"
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              placeholder="How did it feel?"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '11px 14px',
                color: '#F0F0F5', fontSize: 13,
                fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Save button — white bg, dark text per design */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              width: '100%', height: 48,
              background: canSave ? '#F0F0F5' : 'rgba(240,240,245,0.08)',
              color: canSave ? '#0A0A10' : '#44445A',
              fontWeight: 700, fontSize: 14,
              borderRadius: 14, border: 'none',
              cursor: canSave ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
            }}
          >
            <Check size={16} strokeWidth={2.6} />
            Save Workout
          </button>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTop: '2px solid #fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

const eyebrow: React.CSSProperties = {
  fontSize: 10.5, color: '#44445A', fontWeight: 700,
  letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8,
}
const cellInput: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '2px 4px',
  color: '#F0F0F5',
  fontSize: 12.5,
  fontFamily: '"JetBrains Mono", monospace',
  outline: 'none',
  width: '100%',
}
