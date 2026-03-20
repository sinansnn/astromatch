import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth'

const NAV_ITEMS = [
  { path: 'daily',    icon: '🌅', label: 'Today'    },
  { path: 'discover', icon: '🔮', label: 'Discover'  },
  { path: 'matches',  icon: '💫', label: 'Matches'   },
  { path: 'chart',    icon: '🌌', label: 'Chart'     },
  { path: 'profile',  icon: '👤', label: 'Profile'   },
]

export function AppLayout() {
  const { profile } = useAuthStore()
  const location = useLocation()
  const isChatPage = location.pathname.includes('/chat/')

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      {!isChatPage && (
        <div className="flex-shrink-0 px-5 pt-4 pb-2 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="font-display text-xl text-white tracking-widest">ASTROMATCH</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">{profile?.sun_sign ? getSunSymbol(profile.sun_sign) : '✨'}</span>
            <div className="w-7 h-7 rounded-full bg-cosmos-card border border-cosmos-border flex items-center justify-center text-xs text-cosmos-muted">
              {profile?.display_name?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Bottom navigation */}
      {!isChatPage && (
        <nav className="flex-shrink-0 flex items-center"
          style={{
            background: 'rgba(10,10,26,0.95)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={`/app/${item.path}`}
              className="flex-1 flex flex-col items-center gap-1 py-3 relative"
            >
              {({ isActive }) => (
                <>
                  <span className="text-xl">{item.icon}</span>
                  <span className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-stellar-lavender' : 'text-cosmos-muted'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-stellar-lavender"
                      style={{ boxShadow: '0 0 6px #E8C5FF' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}

function getSunSymbol(sign: string) {
  const symbols: Record<string, string> = {
    Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
    Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓'
  }
  return symbols[sign] || '✨'
}
