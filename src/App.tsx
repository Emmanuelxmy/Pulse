import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Shell from '@/components/layout/Shell'
import TodayView from '@/components/today/TodayView'
import CoachView from '@/components/coach/CoachView'
import CalendarView from '@/components/calendar/CalendarView'
import DashboardView from '@/components/dashboard/DashboardView'
import SettingsView from '@/components/settings/SettingsView'
import { useSettings } from '@/hooks/useSettings'
import { useSync } from '@/hooks/useSync'
import { onSwUpdate, applySwUpdate } from './main'

export default function App() {
  useSync()
  const { settings, update: updateSettings } = useSettings()
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    onSwUpdate(() => setUpdateReady(true))
  }, [])

  return (
    <BrowserRouter>
      {/* ── Update banner ── */}
      {updateReady && (
        <div
          onClick={applySwUpdate}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
            background: 'linear-gradient(90deg, #00F0B5, #00C896)',
            color: '#080810', textAlign: 'center',
            padding: 'calc(env(safe-area-inset-top) + 10px) 16px 10px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 16px rgba(0,240,181,0.4)',
          }}
        >
          ✦ New version available — tap to update
        </div>
      )}

      <Shell>
        <Routes>
          <Route path="/"          element={<TodayView settings={settings} />} />
          <Route path="/coach"     element={<CoachView settings={settings} />} />
          <Route path="/calendar"  element={<CalendarView />} />
          <Route path="/dashboard" element={<DashboardView settings={settings} />} />
          <Route path="/settings"  element={<SettingsView settings={settings} onUpdate={updateSettings} />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
