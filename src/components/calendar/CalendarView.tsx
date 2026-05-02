import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Link2 } from 'lucide-react'
import { getUpcomingEvents, isCalendarConnected, connectCalendar } from '@/lib/calendar'
import type { CalendarEvent } from '@/lib/calendar'

// ── constants ──────────────────────────────────────────────
const HOUR_H = 64        // px per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function toDateISO(d: Date) {
  return d.toISOString().split('T')[0]
}

// Return Mon–Sun strip for the week containing `date`
function getWeekDays(date: Date): Date[] {
  const day = date.getDay() // 0=Sun
  const monday = new Date(date)
  monday.setDate(date.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

// ── event helpers ─────────────────────────────────────────
function eventColor(index: number) {
  const palette = [
    { bg: 'rgba(96,165,250,0.18)',  border: 'rgba(96,165,250,0.4)',  left: '#60A5FA', text: '#93C5FD' },
    { bg: 'rgba(167,139,250,0.18)', border: 'rgba(167,139,250,0.4)', left: '#A78BFA', text: '#C4B5FD' },
    { bg: 'rgba(0,240,181,0.12)',   border: 'rgba(0,240,181,0.3)',   left: '#00F0B5', text: '#6FFFE9' },
    { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)', left: '#F59E0B', text: '#FCD34D' },
    { bg: 'rgba(239,68,68,0.14)',   border: 'rgba(239,68,68,0.35)',  left: '#EF4444', text: '#FCA5A5' },
  ]
  return palette[index % palette.length]
}

// ── component ─────────────────────────────────────────────
export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = new Date()
  const todayISO = toDateISO(today)
  const selectedISO = toDateISO(selectedDate)
  const weekDays = getWeekDays(selectedDate)

  // Check connection
  useEffect(() => {
    setConnected(isCalendarConnected())
  }, [])

  // Fetch events
  useEffect(() => {
    if (!connected) return
    setLoading(true)
    getUpcomingEvents(60)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [connected])

  // Scroll to current time on load
  useEffect(() => {
    if (!scrollRef.current || loading) return
    const now = new Date()
    const top = (now.getHours() * 60 + now.getMinutes()) * (HOUR_H / 60) - 80
    scrollRef.current.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [loading])

  async function handleConnect() {
    setConnecting(true)
    try {
      await connectCalendar()
      setConnected(true)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not connect')
    }
    setConnecting(false)
  }

  // Events for selected day
  const dayEvents = events.filter(e => {
    const start = e.start.includes('T') ? e.start : e.start + 'T00:00:00'
    return toDateISO(new Date(start)) === selectedISO
  })
  const allDayEvents = dayEvents.filter(e => !e.start.includes('T'))
  const timedEvents  = dayEvents.filter(e => e.start.includes('T'))

  // Sort timed events by start
  timedEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  const isToday     = selectedISO === todayISO
  const nowMinutes  = today.getHours() * 60 + today.getMinutes()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#080810' }}>

      {/* ── Header ── */}
      <div style={{ padding: '20px 18px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 12, color: '#44445A', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })} style={arrowBtn}>
                <ChevronLeft size={18} color="#555" />
              </button>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F0F0F5', minWidth: 120, textAlign: 'center' }}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                {isToday && <span style={{ fontSize: 12, color: '#00F0B5', marginLeft: 8, fontWeight: 600 }}>Today</span>}
              </h1>
              <button onClick={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })} style={arrowBtn}>
                <ChevronRight size={18} color="#555" />
              </button>
            </div>
          </div>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date())}
              style={{
                background: 'rgba(0,240,181,0.1)', border: '1px solid rgba(0,240,181,0.2)',
                borderRadius: 10, padding: '8px 14px', color: '#00F0B5',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Today
            </button>
          )}
        </div>

        {/* ── Week strip ── */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 14,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '8px 6px',
        }}>
          {weekDays.map((d, i) => {
            const iso = toDateISO(d)
            const isSelected = iso === selectedISO
            const isDayToday = iso === todayISO
            const hasEvent = events.some(e => {
              const s = e.start.includes('T') ? e.start : e.start + 'T00:00:00'
              return toDateISO(new Date(s)) === iso
            })
            const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '6px 2px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: isSelected ? 'rgba(0,240,181,0.15)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 9.5, color: isSelected ? '#00F0B5' : '#44445A', fontWeight: 700, letterSpacing: '0.04em' }}>
                  {DAY_LABELS[i]}
                </span>
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  color: isSelected ? '#00F0B5' : isDayToday ? '#F0F0F5' : '#555',
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDayToday && !isSelected ? 'rgba(255,255,255,0.07)' : 'transparent',
                }}>
                  {d.getDate()}
                </span>
                {/* event dot */}
                <div style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: hasEvent ? (isSelected ? '#00F0B5' : '#44445A') : 'transparent',
                }} />
              </button>
            )
          })}
        </div>

        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
            {allDayEvents.map((e, i) => {
              const c = eventColor(i)
              return (
                <div key={e.id} style={{
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderLeft: `3px solid ${c.left}`, borderRadius: 8,
                  padding: '5px 10px', fontSize: 12, color: c.text, fontWeight: 500,
                }}>
                  {e.summary}
                </div>
              )
            })}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 0 }} />
      </div>

      {/* ── Not connected ── */}
      {!connected && !loading && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22, margin: '0 auto 20px',
            background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CalendarDays size={32} color="#60A5FA" />
          </div>
          <p style={{ color: '#888', fontSize: 16, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
            Connect Google Calendar
          </p>
          <p style={{ color: '#44445A', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
            See your schedule right here and let the Coach AI use it for smarter recommendations
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            style={{
              background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
              color: '#fff', border: 'none', borderRadius: 14,
              padding: '13px 28px', fontWeight: 700, fontSize: 14,
              cursor: connecting ? 'not-allowed' : 'pointer',
              opacity: connecting ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 6px 24px rgba(96,165,250,0.3)',
            }}
          >
            <Link2 size={16} />
            {connecting ? 'Connecting…' : 'Connect Google Calendar'}
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, border: '2px solid rgba(255,255,255,0.06)',
              borderTop: '2px solid #00F0B5', borderRadius: '50%',
              margin: '0 auto 12px', animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#44445A', fontSize: 13 }}>Loading events…</p>
          </div>
        </div>
      )}

      {/* ── Time grid ── */}
      {connected && !loading && (
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          <div style={{ position: 'relative', paddingLeft: 56, paddingRight: 16, paddingBottom: 32 }}>
            {/* Total height container */}
            <div style={{ position: 'relative', height: 24 * HOUR_H }}>

              {/* Hour grid lines + labels */}
              {HOURS.map(h => (
                <div key={h} style={{
                  position: 'absolute', top: h * HOUR_H, left: 0, right: 0, height: HOUR_H,
                  borderTop: `1px solid rgba(255,255,255,${h === 0 ? 0 : 0.04})`,
                }}>
                  {h > 0 && (
                    <span style={{
                      position: 'absolute',
                      left: -54, top: -8,
                      fontSize: 10.5, color: '#2E2E42',
                      fontFamily: 'JetBrains Mono, monospace',
                      width: 44, textAlign: 'right',
                    }}>
                      {h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                    </span>
                  )}
                </div>
              ))}

              {/* Half-hour light lines */}
              {HOURS.map(h => (
                <div key={`h-${h}`} style={{
                  position: 'absolute',
                  top: h * HOUR_H + HOUR_H / 2,
                  left: 0, right: 0, height: 1,
                  background: 'rgba(255,255,255,0.02)',
                  pointerEvents: 'none',
                }} />
              ))}

              {/* Current time indicator */}
              {isToday && (
                <div style={{
                  position: 'absolute',
                  top: nowMinutes * (HOUR_H / 60),
                  left: -4, right: 0,
                  display: 'flex', alignItems: 'center',
                  pointerEvents: 'none', zIndex: 20,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.55)' }} />
                </div>
              )}

              {/* Events */}
              {timedEvents.map((e, i) => {
                const start = new Date(e.start)
                const end   = new Date(e.end)
                const startMin = start.getHours() * 60 + start.getMinutes()
                const endMin   = end.getHours() * 60 + end.getMinutes()
                const dur = Math.max(endMin - startMin, 30) // min 30min height
                const c = eventColor(i)

                return (
                  <div key={e.id} style={{
                    position: 'absolute',
                    top: startMin * (HOUR_H / 60) + 2,
                    height: dur * (HOUR_H / 60) - 4,
                    left: 4, right: 4,
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    borderLeft: `3px solid ${c.left}`,
                    borderRadius: 10,
                    padding: '5px 9px',
                    overflow: 'hidden',
                    zIndex: 10,
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: c.text, lineHeight: 1.3, marginBottom: 2 }}>
                      {e.summary}
                    </p>
                    <p style={{ fontSize: 10, color: c.left, fontFamily: 'JetBrains Mono, monospace' }}>
                      {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {' – '}
                      {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {e.location && dur >= 45 && (
                      <p style={{ fontSize: 10, color: c.text, opacity: 0.6, marginTop: 1 }}>{e.location}</p>
                    )}
                  </div>
                )
              })}

              {/* Empty day message */}
              {timedEvents.length === 0 && allDayEvents.length === 0 && (
                <div style={{
                  position: 'absolute', top: '35%', left: 0, right: 0,
                  textAlign: 'center', pointerEvents: 'none',
                }}>
                  <p style={{ color: '#22223A', fontSize: 14, fontWeight: 600 }}>No events</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

const arrowBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 10, border: 'none',
  background: 'rgba(255,255,255,0.05)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}
