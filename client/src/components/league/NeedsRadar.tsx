import { useState } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from 'recharts'
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

export function NeedsRadar({ needs, projectedNeeds }: Props) {
  const [showProjected, setShowProjected] = useState(false)

  const data = (Object.keys(needs) as (keyof TeamNeeds)[]).map((key) => ({
    category: LABELS[key],
    current: needs[key],
    projected: projectedNeeds?.[key] ?? needs[key],
  }))

  const hasProjection = !!projectedNeeds

  return (
    <div className="space-y-2">
      {hasProjection && (
        <div className="flex gap-1">
          <button
            onClick={() => setShowProjected(false)}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              !showProjected ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setShowProjected(true)}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              showProjected ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            After Trade
          </button>
        </div>
      )}

      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} />

          {/* Always show current */}
          <Radar
            dataKey="current"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={hasProjection && showProjected ? 0.1 : 0.25}
            name="Current"
          />

          {/* Show projected overlay when toggled */}
          {hasProjection && showProjected && (
            <Radar
              dataKey="projected"
              stroke="#F97316"
              fill="#F97316"
              fillOpacity={0.25}
              name="After Trade"
            />
          )}

          {hasProjection && showProjected && (
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => (
                <span style={{ color: value === 'Current' ? '#3B82F6' : '#F97316' }}>{value}</span>
              )}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>

      {/* Delta table when in projected mode */}
      {hasProjection && showProjected && projectedNeeds && (
        <div className="space-y-1 mt-1">
          {(Object.keys(needs) as (keyof TeamNeeds)[]).map((key) => {
            const delta = projectedNeeds[key] - needs[key]
            if (Math.abs(delta) < 0.5) return null
            return (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{LABELS[key]}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{needs[key]}</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-orange-400">{projectedNeeds[key]}</span>
                  <span className={delta > 0 ? 'text-red-400' : 'text-green-400'}>
                    {delta > 0 ? `+${Math.round(delta)}` : Math.round(delta)}
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
