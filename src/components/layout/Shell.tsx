import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background: '#080810',
        backgroundImage: 'radial-gradient(ellipse 90% 40% at 50% 0%, rgba(0,240,181,0.05) 0%, transparent 100%)',
      }}
    >
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />
      <main
        className="no-scrollbar"
        style={{
          overflowY: 'auto',
          height: 'calc(100dvh - env(safe-area-inset-top))',
          paddingBottom: 'calc(110px + env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
