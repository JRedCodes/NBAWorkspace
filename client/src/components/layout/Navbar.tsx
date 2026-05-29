import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLogout } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { workspaceService } from '../../services/workspace.service'

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
  const qc = useQueryClient()
  const [showReset, setShowReset] = useState(false)
  const resetLocalWorkspace = useWorkspaceStore((s) => s.resetWorkspace)

  const resetWorkspace = useMutation({
    mutationFn: () => workspaceService.reset(),
    onSuccess: () => {
      resetLocalWorkspace() // also clear trade legs, draft assignments, my teams
      qc.invalidateQueries({ queryKey: ['trade', 'scenarios'] })
      qc.invalidateQueries({ queryKey: ['draft', 'boards'] })
      setShowReset(false)
    },
  })

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-8 relative">
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

        {/* Reset workspace */}
        {showReset ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">Reset all saved data?</span>
            <button
              onClick={() => resetWorkspace.mutate()}
              disabled={resetWorkspace.isPending}
              className="text-xs text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
            >
              {resetWorkspace.isPending ? 'Resetting…' : 'Confirm'}
            </button>
            <button onClick={() => setShowReset(false)} className="text-xs text-gray-500 hover:text-gray-300">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowReset(true)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            title="Reset workspace — clears all saved trades and draft boards"
          >
            Reset workspace
          </button>
        )}

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
