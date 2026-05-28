import { useNavigate } from 'react-router-dom'
import { formatSalary } from '../../utils/format'
import { PlayerAvatar } from '../ui/PlayerAvatar'

interface PlayerMove {
  playerId: string
  name: string
  salary: number
}

interface Props {
  playersOut: PlayerMove[]
  playersIn: PlayerMove[]
  projectedPayroll: number
  netChange: number
  isValid: boolean
  violations: { message: string }[]
}

export function TradeProjectionBanner({
  playersOut,
  playersIn,
  projectedPayroll,
  netChange,
  isValid,
  violations,
}: Props) {
  const navigate = useNavigate()

  return (
    <div className={`rounded-lg border p-4 mb-4 ${
      isValid
        ? 'bg-blue-950/50 border-blue-700'
        : 'bg-yellow-950/50 border-yellow-700'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
            isValid ? 'bg-blue-700 text-white' : 'bg-yellow-700 text-white'
          }`}>
            PROJECTED
          </span>
          <span className="text-sm text-gray-300">
            Viewing projected state based on active trade
          </span>
        </div>
        <button
          onClick={() => navigate('/trade/machine')}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Edit trade →
        </button>
      </div>

      {/* Player movements */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {playersOut.length > 0 && (
          <div>
            <p className="text-xs text-red-400 font-medium mb-1.5">Outgoing</p>
            <div className="space-y-1.5">
              {playersOut.map((p) => (
                <div key={p.playerId} className="flex items-center gap-2">
                  <PlayerAvatar nbaPlayerId={undefined} name={p.name} size="xs" />
                  <span className="text-xs text-gray-300 truncate flex-1">{p.name}</span>
                  <span className="text-xs text-gray-500">{formatSalary(p.salary)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {playersIn.length > 0 && (
          <div>
            <p className="text-xs text-green-400 font-medium mb-1.5">Incoming</p>
            <div className="space-y-1.5">
              {playersIn.map((p) => (
                <div key={p.playerId} className="flex items-center gap-2">
                  <PlayerAvatar nbaPlayerId={undefined} name={p.name} size="xs" />
                  <span className="text-xs text-gray-300 truncate flex-1">{p.name}</span>
                  <span className="text-xs text-gray-500">{formatSalary(p.salary)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payroll impact */}
      <div className="flex items-center justify-between pt-2.5 border-t border-gray-700 text-xs">
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

      {/* CBA violations */}
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
