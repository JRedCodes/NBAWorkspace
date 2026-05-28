import { formatSalary } from '../../utils/format'

interface TeamSummary {
  teamId: string
  salaryOut: number
  salaryIn: number
  netChange: number
  isOverCap: boolean
  matchingRequired: boolean
  matchingMax: number
  matchingOk: boolean
}

interface Props {
  summary: TeamSummary
  teamName: string
}

export function SalaryMeter({ summary, teamName }: Props) {
  const { salaryOut, salaryIn, netChange, matchingRequired, matchingMax, matchingOk } = summary

  const pctUsed = matchingMax > 0 && matchingMax !== Infinity
    ? Math.min(100, (salaryIn / matchingMax) * 100)
    : 0

  const barColor = !matchingOk ? 'bg-red-500' : pctUsed > 85 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="bg-gray-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{teamName}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
          !matchingOk ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
        }`}>
          {!matchingOk ? 'MISMATCH' : 'OK'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="text-gray-500">Sending</p>
          <p className="text-white font-medium">{formatSalary(salaryOut)}</p>
        </div>
        <div>
          <p className="text-gray-500">Receiving</p>
          <p className={`font-medium ${!matchingOk ? 'text-red-400' : 'text-white'}`}>
            {formatSalary(salaryIn)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Net</p>
          <p className={`font-medium ${netChange > 0 ? 'text-red-400' : netChange < 0 ? 'text-green-400' : 'text-gray-400'}`}>
            {netChange > 0 ? '+' : ''}{formatSalary(netChange)}
          </p>
        </div>
      </div>

      {matchingRequired && matchingMax !== Infinity && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Matching limit</span>
            <span>{formatSalary(matchingMax)}</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pctUsed}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
