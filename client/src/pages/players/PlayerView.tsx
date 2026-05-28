import { useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { usePlayer, usePlayerStats, usePlayerMetrics, usePlayerContract } from '../../hooks/usePlayers'
import { PercentileBar } from '../../components/player/PercentileBar'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'
import { formatSalary } from '../../utils/format'
import type { PlayerMetrics } from '../../types'

const METRIC_LABELS: { key: keyof PlayerMetrics; label: string }[] = [
  { key: 'three_point_percentile', label: '3-Point Shooting' },
  { key: 'rim_protection_score', label: 'Rim Protection' },
  { key: 'playmaking_score', label: 'Playmaking' },
  { key: 'slashing_score', label: 'Slashing' },
  { key: 'rebounding_percentile', label: 'Rebounding' },
  { key: 'poa_defense_score', label: 'POA Defense' },
  { key: 'leadership_index', label: 'Veteran Leadership' },
]

export default function PlayerView() {
  const { playerId } = useParams<{ playerId: string }>()
  const navigate = useNavigate()

  const { data: player, isLoading } = usePlayer(playerId!)
  const { data: stats } = usePlayerStats(playerId!)
  const { data: metrics } = usePlayerMetrics(playerId!)
  const { data: contract } = usePlayerContract(playerId!)

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-6" />
      </div>
    )
  }

  if (!player) return null

  const CURRENT_SEASON = '2025-26'
  const latestStats = stats?.find((s) => s.season_year === CURRENT_SEASON) ?? stats?.[0]
  const isCurrentSeason = latestStats?.season_year === CURRENT_SEASON
  const chartData = stats?.slice().reverse().map((s) => ({
    season: s.season_year,
    pts: s.points,
    reb: s.rebounds,
    ast: s.assists,
  }))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-300 text-sm shrink-0"
        >
          ←
        </button>
        <PlayerAvatar
          nbaPlayerId={player.nba_player_id}
          name={`${player.first_name} ${player.last_name}`}
          size="xl"
        />
        <div>
          <h1 className="text-2xl font-bold text-white">
            {player.first_name} {player.last_name}
          </h1>
          <p className="text-gray-400 text-sm">
            {player.position} · {player.team_name ?? 'Free Agent'}
            {player.jersey_number && ` · #${player.jersey_number}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stats + Chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current season stats */}
          {latestStats && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                {latestStats.season_year} Season
                {!isCurrentSeason && (
                  <span className="text-xs text-yellow-500 normal-case font-normal">
                    most recent available
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: 'PTS', value: latestStats.points?.toFixed(1) },
                  { label: 'REB', value: latestStats.rebounds?.toFixed(1) },
                  { label: 'AST', value: latestStats.assists?.toFixed(1) },
                  { label: 'GP', value: latestStats.games_played },
                  { label: 'FG%', value: latestStats.fg_pct ? `${(latestStats.fg_pct * 100).toFixed(1)}%` : '—' },
                  { label: '3P%', value: latestStats.three_pct ? `${(latestStats.three_pct * 100).toFixed(1)}%` : '—' },
                  { label: 'TS%', value: latestStats.true_shooting_pct ? `${(latestStats.true_shooting_pct * 100).toFixed(1)}%` : '—' },
                  { label: 'USG%', value: latestStats.usage_rate ? `${latestStats.usage_rate.toFixed(1)}%` : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-lg font-bold text-white">{value ?? '—'}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend chart */}
          {chartData && chartData.length > 1 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Trend</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <XAxis dataKey="season" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 6 }} />
                  <Line type="monotone" dataKey="pts" stroke="#3B82F6" dot={false} name="PTS" />
                  <Line type="monotone" dataKey="reb" stroke="#10B981" dot={false} name="REB" />
                  <Line type="monotone" dataKey="ast" stroke="#F59E0B" dot={false} name="AST" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Metrics + Contract */}
        <div className="space-y-4">
          {/* Percentile bars */}
          {metrics && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Role Scores
                {metrics.data_completeness !== 'full' && (
                  <span className="ml-2 text-xs text-yellow-500 normal-case font-normal">
                    {metrics.data_completeness === 'partial' ? 'Limited data' : 'Estimated'}
                  </span>
                )}
              </h2>
              <div className="space-y-3">
                {METRIC_LABELS.map(({ key, label }) => (
                  key !== 'data_completeness' && (
                    <PercentileBar
                      key={key}
                      label={label}
                      value={metrics[key] as number}
                      completeness={metrics.data_completeness}
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {/* Contract */}
          {contract && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Contract</h2>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">This year</span>
                  <span className="text-white">{formatSalary(contract.current_year_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Years left</span>
                  <span className="text-white">{contract.years_remaining}</span>
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {contract.is_max && <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">Max</span>}
                  {contract.is_rookie_scale && <span className="text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded">Rookie</span>}
                  {contract.is_two_way && <span className="text-xs bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded">Two-Way</span>}
                  {contract.has_player_option && <span className="text-xs bg-yellow-900 text-yellow-300 px-1.5 py-0.5 rounded">Player Opt</span>}
                  {contract.has_team_option && <span className="text-xs bg-orange-900 text-orange-300 px-1.5 py-0.5 rounded">Team Opt</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
