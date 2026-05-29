import { useNavigate } from 'react-router-dom'
import { formatSalary } from '../../utils/format'
import { PlayerAvatar } from '../ui/PlayerAvatar'

interface PlayerStats {
  ppg: number | null
  rpg: number | null
  apg: number | null
  mpg: number | null
  offRtg: number | null
  defRtg: number | null
  tsPct: number | null
}

interface PlayerMove {
  playerId: string
  name: string
  salary: number
  stats?: PlayerStats
}

interface ProjectedStats {
  offRating: number
  defRating: number
  netRating: number
  pace: number | null
  pointsDelta: number
  reboundsDelta: number
  assistsDelta: number
}

interface Props {
  playersOut: PlayerMove[]
  playersIn: PlayerMove[]
  projectedPayroll: number
  netChange: number
  isValid: boolean
  violations: { message: string }[]
  projectedStats?: ProjectedStats
  baselineStats?: { offRating: number; defRating: number; netRating: number } | null
}

function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  const isPositive = invert ? value < 0 : value > 0
  const sign = value > 0 ? '+' : ''
  const color = isPositive ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-500'
  return <span className={`text-xs font-semibold ${color}`}>{sign}{value.toFixed(1)}</span>
}

function StatRow({ label, baseline, projected, invert = false }: {
  label: string
  baseline?: number | null
  projected: number
  invert?: boolean
}) {
  const delta = baseline != null ? projected - baseline : null
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        {baseline != null && (
          <span className="text-xs text-gray-600">{baseline.toFixed(1)}</span>
        )}
        {baseline != null && <span className="text-xs text-gray-600">→</span>}
        <span className="text-xs text-white font-medium">{projected.toFixed(1)}</span>
        {delta != null && <Delta value={delta} invert={invert} />}
      </div>
    </div>
  )
}

function PlayerCard({ player, direction }: { player: PlayerMove; direction: 'out' | 'in' }) {
  const s = player.stats
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <PlayerAvatar nbaPlayerId={undefined} name={player.name} size="xs" />
        <span className="text-xs text-gray-300 truncate flex-1">{player.name}</span>
        <span className="text-xs text-gray-500">{formatSalary(player.salary)}</span>
      </div>
      {s && (s.ppg || s.mpg) ? (
        <div className="flex gap-3 ml-5 text-xs text-gray-500">
          {s.ppg != null && <span>{s.ppg.toFixed(1)} PPG</span>}
          {s.rpg != null && <span>{s.rpg.toFixed(1)} RPG</span>}
          {s.apg != null && <span>{s.apg.toFixed(1)} APG</span>}
          {s.mpg != null && <span>{s.mpg.toFixed(1)} MPG</span>}
          {s.offRtg != null && <span className={direction === 'in' ? 'text-blue-400' : ''}>{s.offRtg.toFixed(0)} ORtg</span>}
        </div>
      ) : null}
    </div>
  )
}

export function TradeProjectionBanner({
  playersOut,
  playersIn,
  projectedPayroll,
  netChange,
  isValid,
  violations,
  projectedStats,
  baselineStats,
}: Props) {
  const navigate = useNavigate()

  return (
    <div className={`rounded-lg border p-4 mb-4 ${
      isValid ? 'bg-blue-950/50 border-blue-700' : 'bg-yellow-950/50 border-yellow-700'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
            isValid ? 'bg-blue-700 text-white' : 'bg-yellow-700 text-white'
          }`}>
            PROJECTED
          </span>
          <span className="text-sm text-gray-300">Viewing projected state based on active trade</span>
        </div>
        <button onClick={() => navigate('/trade/machine')} className="text-xs text-blue-400 hover:text-blue-300">
          Edit trade →
        </button>
      </div>

      {/* Player movements with stats */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        {playersOut.length > 0 && (
          <div>
            <p className="text-xs text-red-400 font-medium mb-2">Outgoing</p>
            <div className="space-y-2">
              {playersOut.map((p) => <PlayerCard key={p.playerId} player={p} direction="out" />)}
            </div>
          </div>
        )}
        {playersIn.length > 0 && (
          <div>
            <p className="text-xs text-green-400 font-medium mb-2">Incoming</p>
            <div className="space-y-2">
              {playersIn.map((p) => <PlayerCard key={p.playerId} player={p} direction="in" />)}
            </div>
          </div>
        )}
      </div>

      {/* Projected stat impact */}
      {projectedStats && (
        <div className="border-t border-gray-700 pt-3 mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Estimated Team Impact
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <StatRow
              label="Off Rating"
              baseline={baselineStats?.offRating}
              projected={projectedStats.offRating}
            />
            <StatRow
              label="Def Rating"
              baseline={baselineStats?.defRating}
              projected={projectedStats.defRating}
              invert  // lower DefRtg = better
            />
            <StatRow
              label="Net Rating"
              baseline={baselineStats?.netRating}
              projected={projectedStats.netRating}
            />
            {projectedStats.pointsDelta !== 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Pts/G δ</span>
                <Delta value={projectedStats.pointsDelta} />
              </div>
            )}
            {projectedStats.reboundsDelta !== 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Reb/G δ</span>
                <Delta value={projectedStats.reboundsDelta} />
              </div>
            )}
            {projectedStats.assistsDelta !== 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Ast/G δ</span>
                <Delta value={projectedStats.assistsDelta} />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Weighted-minutes replacement model · Linear approximation
          </p>
        </div>
      )}

      {/* Payroll impact */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-700 text-xs">
        <span className="text-gray-400">Projected payroll</span>
        <div className="flex items-center gap-3">
          <span className="text-white font-medium">{formatSalary(projectedPayroll)}</span>
          <span className={`font-medium ${
            netChange > 0 ? 'text-red-400' : netChange < 0 ? 'text-green-400' : 'text-gray-500'
          }`}>
            {netChange > 0 ? '+' : ''}{formatSalary(netChange)}
          </span>
        </div>
      </div>

      {!isValid && violations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-yellow-800">
          {violations.map((v, i) => (
            <p key={i} className="text-xs text-yellow-400">⚠ {v.message}</p>
          ))}
        </div>
      )}
    </div>
  )
}
