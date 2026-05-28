import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CarouselTeam } from '../../types'

interface Props {
  teams: CarouselTeam[]
  activeIndex: number
  onIndexChange: (i: number) => void
}

const POSITION_ORDER = ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'G-F', 'F-C', '']

function sortByPosition(players: { name: string; position: string }[]) {
  return [...players].sort(
    (a, b) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position),
  )
}

function RankBadge({ rank, prev }: { rank: number | null; prev: number | null }) {
  if (!rank) return null
  const delta = prev != null ? prev - rank : null
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-4xl font-black text-white">#{rank}</span>
      {delta !== null && delta !== 0 && (
        <span className={`text-sm font-semibold ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
        </span>
      )}
    </div>
  )
}

export function TeamCarousel({ teams, activeIndex, onIndexChange }: Props) {
  const navigate = useNavigate()
  const [isPlaying, setIsPlaying] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const advance = useCallback(() => {
    onIndexChange((activeIndex + 1) % teams.length)
  }, [activeIndex, teams.length, onIndexChange])

  const prev = () => {
    onIndexChange((activeIndex - 1 + teams.length) % teams.length)
  }

  useEffect(() => {
    if (isPlaying && teams.length > 0) {
      intervalRef.current = setInterval(advance, 5000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, advance, teams.length])

  if (!teams.length) return null

  const team = teams[activeIndex]
  const sorted = sortByPosition(team.top_players ?? [])
  const record = team.wins != null ? `${team.wins}–${team.losses}` : '—'

  return (
    <div
      className="relative bg-gray-800 border border-gray-700 rounded-xl overflow-hidden"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Background conference tint */}
      <div
        className={`absolute inset-0 opacity-5 ${team.conference === 'East' ? 'bg-blue-400' : 'bg-orange-400'}`}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">{team.city}</p>
            <button
              onClick={() => navigate(`/league/team/${team.id}`)}
              className="text-2xl font-bold text-white hover:text-blue-400 transition-colors text-left"
            >
              {team.name}
            </button>
            <p className="text-sm text-gray-400 mt-0.5">
              {team.conference} · {team.division} · {record}
            </p>
          </div>
          <RankBadge rank={team.power_rank} prev={team.previous_rank} />
        </div>

        {/* Starting 5 */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Projected Starting 5
          </p>
          {sorted.length > 0 ? (
            <div className="space-y-1.5">
              {sorted.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500 w-8 shrink-0">
                    {p.position || '—'}
                  </span>
                  <span className="text-sm text-gray-200">{p.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No lineup data yet</p>
          )}
        </div>

        {/* Coach + ratings */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-500">Head Coach</p>
            <p className="text-sm text-gray-300">{team.head_coach ?? '—'}</p>
          </div>
          {team.offensive_rating != null && (
            <div className="flex gap-4 text-right">
              <div>
                <p className="text-xs text-gray-500">OffRtg</p>
                <p className="text-sm font-medium text-gray-200">
                  {team.offensive_rating.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">DefRtg</p>
                <p className="text-sm font-medium text-gray-200">
                  {team.defensive_rating?.toFixed(1) ?? '—'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900/50 border-t border-gray-700">
        <button
          onClick={prev}
          className="text-gray-500 hover:text-white transition-colors text-lg font-bold"
        >
          ‹
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1 overflow-hidden max-w-xs">
          {teams.map((_, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={`h-1 rounded-full transition-all ${
                i === activeIndex ? 'w-4 bg-blue-400' : 'w-1 bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={advance}
          className="text-gray-500 hover:text-white transition-colors text-lg font-bold"
        >
          ›
        </button>
      </div>

      {/* Play/pause */}
      <button
        onClick={() => setIsPlaying((p) => !p)}
        className="absolute top-4 right-16 text-xs text-gray-600 hover:text-gray-400 transition-colors"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  )
}
