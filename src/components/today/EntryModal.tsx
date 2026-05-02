import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

export default function EntryModal({ title, onClose, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // On iOS the keyboard doesn't resize the viewport, so we use
  // window.visualViewport to push the sheet up when the keyboard opens.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    function reposition() {
      if (!sheetRef.current) return
      // Distance from bottom of visual viewport to bottom of layout viewport
      const offset = window.innerHeight - vv!.height - vv!.offsetTop
      sheetRef.current.style.transform = `translateY(-${Math.max(0, offset)}px)`
    }

    vv.addEventListener('resize', reposition)
    vv.addEventListener('scroll', reposition)
    return () => {
      vv.removeEventListener('resize', reposition)
      vv.removeEventListener('scroll', reposition)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={sheetRef}
        className="animate-slide-up w-full rounded-t-3xl"
        style={{
          background: 'rgba(14,14,20,0.98)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderBottom: 'none',
          // Use dvh so it respects the actual visible area
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          // Smooth keyboard animation
          transition: 'transform 0.25s ease',
          willChange: 'transform',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header — fixed inside the sheet, doesn't scroll */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px 12px', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F0F0F5' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <X size={15} color="#666" />
          </button>
        </div>

        {/* Scrollable content — this part moves out from under the keyboard */}
        <div
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '20px 20px',
            // Extra space at the bottom so the save button is never hidden
            paddingBottom: 'max(32px, env(safe-area-inset-bottom, 16px))',
            flex: 1,
            minHeight: 0,
          }}
          className="no-scrollbar"
        >
          {children}
          {/* Keyboard buffer — ensures content is reachable when keyboard is up */}
          <div style={{ height: 120 }} />
        </div>
      </div>
    </div>
  )
}
