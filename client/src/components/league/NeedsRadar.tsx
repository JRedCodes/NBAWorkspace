import { useState } from 'react'
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

type View = 'current' | 'projected' | 'comparison'

function SingleChart({
  data, color, height = 260, marginLeft = 38,
}: {
  data: { category: string; value: number }[]
  color: string
  height?: number
  marginLeft?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 20, right: 24, bottom: 20, left: marginLeft }}>
        <PolarGrid stroke="#2d3748" />
        <PolarAngleAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
        <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.28} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function NeedsRadar({ needs, projectedNeeds }: Props) {
  const hasProjection = !!projectedNeeds
  const [view, setView] = useState<View>('current')

  const currentData = KEYS.map((key) => ({ category: LABELS[key], value: needs[key] }))
  const projectedData = projectedNeeds
    ? KEYS.map((key) => ({ category: LABELS[key], value: projectedNeeds[key] }))
    : []

  const tabs: { id: View; label: string }[] = [
    { id: 'current', label: 'Current Roster' },
    ...(hasProjection ? [
      { id: 'projected' as View, label: 'After Trade' },
      { id: 'comparison' as View, label: 'Comparison' },
    ] : []),
  ]

  return (
    <div className="space-y-3">
      {/* Tab bar — only visible when trade is active */}
      {hasProjection && (
        <div className="flex gap-1 bg-gray-900/60 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={'flex-1 py-1 text-xs rounded transition-colors font-medium ' + (
                view === tab.id
                  ? tab.id === 'projected'
                    ? 'bg-orange-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart area */}
      {view === 'current' && (
        <SingleChart data={currentData} color="#3b82f6" />
      )}

      {view === 'projected' && hasProjection && (
        <SingleChart data={projectedData} color="#f97316" />
      )}

      {view === 'comparison' && hasProjection && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-500 text-center mb-1">Current</p>
            <SingleChart data={currentData} color="#3b82f6" height={200} marginLeft={38} />
          </div>
          <div>
            <p className="text-xs text-orange-400 text-center mb-1">After Trade</p>
            <SingleChart data={projectedData} color="#f97316" height={200} marginLeft={38} />
          </div>
        </div>
      )}

      {/* Delta table — shown in projected and comparison views */}
      {hasProjection && projectedNeeds && view !== 'current' && (
        <div className="space-y-1.5 border-t border-gray-700/60 pt-3">
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
