import { useState, useEffect } from 'react'
import { ChevronRight, Calendar, Bell, BellOff, CheckCircle, Pencil, Target, Flame, Leaf, Dumbbell } from 'lucide-react'
import { clearAllData, getEntriesByDateRange } from '@/lib/db'
import { isCalendarConnected, connectCalendar, disconnectCalendar } from '@/lib/calendar'
import {
  isPushSupported, getPermissionState, requestPermission,
  subscribeToPush, getExistingSubscription, unsubscribeFromPush,
  saveSubscription, sendTestNotification,
  DEFAULT_NOTIF_PREFS, type NotificationPrefs,
} from '@/lib/notifications'
import { generateId } from '@/lib/utils'
import type { Settings, Goal, GoalCategory, BodyStats } from '@/types'

interface Props {
  settings: Settings
  onUpdate: (patch: Partial<Settings>) => void
}

export default function SettingsView({ settings, onUpdate }: Props) {
  const [confirmClear, setConfirmClear] = useState(false)
  const [calConnected, setCalConnected] = useState(false)
  const [calLoading, setCalLoading] = useState(false)

  // Goal form state
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('strength')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalUnit, setGoalUnit] = useState('lbs')
  const [goalExercise, setGoalExercise] = useState('')
  const [goalDate, setGoalDate] = useState('')

  // Notifications
  const [notifSubscribed, setNotifSubscribed] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifTesting, setNotifTesting] = useState(false)
  const [notifTestMsg, setNotifTestMsg] = useState('')
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIF_PREFS)
  const notifSupported = isPushSupported()
  const notifPermission = getPermissionState()

  useEffect(() => { setCalConnected(isCalendarConnected()) }, [])
  useEffect(() => { getExistingSubscription().then(sub => setNotifSubscribed(!!sub)) }, [])

  const bodyStats = settings.body_stats ?? { age: 17, sex: 'male' as const }
  const goals = settings.goals ?? []

  function updateBodyStats(patch: Partial<BodyStats>) {
    onUpdate({ body_stats: { ...bodyStats, ...patch } })
  }

  function addGoal() {
    if (!goalDescription.trim() || !goalTarget) return
    const newGoal: Goal = {
      id: generateId(),
      category: goalCategory,
      description: goalDescription.trim(),
      target_value: Number(goalTarget),
      target_unit: goalUnit,
      current_value: 0,
      target_date: goalDate || undefined,
      created_at: new Date().toISOString(),
      exercise_name: goalCategory === 'strength' ? goalExercise || undefined : undefined,
    }
    onUpdate({ goals: [...goals, newGoal] })
    setGoalDescription(''); setGoalTarget(''); setGoalUnit('lbs')
    setGoalExercise(''); setGoalDate('')
  }

  function removeGoal(id: string) { onUpdate({ goals: goals.filter(g => g.id !== id) }) }

  function updateGoalProgress(id: string, current_value: number) {
    onUpdate({ goals: goals.map(g => g.id === id ? { ...g, current_value } : g) })
  }

  async function handleConnectCalendar() {
    setCalLoading(true)
    try { await connectCalendar(); setCalConnected(true) }
    catch (e) { alert(e instanceof Error ? e.message : 'Failed to connect') }
    setCalLoading(false)
  }
  function handleDisconnectCalendar() { disconnectCalendar(); setCalConnected(false) }

  async function handleExport() {
    const data = await getEntriesByDateRange('2000-01-01', '2099-12-31')
    const blob = new Blob([JSON.stringify({ entries: data, settings }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `coach-export-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleClear() { await clearAllData(); setConfirmClear(false); window.location.reload() }

  async function handleEnableNotifications() {
    setNotifLoading(true)
    try {
      const granted = await requestPermission()
      if (!granted) { setNotifLoading(false); return }
      const sub = await subscribeToPush()
      if (sub) { await saveSubscription(sub, notifPrefs); setNotifSubscribed(true) }
    } catch { /* ignore */ }
    setNotifLoading(false)
  }

  async function handleDisableNotifications() { await unsubscribeFromPush(); setNotifSubscribed(false) }

  async function handleUpdatePrefs(patch: Partial<NotificationPrefs>) {
    const updated = { ...notifPrefs, ...patch }; setNotifPrefs(updated)
    const sub = await getExistingSubscription()
    if (sub) await saveSubscription(sub, updated)
  }

  async function handleTestNotification() {
    setNotifTesting(true); setNotifTestMsg('')
    try { await sendTestNotification(); setNotifTestMsg('Sent! Check for the notification.') }
    catch (e) { setNotifTestMsg(e instanceof Error ? e.message : 'Failed') }
    setNotifTesting(false); setTimeout(() => setNotifTestMsg(''), 4000)
  }

  // Profile subtitle from body stats
  const phase = settings.training_phase === 'phase2' ? 'Phase 2' : 'Phase 1'
  const statsLine = [
    `${phase}`,
    bodyStats.age && `${bodyStats.age}y`,
    bodyStats.height_cm && `${bodyStats.height_cm} cm`,
    bodyStats.weight_kg && `${bodyStats.weight_kg} kg`,
  ].filter(Boolean).join(' · ')

  const goalCatConfig: Record<GoalCategory, { color: string; Icon: typeof Dumbbell }> = {
    strength:  { color: '#6366F1', Icon: Dumbbell },
    nutrition: { color: '#F59E0B', Icon: Leaf },
    cardio:    { color: '#00F0B5', Icon: Flame },
  }

  return (
    <div style={{ padding: '16px 18px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page title */}
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#F0F0F5', letterSpacing: '-0.025em' }}>Settings</h1>

      {/* ── Profile chip ── */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 14,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 22, flexShrink: 0,
          background: 'linear-gradient(135deg, #00F0B5, #6366F1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0A0A10', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em',
          boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
        }}>
          {/* dumbbell icon as placeholder for initials */}
          <Dumbbell size={20} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F0F5', letterSpacing: '-0.01em' }}>
            Athlete
          </div>
          <div style={{ fontSize: 11, color: '#8A8A99', marginTop: 2 }}>{statsLine}</div>
        </div>
        <ChevronRight size={16} strokeWidth={2.2} color="#44445A" />
      </div>

      {/* ── Goals ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <p style={eyebrow}>Goals</p>
          {goals.length > 0 && (
            <span className="font-data" style={{ fontSize: 10.5, color: '#44445A' }}>{goals.length} active</span>
          )}
        </div>

        {/* Goal list with mini rings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {goals.map(goal => {
            const pct = goal.target_value > 0 ? Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100) : 0
            const c = goalCatConfig[goal.category]?.color ?? '#6366F1'
            const circum = 2 * Math.PI * 20
            return (
              <div key={goal.id} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                {/* Mini ring */}
                <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
                  <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <circle cx="24" cy="24" r="20" fill="none"
                      stroke={c} strokeWidth="4"
                      strokeDasharray={circum}
                      strokeDashoffset={circum * (1 - pct / 100)}
                      strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 3px ${c}88)` }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="font-data" style={{ fontSize: 11, fontWeight: 700, color: c, letterSpacing: '-0.02em' }}>
                      {pct}
                    </span>
                  </div>
                </div>

                {/* Goal info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F5', letterSpacing: '-0.01em', marginBottom: 4 }}>
                    {goal.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Inline current value edit */}
                    <span className="font-data" style={{ fontSize: 11.5, letterSpacing: '-0.01em' }}>
                      <input
                        type="number"
                        value={goal.current_value || ''}
                        onChange={e => updateGoalProgress(goal.id, Number(e.target.value))}
                        placeholder="0"
                        style={{
                          width: 44, background: 'transparent', border: 'none',
                          color: c, fontSize: 11.5, fontFamily: '"JetBrains Mono", monospace',
                          outline: 'none', padding: 0, textAlign: 'right',
                        }}
                      />
                      <span style={{ color: '#2A2A38' }}> / {goal.target_value} {goal.target_unit}</span>
                    </span>
                    {goal.target_date && (
                      <span style={{
                        fontSize: 9.5, padding: '1.5px 6px', borderRadius: 5,
                        background: 'rgba(255,255,255,0.04)', color: '#44445A',
                        fontWeight: 600, letterSpacing: '0.02em',
                      }}>
                        {new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                <button onClick={() => removeGoal(goal.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: '#44445A',
                }}>
                  <Pencil size={14} />
                </button>
              </div>
            )
          })}

          {goals.length === 0 && (
            <p style={{ fontSize: 13, color: '#33334A', textAlign: 'center', padding: '8px 0' }}>
              No goals yet — add one below
            </p>
          )}
        </div>

        {/* Add Goal form — always visible inline card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 16, padding: '16px',
          boxShadow: `0 4px 24px rgba(99,102,241,0.08)`,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* Form header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 9,
              background: 'rgba(99,102,241,0.12)', color: '#6366F1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Target size={15} strokeWidth={2} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#F0F0F5', letterSpacing: '-0.01em' }}>New goal</span>
          </div>

          {/* Category pills */}
          <div>
            <p style={{ ...eyebrow, fontSize: 9.5, marginBottom: 8 }}>Category</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['strength', 'nutrition', 'cardio'] as GoalCategory[]).map(cat => {
                const conf = goalCatConfig[cat]
                const active = goalCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setGoalCategory(cat)}
                    style={{
                      flex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '8px 10px', borderRadius: 99,
                      background: active ? `${conf.color}1c` : 'rgba(255,255,255,0.03)',
                      color: active ? conf.color : '#44445A',
                      border: active ? `1px solid ${conf.color}55` : '1px solid rgba(255,255,255,0.07)',
                      fontSize: 11.5, fontWeight: 600, letterSpacing: '-0.005em', cursor: 'pointer',
                    }}
                  >
                    <conf.Icon size={12} strokeWidth={2} />
                    <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* What */}
          <div>
            <p style={{ ...eyebrow, fontSize: 9.5, marginBottom: 6 }}>What</p>
            <input
              type="text"
              value={goalDescription}
              onChange={e => setGoalDescription(e.target.value)}
              placeholder="e.g. Bench press 1RM"
              style={inputStyle}
            />
          </div>

          {/* Exercise name (strength only) */}
          {goalCategory === 'strength' && (
            <div>
              <p style={{ ...eyebrow, fontSize: 9.5, marginBottom: 6 }}>Exercise name (auto-tracks from logs)</p>
              <input
                type="text"
                value={goalExercise}
                onChange={e => setGoalExercise(e.target.value)}
                placeholder="e.g. Bench Press"
                style={inputStyle}
              />
            </div>
          )}

          {/* Target + Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 8 }}>
            <div>
              <p style={{ ...eyebrow, fontSize: 9.5, marginBottom: 6 }}>Target</p>
              <input
                type="number"
                value={goalTarget}
                onChange={e => setGoalTarget(e.target.value)}
                placeholder="225"
                style={{
                  ...inputStyle,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 14, fontWeight: 600, color: '#6366F1',
                }}
              />
            </div>
            <div>
              <p style={{ ...eyebrow, fontSize: 9.5, marginBottom: 6 }}>Unit</p>
              <input
                type="text"
                value={goalUnit}
                onChange={e => setGoalUnit(e.target.value)}
                placeholder="lbs"
                style={inputStyle}
              />
            </div>
          </div>

          {/* By date (optional) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <p style={{ ...eyebrow, fontSize: 9.5, marginBottom: 0 }}>By</p>
              <span style={{ fontSize: 9.5, color: '#2A2A38', fontWeight: 500, letterSpacing: '0.04em' }}>· optional</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} color="#44445A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="date"
                value={goalDate}
                onChange={e => setGoalDate(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 34, colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Add Goal button */}
          <button
            onClick={addGoal}
            disabled={!goalDescription.trim() || !goalTarget}
            style={{
              width: '100%', height: 48,
              background: goalDescription.trim() && goalTarget
                ? `linear-gradient(180deg, #6366F1, #4F52D4)`
                : 'rgba(99,102,241,0.08)',
              color: goalDescription.trim() && goalTarget ? '#fff' : '#44445A',
              fontWeight: 700, fontSize: 13.5, borderRadius: 12, border: 'none',
              cursor: goalDescription.trim() && goalTarget ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: goalDescription.trim() && goalTarget
                ? '0 6px 20px rgba(99,102,241,0.32), inset 0 1px 0 rgba(255,255,255,0.2)'
                : 'none',
              letterSpacing: '-0.005em',
            }}
          >
            <Target size={14} />
            Add Goal
          </button>
        </div>
      </div>

      {/* ── Body Stats ── */}
      <div style={card}>
        <p style={eyebrow}>Body Stats</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <p style={labelStyle}>Age</p>
            <input type="number" value={bodyStats.age}
              onChange={e => updateBodyStats({ age: Number(e.target.value) })}
              style={inputStyle}
            />
          </div>
          <div>
            <p style={labelStyle}>Sex</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {(['male', 'female'] as const).map(s => (
                <button key={s} onClick={() => updateBodyStats({ sex: s })} style={pillBtn(bodyStats.sex === s, '#00F0B5')}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={labelStyle}>Height (cm)</p>
            <input type="number" value={bodyStats.height_cm ?? ''}
              onChange={e => updateBodyStats({ height_cm: Number(e.target.value) || undefined })}
              placeholder="175" style={inputStyle}
            />
          </div>
          <div>
            <p style={labelStyle}>Weight (kg)</p>
            <input type="number" value={bodyStats.weight_kg ?? ''}
              onChange={e => updateBodyStats({ weight_kg: Number(e.target.value) || undefined })}
              placeholder="70" style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* ── Preferences list ── */}
      <div style={card}>
        <p style={eyebrow}>Preferences</p>
        <div style={{ borderRadius: 12, overflow: 'hidden' }}>
          {[
            {
              label: 'Training phase',
              val: settings.training_phase === 'phase2' ? 'Phase 2 · Build' : 'Phase 1 · Base',
              icon: <Dumbbell size={14} />,
              sub: (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {(['phase1', 'phase2'] as const).map(p => (
                    <button key={p} onClick={() => onUpdate({ training_phase: p })}
                      style={pillBtn(settings.training_phase === p, '#6366F1')}>
                      {p === 'phase1' ? 'Phase 1 (3/wk)' : 'Phase 2 (4-5/wk)'}
                    </button>
                  ))}
                </div>
              ),
            },
            {
              label: 'Max HR / Rest HR',
              val: `${settings.max_hr} · ${settings.resting_hr} bpm`,
              icon: <Flame size={14} />,
              sub: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                  {([
                    ['max_hr', 'Max HR'] ,
                    ['resting_hr', 'Rest HR'],
                    ['zone1_ceiling_hr', 'Z1 ceil'],
                    ['zone2_ceiling_hr', 'Z2 ceil'],
                  ] as [keyof Settings, string][]).map(([key, lbl]) => (
                    <div key={key}>
                      <p style={{ ...labelStyle, marginBottom: 3 }}>{lbl}</p>
                      <input type="number" value={settings[key] as number}
                        onChange={e => onUpdate({ [key]: Number(e.target.value) })}
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }}
                      />
                    </div>
                  ))}
                </div>
              ),
            },
            {
              label: 'Protein target',
              val: `${settings.protein_target_g} g/day`,
              icon: <Leaf size={14} />,
              sub: (
                <div style={{ marginTop: 8 }}>
                  <input type="number" value={settings.protein_target_g}
                    onChange={e => onUpdate({ protein_target_g: Number(e.target.value) })}
                    style={{ ...inputStyle, maxWidth: 140 }}
                  />
                </div>
              ),
            },
            {
              label: 'Calories',
              val: `${settings.calorie_target ?? 2650} cut · ${settings.calorie_maintenance ?? 3100} maintenance`,
              icon: <Flame size={14} color="#F97316" />,
              sub: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                  <div>
                    <p style={{ ...labelStyle, marginBottom: 3, color: '#10B981' }}>Cut goal (kcal)</p>
                    <input type="number" value={settings.calorie_target ?? 2650}
                      onChange={e => onUpdate({ calorie_target: Number(e.target.value) })}
                      style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <p style={{ ...labelStyle, marginBottom: 3, color: '#EF4444' }}>Maintenance (kcal)</p>
                    <input type="number" value={settings.calorie_maintenance ?? 3100}
                      onChange={e => onUpdate({ calorie_maintenance: Number(e.target.value) })}
                      style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                </div>
              ),
            },
            {
              label: 'Sessions / week',
              val: `${settings.sessions_per_week_target}`,
              icon: <Target size={14} />,
              sub: (
                <div style={{ marginTop: 8 }}>
                  <input type="number" value={settings.sessions_per_week_target}
                    onChange={e => onUpdate({ sessions_per_week_target: Number(e.target.value) })}
                    style={{ ...inputStyle, maxWidth: 100 }}
                  />
                </div>
              ),
            },
          ].map((row, i, arr) => (
            <PrefRow key={i} label={row.label} val={row.val} icon={row.icon} isLast={i === arr.length - 1}>
              {row.sub}
            </PrefRow>
          ))}
        </div>
      </div>

      {/* ── Google Calendar ── */}
      <div style={card}>
        <p style={eyebrow}>Google Calendar</p>
        {calConnected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calendar size={16} color="#4285F4" />
              <span style={{ fontSize: 14, color: '#4285F4', fontWeight: 500 }}>Connected</span>
            </div>
            <button onClick={handleDisconnectCalendar} style={actionBtn('#1E0A0A', '#EF4444')}>
              Disconnect Google Calendar
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: '#44445A', lineHeight: 1.5 }}>
              Connect to sync events with your training schedule.
            </p>
            <button onClick={handleConnectCalendar} disabled={calLoading} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#4285F4', color: '#fff', border: 'none', borderRadius: 12,
              padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              opacity: calLoading ? 0.6 : 1,
            }}>
              <Calendar size={16} />
              {calLoading ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
          </div>
        )}
      </div>

      {/* ── Notifications ── */}
      <div style={card}>
        <p style={eyebrow}>Notifications</p>
        {!notifSupported && (
          <p style={{ fontSize: 13, color: '#44445A', lineHeight: 1.5 }}>
            Push notifications require iOS 16.4+ with Coach added to your Home Screen, or a modern Android browser.
          </p>
        )}
        {notifSupported && !notifSubscribed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: '#44445A', lineHeight: 1.5 }}>
              Get reminders for your Morning Brief, Evening Brief, and protein check.
            </p>
            {notifPermission === 'denied' && (
              <p style={{ fontSize: 12, color: '#EF4444' }}>
                Notifications blocked — enable them in your browser / iOS Settings.
              </p>
            )}
            <button onClick={handleEnableNotifications}
              disabled={notifLoading || notifPermission === 'denied'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(0,240,181,0.12)', color: '#00F0B5',
                border: '1px solid rgba(0,240,181,0.25)', borderRadius: 12,
                padding: '13px', fontSize: 14, fontWeight: 600,
                cursor: notifLoading ? 'not-allowed' : 'pointer', opacity: notifLoading ? 0.6 : 1,
              }}
            >
              <Bell size={16} />
              {notifLoading ? 'Enabling...' : 'Enable Notifications'}
            </button>
          </div>
        )}
        {notifSupported && notifSubscribed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={15} color="#00F0B5" />
              <span style={{ fontSize: 14, color: '#00F0B5', fontWeight: 600 }}>Notifications on</span>
            </div>
            {([['morning', 'Morning Brief (7 AM)'], ['evening', 'Evening Brief (7 PM)'], ['protein', 'Protein check (noon)']] as [keyof NotificationPrefs, string][]).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: '#C0C0D0' }}>{label}</span>
                <button onClick={() => handleUpdatePrefs({ [key]: !notifPrefs[key] })} style={{
                  width: 44, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: notifPrefs[key] ? '#00F0B5' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    left: notifPrefs[key] ? 21 : 3, boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={handleTestNotification} disabled={notifTesting} style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, color: '#888', cursor: 'pointer',
              }}>{notifTesting ? 'Sending...' : 'Test'}</button>
              <button onClick={handleDisableNotifications} style={{
                flex: 1, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, color: '#EF4444',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <BellOff size={14} /> Disable
              </button>
            </div>
            {notifTestMsg && (
              <p style={{ fontSize: 12, color: notifTestMsg.includes('Sent') ? '#00F0B5' : '#EF4444', textAlign: 'center' }}>
                {notifTestMsg}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Data ── */}
      <div style={card}>
        <p style={eyebrow}>Data</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={handleExport} style={actionBtn('rgba(255,255,255,0.04)', '#F0F0F5')}>
            Export all data as JSON
          </button>
          {!confirmClear ? (
            <button onClick={() => setConfirmClear(true)} style={actionBtn('rgba(239,68,68,0.06)', '#EF4444')}>
              Clear all data
            </button>
          ) : (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 10 }}>
                This will delete ALL entries and settings locally. Are you sure?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmClear(false)} style={actionBtn('rgba(255,255,255,0.04)', '#888')}>Cancel</button>
                <button onClick={handleClear} style={actionBtn('#EF4444', '#fff')}>Yes, clear everything</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── About ── */}
      <div style={{ ...card, textAlign: 'center' }}>
        <p style={{ fontSize: 22, marginBottom: 6 }}>💪</p>
        <p style={{ fontSize: 14, color: '#8A8A99', fontWeight: 600 }}>Coach v0.2.0</p>
        <p style={{ fontSize: 12, color: '#44445A', marginTop: 3 }}>Built by Emmanuel / Katalyst Inc.</p>
      </div>

    </div>
  )
}

