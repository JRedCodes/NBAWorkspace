import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayerSearchAdd } from '../../components/trade/PlayerSearchAdd'
import { SalaryMeter } from '../../components/trade/SalaryMeter'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'
import { useTradeStore } from '../../store/tradeStore'
import { useValidateTrade, useProjectTrade, useCreateScenario } from '../../hooks/useTrade'
import { useAllTeams } from '../../hooks/useTeams'
import { formatSalary } from '../../utils/format'
import type { TeamTradeSummary } from '../../types'

export default function TradeMachine() {
  const navigate = useNavigate()
  const players = useTradeStore((s) => s.players)
  const picks = useTradeStore((s) => s.picks)
  const removePlayer = useTradeStore((s) => s.removePlayer)
  const clearTrade = useTradeStore((s) => s.clearTrade)
  const isProjectionStale = useTradeStore((s) => s.isProjectionStale)

  const validate = useValidateTrade()
  const project = useProjectTrade()
  const createScenario = useCreateScenario()
  const { data: teams = [] } = useAllTeams()

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]))

  // Auto-validate when players change
  useEffect(() => {
    if (players.length >= 2) {
      validate.mutate()
    }
  }, [players.length])

  const validation = validate.data
  const projection = project.data

  // Group players by team pair for display
  const teamIds = [...new Set(players.flatMap((p) => [p.fromTeamId, p.toTeamId]))]

  async function handleSave() {
    const name = `Trade (${teamIds.map((id) => teamMap[id]?.abbreviation ?? id).join(' / ')})`
    await createScenario.mutate(name)
    navigate('/trade')
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/trade')} className="text-gray-500 hover:text-gray-300 text-sm">
            ← Trading Block
          </button>
          <h1 className="text-2xl font-bold text-white">Trade Machine</h1>
        </div>
        <div className="flex gap-2">
          {players.length > 0 && (
            <button
              onClick={() => project.mutate()}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            >
              Project
            </button>
          )}
          {validation?.isValid && players.length > 0 && (
            <button
              onClick={handleSave}
              disabled={createScenario.isPending}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
            >
              Save scenario
            </button>
          )}
          {players.length > 0 && (
            <button
              onClick={clearTrade}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: builder */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add player */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Add Player
            </h2>
            <PlayerSearchAdd />
          </div>

          {/* Trade legs */}
          {players.length > 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Trade ({players.length} player{players.length !== 1 ? 's' : ''})
              </h2>
              <div className="space-y-2">
                {players.map((p) => (
                  <div key={p.playerId} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded">
                    <PlayerAvatar nbaPlayerId={undefined} name={p.playerName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{p.playerName}</p>
                      <p className="text-xs text-gray-400">
                        {teamMap[p.fromTeamId]?.abbreviation ?? '?'} →{' '}
                        {teamMap[p.toTeamId]?.abbreviation ?? '?'} · {formatSalary(p.salary)}
                      </p>
                    </div>
                    <button
                      onClick={() => removePlayer(p.playerId)}
                      className="text-gray-600 hover:text-red-400 text-lg leading-none transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 border-dashed rounded-lg p-8 text-center text-gray-600">
              <p className="text-lg mb-1">Add players to build a trade</p>
              <p className="text-sm">Search for a player above and assign sending/receiving teams</p>
            </div>
          )}

          {/* Violations */}
          {validation && !validation.isValid && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-4 space-y-1">
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">
                CBA Violations
              </h2>
              {validation.violations.map((v: { code: string; message: string }, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 shrink-0">✗</span>
                  <span className="text-red-300">{v.message}</span>
                </div>
              ))}
            </div>
          )}

          {validation?.isValid && (
            <div className="bg-green-950 border border-green-800 rounded-lg px-4 py-2 flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-sm text-green-300 font-medium">Trade is CBA-compliant</span>
            </div>
          )}

          {/* Projected stats */}
          {projection && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Projected Payrolls
              </h2>
              <div className="space-y-2">
                {Object.entries(projection.projection).map(([teamId, data]) => (
                  <div key={teamId} className="flex items-center justify-between text-sm py-1 border-b border-gray-700 last:border-0">
                    <span className="text-gray-300">{teamMap[teamId]?.name ?? teamId}</span>
                    <span className="text-white font-medium">{formatSalary((data as { projectedPayroll: number }).projectedPayroll)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: salary meters */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Salary Matching
          </h2>
          {validation && Object.entries(validation.teamSummaries).map(([teamId, summary]) => (
            <SalaryMeter
              key={teamId}
              summary={summary as TeamTradeSummary}
              teamName={teamMap[teamId]?.name ?? teamId}
            />
          ))}
          {!validation && players.length >= 2 && (
            <p className="text-sm text-gray-600">Validating...</p>
          )}
          {players.length < 2 && (
            <p className="text-sm text-gray-600">Add at least 2 players to see salary matching</p>
          )}

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-400 mb-2">CBA Rules Applied</p>
            <p>· 125% + $100K matching rule (over-cap teams)</p>
            <p>· Cap room absorption (under-cap teams)</p>
            <p>· Second apron hard cap check</p>
            <p>· Two-way contract restriction</p>
          </div>
        </div>
      </div>
    </div>
  )
}
