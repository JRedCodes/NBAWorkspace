import { useNavigate } from 'react-router-dom'
import type { CarouselTeam } from '../../types'

interface Props {
  team: CarouselTeam
}

export function TeamCard({ team }: Props) {
  const navigate = useNavigate()
  const record = team.wins != null && team.losses != null ? `${team.wins}–${team.losses}` : '—'
  const rankDelta = team.power_rank != null && team.previous_rank != null
    ? team.previous_rank - team.power_rank
    : null

  return (
    <button
      onClick={() => navigate(`/league/team/${team.id}`)}
      className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-lg p-4 text-left transition-colors w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{team.city}</p>
          <p className="text-white font-semibold">{team.name}</p>
        </div>
        <div className="text-right">
          {team.power_rank != null && (
            <div className="flex items-center gap-1 justify-end">
              <span className="text-lg font-bold text-white">#{team.power_rank}</span>
              {rankDelta !== null && rankDelta !== 0 && (
                <span className={`text-xs ${rankDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {rankDelta > 0 ? `↑${rankDelta}` : `↓${Math.abs(rankDelta)}`}
                </span>
              )}
            </div>
          )}
          <p className="text-sm text-gray-400">{record}</p>
        </div>
      </div>
      <div className="text-xs text-gray-500">{team.conference} · {team.division}</div>
    </button>
  )
}
