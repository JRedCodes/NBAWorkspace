import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import type { TeamNeeds } from '../../types'

interface Props {
  needs: TeamNeeds
  projectedNeeds?: TeamNeeds | null
}

const LABELS: Record<keyof TeamNeeds, string> = {
  threePoint: '3PT',
  rimProtection: 'Rim',
  playmaking: 'Play',
  slashing: 'Slash',
  rebounding: 'Reb',
  poaDefense: 'POA D',
  leadership: 'Leader',
}

const KEYS = Object.keys(LABELS) as (keyof TeamNeeds)[]

function SingleRadar({ data, color, opacity = 0.25 }: {
  data: { category: string; value: number }[]
  color: string
  opacity?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <PolarGrid stroke="#2d3748" />
        <PolarAngleAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
        <Radar dataKey="value" stroke={color} fill={color} fillOpacity={opacity} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function NeedsRadar({ needs, projectedNeeds }: Props) {
  const hasProjection = !!projectedNeeds

  const currentData = KEYS.map((key) => ({ category: LABELS[key], value: needs[key] }))
  const projectedData = projectedNeeds
    ? KEYS.map((key) => ({ category: LABELS[key], value: projectedNeeds[key] }))
    : null

  return (
    <div className="space-y-3">
      {hasProjection ? (
        /* Two side-by-side charts when trade is active */
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 text-center mb-1">Current Roster</p>
            <SingleRadar data={currentData} color="#3b82f6" />
          </div>
          <div>
            <p className="text-xs text-orange-400 text-center mb-1">After Trade</p>
            <SingleRadar data={projectedData!} color="#f97316" />
          </div>
        </div>
      ) : (
        /* Single chart when no trade */
        <SingleRadar data={currentData} color="#3b82f6" />
      )}

      {/* Delta table */}
      {hasProjection && projectedNeeds && (
        <div className="space-y-1.5 border-t border-gray-700/60 pt-3">
          <p className="text-xs text-gray-500 mb-1">Needs change after trade</p>
          {KEYS.map((key) => {
            const delta = Math.round(projectedNeeds[key] - needs[key])
            if (Math.abs(delta) < 1) return null
            return (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{LABELS[key]}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{needs[key]}</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-orange-400">{projectedNeeds[key]}</span>
                  <span className={delta > 0 ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>
                    {delta > 0 ? `+${delta}` : `${delta}`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
