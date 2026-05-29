import { useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'

interface Props {
  teamId: string
}

export function DraftProjectionBanner({ teamId }: Props) {
  const navigate = useNavigate()
  const draftAssignments = useWorkspaceStore((s) => s.draftAssignments)

  const teamPicks = draftAssignments.filter((a) => a.teamId === teamId)
  if (teamPicks.length === 0) return null

  const r1Picks = teamPicks.filter((a) => a.round === 1)
  const r2Picks = teamPicks.filter((a) => a.round === 2)

  return (
    <div className="bg-green-950/40 border border-green-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-700 text-white">
            DRAFT PROJECTED
          </span>
          <span className="text-sm text-gray-300">
            {teamPicks.length} pick{teamPicks.length !== 1 ? 's' : ''} assigned in simulation
          </span>
        </div>
        <button
          onClick={() => navigate('/draft')}
          className="text-xs text-green-400 hover:text-green-300 transition-colors"
        >
          Edit draft →
        </button>
      </div>

      <div className="space-y-2">
        {r1Picks.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Round 1</p>
            {r1Picks
              .sort((a, b) => a.pickNumber - b.pickNumber)
              .map((a) => (
                <div key={a.pickId} className="flex items-center gap-2 py-1">
                  <span className="text-xs font-mono text-green-500 w-5 text-right">#{a.pickNumber}</span>
                  <span className="text-sm text-white">{a.prospectName}</span>
                  <span className="text-xs text-gray-500">{a.position} · {a.school}</span>
                </div>
              ))}
          </div>
        )}
        {r2Picks.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Round 2</p>
            {r2Picks
              .sort((a, b) => a.pickNumber - b.pickNumber)
              .map((a) => (
                <div key={a.pickId} className="flex items-center gap-2 py-1">
                  <span className="text-xs font-mono text-green-600 w-5 text-right">#{a.pickNumber}</span>
                  <span className="text-sm text-gray-300">{a.prospectName}</span>
                  <span className="text-xs text-gray-500">{a.position} · {a.school}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
