import { NavLink } from 'react-router-dom'
import { Home, Brain, Settings } from 'lucide-react'

const RED = '#FF3B30'

const tabs = [
  { to: '/',         label: 'Today',    Icon: Home },
  { to: '/coach',    label: 'Coach',    Icon: Brain },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

export default function BottomNav() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(14px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(12, 12, 18, 0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 99,
        padding: '6px 8px',
        gap: 2,
        boxShadow: '0 8px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '8px 20px',
            borderRadius: 99,
            background: isActive ? `rgba(255, 59, 48, 0.13)` : 'transparent',
            color: isActive ? RED : '#44445A',
            textDecoration: 'none',
            transition: 'all 0.18s ease',
            minWidth: 60,
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={19} strokeWidth={isActive ? 2.2 : 1.6} />
              <span style={{
                fontSize: 9.5,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}
