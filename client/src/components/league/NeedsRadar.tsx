import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import type { TeamNeeds } from '../../types'

interface Props {
  needs: TeamNeeds
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

export function NeedsRadar({ needs }: Props) {
  const data = (Object.keys(needs) as (keyof TeamNeeds)[]).map((key) => ({
    category: LABELS[key],
    value: needs[key],
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
        <Radar
          dataKey="value"
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.25}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
