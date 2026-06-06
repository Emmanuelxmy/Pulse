import { useEffect, useState } from 'react'
import Shell from '@/components/layout/Shell'
import TrackerView from '@/components/today/TodayView'
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
    <>
      {updateReady && (
        <div
          onClick={applySwUpdate}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
            background: 'linear-gradient(90deg, #6366F1, #4F46E5)',
            color: '#fff', textAlign: 'center',
            padding: 'calc(env(safe-area-inset-top) + 10px) 16px 10px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 16px rgba(99,102,241,0.4)',
          }}
        >
          New version available — tap to update
        </div>
      )}
      <Shell>
        <TrackerView settings={settings} onUpdateSettings={updateSettings} />
      </Shell>
    </>
  )
}
