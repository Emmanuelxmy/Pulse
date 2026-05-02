import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, Bell, BellOff, CheckCircle } from 'lucide-react'
import { clearAllData, getEntriesByDateRange } from '@/lib/db'
import { isCalendarConnected, connectCalendar, disconnectCalendar } from '@/lib/calendar'
import {
  isPushSupported, getPermissionState, requestPermission,
  subscribeToPush, getExistingSubscription, unsubscribeFromPush,
  saveSubscription, sendTestNotification,
  DEFAULT_NOTIF_PREFS, type NotificationPrefs,
} from '@/lib/notifications'
import type { Settings } from '@/types'

interface Props {
  settings: Settings
  onUpdate: (patch: Partial<Settings>) => void
}

export default function SettingsView({ settings, onUpdate }: Props) {
  const [confirmClear, setConfirmClear] = useState(false)
  const [newHabit, setNewHabit] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [calConnected, setCalConnected] = useState(false)
  const [calLoading, setCalLoading] = useState(false)

  // Notifications state
  const [notifSubscribed, setNotifSubscribed] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifTesting, setNotifTesting] = useState(false)
  const [notifTestMsg, setNotifTestMsg] = useState('')
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIF_PREFS)
  const notifSupported = isPushSupported()
  const notifPermission = getPermissionState()

  useEffect(() => { setCalConnected(isCalendarConnected()) }, [])

  useEffect(() => {
    getExistingSubscription().then(sub => setNotifSubscribed(!!sub))
  }, [])

  async function handleConnectCalendar() {
    setCalLoading(true)
    try {
      await connectCalendar()
      setCalConnected(true)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to connect')
    }
    setCalLoading(false)
  }

  function handleDisconnectCalendar() {
    disconnectCalendar()
    setCalConnected(false)
  }

  async function handleExport() {
    const data = await getEntriesByDateRange('2000-01-01', '2099-12-31')
    const blob = new Blob([JSON.stringify({ entries: data, settings }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pulse-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleClear() {
    await clearAllData()
    setConfirmClear(false)
    window.location.reload()
  }

  function addHabit() {
    if (!newHabit.trim()) return
    onUpdate({ habits: [...settings.habits, newHabit.trim()] })
    setNewHabit('')
  }

  function removeHabit(i: number) {
    const h = [...settings.habits]
    h.splice(i, 1)
    onUpdate({ habits: h })
  }

  function addCategory() {
    if (!newCategory.trim()) return
    onUpdate({ task_categories: [...settings.task_categories, newCategory.trim()] })
    setNewCategory('')
  }

  async function handleEnableNotifications() {
    setNotifLoading(true)
    try {
      const granted = await requestPermission()
      if (!granted) { setNotifLoading(false); return }
      const sub = await subscribeToPush()
      if (sub) {
        await saveSubscription(sub, notifPrefs)
        setNotifSubscribed(true)
      }
    } catch { /* ignore */ }
    setNotifLoading(false)
  }

  async function handleDisableNotifications() {
    await unsubscribeFromPush()
    setNotifSubscribed(false)
  }

  async function handleUpdatePrefs(patch: Partial<NotificationPrefs>) {
    const updated = { ...notifPrefs, ...patch }
    setNotifPrefs(updated)
    const sub = await getExistingSubscription()
    if (sub) await saveSubscription(sub, updated)
  }

  async function handleTestNotification() {
    setNotifTesting(true)
    setNotifTestMsg('')
    try {
      await sendTestNotification()
      setNotifTestMsg('Sent! Check for the notification.')
    } catch (e) {
      setNotifTestMsg(e instanceof Error ? e.message : 'Failed')
    }
    setNotifTesting(false)
    setTimeout(() => setNotifTestMsg(''), 4000)
  }

  function removeCategory(i: number) {
    const c = [...settings.task_categories]
    c.splice(i, 1)
    onUpdate({ task_categories: c })
  }

  return (
    <div className="px-4 pt-6 pb-4 flex flex-col gap-6">
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F5' }}>Settings</h1>

      {/* Training */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Training</h2>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['max_hr', 'Max HR (bpm)'] ,
            ['resting_hr', 'Resting HR'],
            ['zone1_ceiling_hr', 'Z1 ceiling'],
            ['zone2_ceiling_hr', 'Z2 ceiling'],
            ['sessions_per_week_target', 'Sessions/week'],
          ] as [keyof Settings, string][]).map(([key, label]) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input
                type="number"
                value={settings[key] as number}
                onChange={e => onUpdate({ [key]: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
        {/* Phase toggle */}
        <div className="mt-3">
          <label style={labelStyle}>Training Phase</label>
          <div className="flex gap-2 mt-1">
            {(['phase1', 'phase2'] as const).map(p => (
              <button
                key={p}
                onClick={() => onUpdate({ training_phase: p })}
                style={pillStyle(settings.training_phase === p)}
              >
                {p === 'phase1' ? 'Phase 1 (3/wk)' : 'Phase 2 (4–5/wk)'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Nutrition */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Nutrition</h2>
        <div>
          <label style={labelStyle}>Daily Protein Target (g)</label>
          <input
            type="number"
            value={settings.protein_target_g}
            onChange={e => onUpdate({ protein_target_g: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
      </section>

      {/* Habits */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Habits</h2>
        <div className="flex flex-col gap-2">
          {settings.habits.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <span style={{ flex: 1, fontSize: 14, color: '#D0D0D0' }}>{h}</span>
              <button onClick={() => removeHabit(i)} style={iconBtn}>
                <Trash2 size={14} color="#EF4444" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addHabit() }}
              placeholder="Add habit…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addHabit} style={{ ...iconBtn, background: '#00F0B520', borderRadius: 10 }}>
              <Plus size={16} color="#00F0B5" />
            </button>
          </div>
        </div>
      </section>

      {/* Task categories */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Task Categories</h2>
        <div className="flex flex-col gap-2">
          {settings.task_categories.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span style={{ flex: 1, fontSize: 14, color: '#D0D0D0' }}>{c}</span>
              <button onClick={() => removeCategory(i)} style={iconBtn}>
                <Trash2 size={14} color="#EF4444" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCategory() }}
              placeholder="Add category…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addCategory} style={{ ...iconBtn, background: '#F5F5F520', borderRadius: 10 }}>
              <Plus size={16} color="#F5F5F5" />
            </button>
          </div>
        </div>
      </section>

      {/* Google Calendar */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Google Calendar</h2>
        {calConnected ? (
          <div className="flex flex-col gap-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calendar size={16} color="#4285F4" />
              <span style={{ fontSize: 14, color: '#4285F4', fontWeight: 500 }}>Connected</span>
              <span style={{ fontSize: 12, color: '#444', marginLeft: 'auto' }}>Tasks sync automatically</span>
            </div>
            <button onClick={handleDisconnectCalendar} style={actionBtn('#1E0A0A', '#EF4444')}>
              Disconnect Google Calendar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
              Connect to automatically add tasks to your Google Calendar when you create them.
            </p>
            <button
              onClick={handleConnectCalendar}
              disabled={calLoading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#4285F4', color: '#fff', border: 'none', borderRadius: 10,
                padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: calLoading ? 0.6 : 1,
              }}
            >
              <Calendar size={16} />
              {calLoading ? 'Connecting…' : 'Connect Google Calendar'}
            </button>
          </div>
        )}
      </section>

      {/* Notifications */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Notifications</h2>

        {!notifSupported && (
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
            Push notifications require iOS 16.4+ with Pulse added to your Home Screen, or any modern Android browser.
          </p>
        )}

        {notifSupported && !notifSubscribed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
              Get reminders for your Morning Brief, Evening Brief, and daily habit check.
            </p>
            {notifPermission === 'denied' && (
              <p style={{ fontSize: 12, color: '#EF4444' }}>
                Notifications blocked — enable them in your browser / iOS Settings.
              </p>
            )}
            <button
              onClick={handleEnableNotifications}
              disabled={notifLoading || notifPermission === 'denied'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(0,240,181,0.12)', color: '#00F0B5',
                border: '1px solid rgba(0,240,181,0.25)', borderRadius: 12,
                padding: '13px', fontSize: 14, fontWeight: 600,
                cursor: notifLoading ? 'not-allowed' : 'pointer',
                opacity: notifLoading ? 0.6 : 1,
              }}
            >
              <Bell size={16} />
              {notifLoading ? 'Enabling…' : 'Enable Notifications'}
            </button>
          </div>
        )}

        {notifSupported && notifSubscribed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={15} color="#00F0B5" />
              <span style={{ fontSize: 14, color: '#00F0B5', fontWeight: 600 }}>Notifications on</span>
            </div>

            {/* Preference toggles */}
            {([
              ['morning', '☀️ Morning Brief (7 AM)'],
              ['evening', '🌙 Evening Brief (7 PM)'],
              ['habits',  '✓ Habit reminder (9 PM)'],
              ['protein', '🥩 Protein check (noon)'],
            ] as [keyof NotificationPrefs, string][]).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: '#C0C0D0' }}>{label}</span>
                <button
                  onClick={() => handleUpdatePrefs({ [key]: !notifPrefs[key] })}
                  style={{
                    width: 44, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer',
                    background: notifPrefs[key] ? '#00F0B5' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    left: notifPrefs[key] ? 21 : 3,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>
            ))}

            {/* Test + disable */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={handleTestNotification}
                disabled={notifTesting}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                  padding: '10px', fontSize: 13, fontWeight: 600, color: '#888',
                  cursor: 'pointer',
                }}
              >
                {notifTesting ? 'Sending…' : 'Test'}
              </button>
              <button
                onClick={handleDisableNotifications}
                style={{
                  flex: 1, background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
                  padding: '10px', fontSize: 13, fontWeight: 600, color: '#EF4444',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
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
      </section>

      {/* Data */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Data</h2>
        <div className="flex flex-col gap-2">
          <button onClick={handleExport} style={actionBtn('#1E1E1E', '#F5F5F5')}>
            Export all data as JSON
          </button>
          {!confirmClear ? (
            <button onClick={() => setConfirmClear(true)} style={actionBtn('#1E0A0A', '#EF4444')}>
              Clear all data
            </button>
          ) : (
            <div style={{ background: '#EF444415', border: '1px solid #EF444430', borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 10 }}>
                This will delete ALL entries and settings locally. Are you sure?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmClear(false)} style={actionBtn('#1E1E1E', '#888')}>
                  Cancel
                </button>
                <button onClick={handleClear} style={actionBtn('#EF4444', '#fff')}>
                  Yes, clear everything
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section style={{ ...sectionStyle, textAlign: 'center' as const }}>
        <p style={{ fontSize: 20, marginBottom: 4 }}>⚡</p>
        <p style={{ fontSize: 14, color: '#888' }}>Pulse v0.1.0</p>
        <p style={{ fontSize: 12, color: '#444', marginTop: 2 }}>Built by Emmanuel / Katalyst Inc.</p>
      </section>
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 16, padding: '18px',
}
const sectionTitle: React.CSSProperties = {
  fontSize: 12, color: '#555', fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', marginBottom: 14,
}
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#666', fontWeight: 500, display: 'block', marginBottom: 4,
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10,
  padding: '10px 12px', color: '#F5F5F5', fontSize: 14, outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
}
const iconBtn: React.CSSProperties = {
  padding: '8px', background: '#1A1A1A', border: '1px solid #2A2A2A',
  borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
function pillStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 500, border: 'none',
    cursor: 'pointer', background: active ? '#00F0B520' : '#1A1A1A',
    color: active ? '#00F0B5' : '#666',
  }
}
function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    width: '100%', background: bg, color, border: `1px solid ${color}30`,
    borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', textAlign: 'left',
  }
}
