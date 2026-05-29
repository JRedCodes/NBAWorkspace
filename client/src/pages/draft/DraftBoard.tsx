import { useState } from 'react'
import { useProspects, useDraftOrder } from '../../hooks/useDraft'
import { useAllTeams } from '../../hooks/useTeams'
import type { Prospect } from '../../components/draft/ProspectCard'

interface DraftPick {
  pick_id: string
  pick_number: number
  round: number
  draft_year: number
  team_id: string
  team_name: string
  abbreviation: string
  city: string
  logo_url: string | null
  original_team_abbr: string
  conveyance_notes: string | null
}

function TeamLogo({ logo_url, abbreviation, size = 24 }: { logo_url: string | null; abbreviation: string; size?: number }) {
  const [err, setErr] = useState(false)
  if (logo_url && !err) {
    return <img src={logo_url} alt={abbreviation} width={size} height={size} className="object-contain shrink-0" onError={() => setErr(true)} />
  }
  return <span className="text-xs font-bold text-gray-400 shrink-0" style={{ width: size, textAlign: 'center' }}>{abbreviation}</span>
}

function RoundHeader({ round }: { round: number }) {
  return (
    <div className="flex items-center gap-2 py-2 mt-2 mb-1">
      <div className="flex-1 h-px bg-gray-700" />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">Round {round}</span>
      <div className="flex-1 h-px bg-gray-700" />
    </div>
  )
}

