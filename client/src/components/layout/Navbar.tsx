import { Link, useLocation } from 'react-router-dom'
import { useLogout } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'

const NAV_ITEMS = [
  { to: '/league', label: 'League' },
  { to: '/trade', label: 'Trading Block' },
  { to: '/draft', label: 'Draft Board' },
  { to: '/simulation', label: 'Simulation' },
]

export function Navbar() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-8">
      <Link to="/" className="text-white font-bold text-lg tracking-tight shrink-0">
        GM Intel
      </Link>

      <div className="flex items-center gap-1 flex-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              location.pathname.startsWith(item.to)
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">{user?.displayName}</span>
        <button
          onClick={() => logout.mutate()}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
