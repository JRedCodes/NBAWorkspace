import { useParams, useNavigate } from 'react-router-dom'
import { useTeam, useRoster, useTeamStats, useTeamNeeds, useTeamCap, useTeamPicks } from '../../hooks/useTeams'
import { NeedsRadar } from '../../components/league/NeedsRadar'
import { TradeProjectionBanner } from '../../components/trade/TradeProjectionBanner'
import { DraftProjectionBanner } from '../../components/draft/DraftProjectionBanner'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'
import { formatSalary } from '../../utils/format'
import { useTradeProjection } from '../../hooks/useTradeProjection'

export default function TeamView() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()

  const { data: team, isLoading } = useTeam(teamId!)
  const { data: roster } = useRoster(teamId!)
  const { data: stats } = useTeamStats(teamId!)
  const { data: needs } = useTeamNeeds(teamId!)
  const { data: cap } = useTeamCap(teamId!)
  const { data: picks } = useTeamPicks(teamId!)
  const projection = useTradeProjection(teamId!)

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!team) return null

  const record = stats ? `${stats.wins}–${stats.losses}` : '—'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/league')} className="text-gray-500 hover:text-gray-300 text-sm">
          ← League
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{team.city} {team.name}</h1>
          <p className="text-gray-400 text-sm">{team.conference}ern Conference · {team.division} Division · {record}</p>
        </div>
      </div>

      {/* Trade projection overlay */}
      {projection && (
        <TradeProjectionBanner
          playersOut={projection.playersOut}
          playersIn={projection.playersIn}
          projectedPayroll={projection.projectedPayroll}
          netChange={projection.netChange}
          isValid={projection.isValid}
          violations={projection.violations}
        />
      )}

      {/* Draft simulation overlay */}
      <DraftProjectionBanner teamId={teamId!} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Roster</h2>
          {roster?.length ? (
            <div className="space-y-1">
              {(roster as Record<string, unknown>[]).map((player) => (
                <button
                  key={player.id as string}
                  onClick={() => navigate(`/players/${player.id}`)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      nbaPlayerId={player.nba_player_id as number}
                      name={`${player.first_name} ${player.last_name}`}
                      size="sm"
                    />
                    <span className="text-xs text-gray-500 w-5 text-right shrink-0">{player.jersey_number as string}</span>
                    <span className="text-white text-sm">{player.first_name as string} {player.last_name as string}</span>
                    <span className="text-xs text-gray-500">{player.position as string}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-300">{formatSalary(player.current_year_salary as number)}</span>
                    {(player.is_max as boolean) && <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">MAX</span>}
                    {(player.is_rookie_scale as boolean) && <span className="ml-2 text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded">RK</span>}
                    {(player.is_two_way as boolean) && <span className="ml-2 text-xs bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded">2W</span>}
                    {(player.has_player_option as boolean) && <span className="ml-2 text-xs bg-yellow-900 text-yellow-300 px-1.5 py-0.5 rounded">PO</span>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No roster data. Run the ingestion worker.</p>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Team Stats */}
          {stats && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Season Stats</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'OffRtg', value: stats.offensive_rating?.toFixed(1) },
                  { label: 'DefRtg', value: stats.defensive_rating?.toFixed(1) },
                  { label: 'NetRtg', value: stats.net_rating?.toFixed(1) },
                  { label: 'Pace', value: stats.pace?.toFixed(1) },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-xl font-bold text-white">{value ?? '—'}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cap */}
          {cap && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Cap</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Payroll</span>
                  <span className="text-white">{formatSalary(cap.total_payroll)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cap space</span>
                  <span className="text-white">{formatSalary(cap.cap_space)}</span>
                </div>
                {cap.is_over_tax && (
                  <span className="text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded">Over Tax</span>
                )}
              </div>
            </div>
          )}

          {/* Needs Radar */}
          {needs && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Needs</h2>
              <NeedsRadar needs={needs} />
            </div>
          )}

          {/* Picks */}
          {picks && (picks as unknown[]).length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Draft Picks</h2>
              <div className="space-y-1">
                {(picks as Record<string, unknown>[]).slice(0, 6).map((pick) => (
                  <div key={pick.id as string} className="flex justify-between text-sm">
                    <span className="text-gray-300">{pick.draft_year as number} R{pick.round as number}</span>
                    <span className="text-gray-500">{pick.original_team_abbr as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
