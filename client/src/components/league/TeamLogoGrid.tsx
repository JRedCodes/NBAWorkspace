import { useNavigate } from 'react-router-dom'
import type { CarouselTeam } from '../../types'

interface Props {
  teams: CarouselTeam[]
  activeId: string | null
  onSelect: (index: number) => void
}

const CONF_COLORS: Record<string, string> = {
  East: 'hover:bg-blue-900/40 hover:border-blue-700',
  West: 'hover:bg-orange-900/40 hover:border-orange-700',
}

export function TeamLogoGrid({ teams, activeId, onSelect }: Props) {
  const navigate = useNavigate()
  const east = teams.filter((t) => t.conference === 'East')
  const west = teams.filter((t) => t.conference === 'West')

  function TeamButton({ team }: { team: CarouselTeam }) {
    const idx = teams.findIndex((t) => t.id === team.id)
    const isActive = team.id === activeId
    const hoverClass = CONF_COLORS[team.conference] ?? ''

    return (
      <button
        onClick={() => onSelect(idx)}
        onDoubleClick={() => navigate(`/league/team/${team.id}`)}
        title={`${team.city} ${team.name}`}
        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
          isActive
            ? 'border-blue-500 bg-blue-900/30'
            : `border-gray-700 bg-gray-800/50 ${hoverClass}`
        }`}
      >
        {team.logo_url ? (
          <img src={team.logo_url} alt={team.abbreviation} className="w-8 h-8 object-contain" />
        ) : (
          <span
            className={`text-xs font-bold tracking-tight ${isActive ? 'text-blue-400' : 'text-gray-400'}`}
          >
            {team.abbreviation}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Eastern Conference
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {east.map((t) => (
            <TeamButton key={t.id} team={t} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Western Conference
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {west.map((t) => (
            <TeamButton key={t.id} team={t} />
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-600 text-center">Double-click to open team view</p>
    </div>
  )
}
