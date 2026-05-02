import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Shell from '@/components/layout/Shell'
import TodayView from '@/components/today/TodayView'
import CoachView from '@/components/coach/CoachView'
import CalendarView from '@/components/calendar/CalendarView'
import DashboardView from '@/components/dashboard/DashboardView'
import SettingsView from '@/components/settings/SettingsView'
import { useSettings } from '@/hooks/useSettings'
import { useSync } from '@/hooks/useSync'

export default function App() {
  useSync()
  const { settings, update: updateSettings } = useSettings()

  return (
    <BrowserRouter>
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