export default function DraftBoard() {
  const { data: draftOrder = [] } = useDraftOrder()
  const { data: allProspects = [] } = useProspects({ draftYear: '2026' })
  const { data: allTeams = [] } = useAllTeams()

  const [assignments, setAssignments] = useState<Record<string, Prospect>>({})
  const [myTeamId, setMyTeamId] = useState<string>('')
  const [posFilter, setPosFilter] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [selectedPick, setSelectedPick] = useState<DraftPick | null>(null)

  const picks = draftOrder as DraftPick[]
  const assignedIds = new Set(Object.values(assignments).map((p) => p.id))

  const availableProspects = [...(allProspects as Prospect[])]
    .sort((a, b) => (a.projected_pick ?? 999) - (b.projected_pick ?? 999))
    .filter((p) => !assignedIds.has(p.id))
    .filter((p) => !posFilter || p.position === posFilter)
    .filter((p) => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()))

  const positions = [...new Set((allProspects as Prospect[]).map((p) => p.position).filter(Boolean))].sort()

  function assign(pick: DraftPick, prospect: Prospect) {
    setAssignments((prev) => ({ ...prev, [pick.pick_id]: prospect }))
    setSelectedPick(null)
  }

  function unassign(pickId: string) {
    setAssignments((prev) => { const next = { ...prev }; delete next[pickId]; return next })
  }

  function handlePickClick(pick: DraftPick) {
    if (assignments[pick.pick_id]) {
      unassign(pick.pick_id)
    } else {
      setSelectedPick((p) => p?.pick_id === pick.pick_id ? null : pick)
    }
  }

  const r1 = picks.filter((p) => p.round === 1)
  const r2 = picks.filter((p) => p.round === 2)
  const myPicks = picks.filter((p) => p.team_id === myTeamId)

  function PickRow({ pick, dim }: { pick: DraftPick; dim?: boolean }) {
    const assigned = assignments[pick.pick_id]
    const isMyPick = pick.team_id === myTeamId
    const isSelected = selectedPick?.pick_id === pick.pick_id
    const isTraded = pick.abbreviation !== pick.original_team_abbr
    return (
      <button
        onClick={() => handlePickClick(pick)}
        className={'w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors ' + (dim ? 'opacity-70 ' : '') + (isSelected ? 'bg-blue-700 border border-blue-500' : isMyPick ? 'bg-blue-950/50 border border-blue-800 hover:border-blue-600' : assigned ? 'bg-gray-800/60 border border-gray-700' : 'border border-transparent hover:bg-gray-800')}
      >
        <span className="text-xs font-mono text-gray-500 w-5 text-right shrink-0">{pick.pick_number}</span>
        <TeamLogo logo_url={pick.logo_url} abbreviation={pick.abbreviation} size={18} />
        <div className="flex-1 min-w-0">
          {assigned ? (
            <>
              <p className="text-xs text-white truncate">{assigned.name}</p>
              <p className="text-xs text-gray-500">{assigned.position} · {assigned.school}</p>
            </>
          ) : (
            <>
              <p className={'text-xs ' + (isSelected ? 'text-blue-200' : 'text-gray-300')}>
                {isSelected ? 'Select prospect →' : pick.abbreviation}
              </p>
              {isTraded && !assigned && (
                <p className="text-xs text-yellow-600 truncate">{pick.conveyance_notes}</p>
              )}
            </>
          )}
        </div>
        {assigned && <span className="text-xs text-gray-600 hover:text-red-400 shrink-0">×</span>}
      </button>
    )
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Pick board */}
      <div className="w-72 flex-shrink-0 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">2026 Draft</h1>
            <span className="text-xs text-gray-500">{Object.keys(assignments).length}/60 picked</span>
          </div>
          <select value={myTeamId} onChange={(e) => setMyTeamId(e.target.value)}
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none">
            <option value="">— select your team —</option>
            {(allTeams as { id: string; city: string; name: string }[]).map((t) => (
              <option key={t.id} value={t.id}>{t.city} {t.name}</option>
            ))}
          </select>
          {Object.keys(assignments).length > 0 && (
            <button onClick={() => setAssignments({})} className="text-xs text-red-400 hover:text-red-300">Reset simulation</button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <RoundHeader round={1} />
          {r1.map((pick) => <PickRow key={pick.pick_id} pick={pick} />)}
          <RoundHeader round={2} />
          {r2.map((pick) => <PickRow key={pick.pick_id} pick={pick} dim />)}
        </div>
      </div>

      {/* Available prospects */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {selectedPick ? <>Assigning <span className="text-blue-400">Pick #{selectedPick.pick_number}</span> · {selectedPick.abbreviation}</> : 'Available Prospects'}
              <span className="ml-2 text-xs text-gray-500 font-normal">{availableProspects.length} remaining</span>
            </h2>
            {selectedPick && <button onClick={() => setSelectedPick(null)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>}
          </div>
          <input type="text" placeholder="Search prospects..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
            className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          <div className="flex gap-1 flex-wrap">
            {['',...positions].map((pos) => (
              <button key={pos||'all'} onClick={() => setPosFilter(pos)}
                className={'px-2 py-0.5 text-xs rounded ' + (posFilter===pos ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}>
                {pos || 'All'}
              </button>
            ))}
          </div>
          {!selectedPick && <p className="text-xs text-gray-600">Click a pick slot on the left, then select a prospect here</p>}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {availableProspects.map((p) => (
            <button key={p.id} onClick={() => selectedPick && assign(selectedPick, p)}
              className={'w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ' + (selectedPick ? 'hover:bg-blue-700 border border-transparent hover:border-blue-500 cursor-pointer' : 'border border-transparent cursor-default hover:bg-gray-800/50') + ((p.projected_pick ?? 999) > 60 ? ' opacity-50' : '')}>
              <span className="text-xs font-mono text-gray-500 w-5 text-right shrink-0">{p.projected_pick}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{p.position} · {p.school}</p>
              </div>
              {selectedPick && <span className="text-xs text-blue-400 shrink-0">+ Pick</span>}
            </button>
          ))}
        </div>
      </div>

      {/* My picks summary */}
      {myTeamId && myPicks.length > 0 && (
        <div className="w-52 flex-shrink-0 border-l border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Picks</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {myPicks.map((pick) => {
              const assigned = assignments[pick.pick_id]
              return (
                <div key={pick.pick_id} className="space-y-0.5">
                  <p className="text-xs text-gray-500">R{pick.round} #{pick.pick_number}</p>
                  {assigned ? (
                    <div onClick={() => unassign(pick.pick_id)} className="bg-blue-900/40 border border-blue-800 rounded p-2 cursor-pointer hover:border-red-500 transition-colors">
                      <p className="text-sm text-white truncate">{assigned.name}</p>
                      <p className="text-xs text-gray-400">{assigned.position} · {assigned.school}</p>
                    </div>
                  ) : (
                    <button onClick={() => setSelectedPick(pick)}
                      className="w-full bg-gray-800 border border-gray-700 border-dashed rounded p-2 text-xs text-gray-600 hover:text-blue-400 hover:border-blue-700 transition-colors text-left">
                      + Select prospect
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
