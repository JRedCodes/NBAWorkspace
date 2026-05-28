import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarousel } from '../../hooks/useTeams'
import { TeamCarousel } from '../../components/league/TeamCarousel'
import { TeamLogoGrid } from '../../components/league/TeamLogoGrid'

export default function LeagueView() {
  const navigate = useNavigate()
  const { data: teams = [], isLoading } = useCarousel()
  const [activeIndex, setActiveIndex] = useState(0)

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">League</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl h-72 animate-pulse" />
          <div className="bg-gray-800 rounded-xl h-72 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!teams.length) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">League</h1>
        <div className="text-center py-16 text-gray-500">
          <p>No team data yet.</p>
          <p className="text-sm mt-1">Run the roster ingestion worker to populate teams.</p>
        </div>
      </div>
    )
  }

  const activeTeam = teams[activeIndex]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">League</h1>
        <button
          onClick={() => navigate(`/league/team/${activeTeam?.id}`)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Open {activeTeam?.name} →
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carousel */}
        <TeamCarousel
          teams={teams}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
        />

        {/* Logo quick-nav */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            All Teams
          </h2>
          <TeamLogoGrid
            teams={teams}
            activeId={activeTeam?.id ?? null}
            onSelect={setActiveIndex}
          />
        </div>
      </div>
    </div>
  )
}
