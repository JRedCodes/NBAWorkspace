import { useState } from 'react'
import { usePlayerSearch } from '../../hooks/usePlayers'
import { useTradeStore } from '../../store/tradeStore'
import { useAllTeams } from '../../hooks/useTeams'
import { PlayerAvatar } from '../ui/PlayerAvatar'
import { formatSalary } from '../../utils/format'
import type { Player } from '../../types'

export function PlayerSearchAdd() {
  const [query, setQuery] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [fromTeamId, setFromTeamId] = useState('')
  const [toTeamId, setToTeamId] = useState('')

  const { data: results = [] } = usePlayerSearch(query)
  const { data: teams = [] } = useAllTeams()
  const addPlayer = useTradeStore((s) => s.addPlayer)

  function handleSelect(player: Player) {
    setSelectedPlayer(player)
    setFromTeamId(player.team_id ?? '')
    setQuery('')
  }

  function handleAdd() {
    if (!selectedPlayer || !fromTeamId || !toTeamId) return
    const fromTeam = teams.find((t) => t.id === fromTeamId)
    const toTeam = teams.find((t) => t.id === toTeamId)
    addPlayer({
      playerId: selectedPlayer.id,
      playerName: `${selectedPlayer.first_name} ${selectedPlayer.last_name}`,
      salary: selectedPlayer.annual_value ?? 0,
      fromTeamId,
      fromTeamName: fromTeam?.name ?? '',
      toTeamId,
      toTeamName: toTeam?.name ?? '',
    })
    setSelectedPlayer(null)
    setFromTeamId('')
    setToTeamId('')
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search player..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        {results.length > 0 && query.length >= 2 && (
          <div className="absolute z-10 top-full left-0 right-0 bg-gray-800 border border-gray-600 rounded mt-1 max-h-48 overflow-y-auto">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 text-left"
              >
                <PlayerAvatar nbaPlayerId={p.nba_player_id} name={`${p.first_name} ${p.last_name}`} size="xs" />
                <span className="text-sm text-white">{p.first_name} {p.last_name}</span>
                <span className="text-xs text-gray-500 ml-auto">{p.team_abbr}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Team assignment */}
      {selectedPlayer && (
        <div className="bg-gray-700 rounded p-3 space-y-2">
          <div className="flex items-center gap-2">
            <PlayerAvatar nbaPlayerId={selectedPlayer.nba_player_id} name={`${selectedPlayer.first_name} ${selectedPlayer.last_name}`} size="sm" />
            <div>
              <p className="text-sm text-white font-medium">{selectedPlayer.first_name} {selectedPlayer.last_name}</p>
              <p className="text-xs text-gray-400">{selectedPlayer.position} · {formatSalary(selectedPlayer.annual_value)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">From</label>
              <select
                value={fromTeamId}
                onChange={(e) => setFromTeamId(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.abbreviation} – {t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">To</label>
              <select
                value={toTeamId}
                onChange={(e) => setToTeamId(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select team</option>
                {teams.filter((t) => t.id !== fromTeamId).map((t) => (
                  <option key={t.id} value={t.id}>{t.abbreviation} – {t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!fromTeamId || !toTeamId}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
            >
              Add to trade
            </button>
            <button
              onClick={() => setSelectedPlayer(null)}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-gray-300 text-sm rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