// ── PrefRow — expandable preference row ──
function PrefRow({ label, val, icon, isLast, children }: {
  label: string; val: string; icon: React.ReactNode; isLast: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 14px', minHeight: 48, width: '100%', cursor: 'pointer',
          background: 'none', border: 'none', textAlign: 'left',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 9,
          background: 'rgba(255,255,255,0.04)', color: '#44445A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <span style={{ fontSize: 13, color: '#F0F0F5', fontWeight: 500, flex: 1, letterSpacing: '-0.01em' }}>{label}</span>
        <span style={{ fontSize: 11.5, color: '#44445A' }}>{val}</span>
        <ChevronRight size={13} strokeWidth={2.2} color="#2A2A38" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
      </button>
      {open && <div style={{ padding: '0 14px 14px' }}>{children}</div>}
    </div>
  )
}

// ── Styles ──
const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16, padding: 18,
}
const eyebrow: React.CSSProperties = {
  fontSize: 10.5, color: '#44445A', fontWeight: 700,
  letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 12,
}
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#44445A', fontWeight: 500, display: 'block', marginBottom: 4,
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
  padding: '10px 12px', color: '#F0F0F5', fontSize: 14, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}
function pillBtn(active: boolean, color: string): React.CSSProperties {
  return {
    flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 500,
    border: active ? `1px solid ${color}55` : '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer',
    background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
    color: active ? color : '#44445A',
  }
}
function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    width: '100%', background: bg, color,
    border: `1px solid ${color}22`,
    borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', textAlign: 'left',
  }
}
