import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllTeams, useCarousel } from '../../hooks/useTeams'
import { TeamCard } from '../../components/league/TeamCard'

export default function LeagueView() {
  const navigate = useNavigate()
  const { data: teams, isLoading: teamsLoading } = useAllTeams()
  const { data: carousel } = useCarousel()
  const [conference, setConference] = useState<'All' | 'East' | 'West'>('All')

  const displayTeams = carousel ?? []
  const filtered = conference === 'All'
    ? displayTeams
    : displayTeams.filter((t) => t.conference === conference)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">League</h1>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['All', 'East', 'West'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setConference(c)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                conference === c ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {teamsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {filtered.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}

      {!teamsLoading && displayTeams.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p>No team data yet.</p>
          <p className="text-sm mt-1">Run the roster ingestion worker to populate teams.</p>
        </div>
      )}
    </div>
  )
}
