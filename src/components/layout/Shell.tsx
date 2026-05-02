import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex flex-col min-h-screen"
      style={{ background: '#0A0A0A' }}
    >
      {/* Safe area top padding */}
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      {/* Page content — leave room for bottom nav */}
      <main
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{ paddingBottom: 'calc(60px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
