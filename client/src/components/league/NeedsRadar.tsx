import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
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

export function NeedsRadar({ needs, projectedNeeds }: Props) {
  const hasProjection = !!projectedNeeds

  const data = KEYS.map((key) => ({
    category: LABELS[key],
    current: needs[key],
    projected: projectedNeeds?.[key] ?? needs[key],
  }))

  return (
    <div className="space-y-3">
      {hasProjection && (
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-blue-400" />
            Current roster
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-orange-400 opacity-80" style={{ borderTop: '2px dashed #f97316' }} />
            After trade
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={230}>
        <RadarChart data={data}>
          <PolarGrid stroke="#2d3748" />
          <PolarAngleAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }}
            formatter={(val, name) => [Math.round(Number(val ?? 0)), name === 'current' ? 'Current' : 'After trade'] as [number, string]}
          />
          <Radar name="current" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={hasProjection ? 0.12 : 0.28} strokeWidth={hasProjection ? 1.5 : 2} />
          {hasProjection && (
            <Radar name="projected" dataKey="projected" stroke="#f97316" fill="#f97316" fillOpacity={0.18} strokeWidth={2} strokeDasharray="5 3" />
          )}
        </RadarChart>
      </ResponsiveContainer>

      {hasProjection && projectedNeeds && (
        <div className="space-y-1 border-t border-gray-700/60 pt-2.5">
          <p className="text-xs text-gray-500 mb-1.5">Need changes after trade</p>
          {KEYS.map((key) => {
            const delta = Math.round(projectedNeeds[key] - needs[key])
            if (Math.abs(delta) < 1) return null
            return (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{LABELS[key]}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{needs[key]}</span>
                  <span className="text-gray-600 text-xs">→</span>
                  <span className="text-orange-400">{projectedNeeds[key]}</span>
                  <span className={`font-medium ${delta > 0 ? 'text-red-400' : 'text-green-400'}`}>
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
