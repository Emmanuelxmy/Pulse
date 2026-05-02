import { NavLink } from 'react-router-dom'
import { Home, Brain, BarChart2, Settings } from 'lucide-react'

const tabs = [
  { to: '/',          label: 'Today',     Icon: Home },
  { to: '/coach',     label: 'Coach',     Icon: Brain },
  { to: '/dashboard', label: 'Dashboard', Icon: BarChart2 },
  { to: '/settings',  label: 'Settings',  Icon: Settings },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: '#0F0F0F',
        borderTop: '1px solid #2A2A2A',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(60px + env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2 transition-colors ${
              isActive ? 'text-[#00F0B5]' : 'text-[#666]'
            }`
          }
        >
          <Icon size={22} strokeWidth={1.8} />
          <span style={{ fontSize: 10, fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}
