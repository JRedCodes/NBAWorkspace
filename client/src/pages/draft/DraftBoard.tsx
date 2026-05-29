import { useState, useRef } from 'react'
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
  return <span className="text-xs font-bold text-gray-400 shrink-0" style={{ width: size, textAlign: 'center' as const }}>{abbreviation}</span>
}

function RoundHeader({ round, jumpRef }: { round: number; jumpRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={jumpRef} className="flex items-center gap-2 py-2 mt-2 mb-1">
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
  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set())
  const [posFilter, setPosFilter] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [selectedPick, setSelectedPick] = useState<DraftPick | null>(null)
  const [simulating, setSimulating] = useState(false)
  const picksContainerRef = useRef<HTMLDivElement>(null)
  const r2Ref = useRef<HTMLDivElement>(null)

  const picks = draftOrder as DraftPick[]
  const assignedIds = new Set(Object.values(assignments).map((p) => p.id))

  const availableProspects = [...(allProspects as Prospect[])]
    .sort((a, b) => (a.projected_pick ?? 999) - (b.projected_pick ?? 999))
    .filter((p) => !assignedIds.has(p.id))
    .filter((p) => !posFilter || p.position === posFilter)
    .filter((p) => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()))

  const allAvailable = [...(allProspects as Prospect[])]
    .sort((a, b) => (a.projected_pick ?? 999) - (b.projected_pick ?? 999))
    .filter((p) => !assignedIds.has(p.id))

  const positions = [...new Set((allProspects as Prospect[]).map((p) => p.position).filter(Boolean))].sort()
  const r1 = picks.filter((p) => p.round === 1)
  const r2 = picks.filter((p) => p.round === 2)

  const myTeamPicks = picks.filter((p) => myTeamIds.has(p.team_id))

  function toggleMyTeam(teamId: string) {
    setMyTeamIds((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }

  function handlePickClick(pick: DraftPick) {
    if (assignments[pick.pick_id]) {
      unassign(pick.pick_id)
    } else {
      setSelectedPick((p) => p?.pick_id === pick.pick_id ? null : pick)
    }
  }

  function assign(pick: DraftPick, prospect: Prospect) {
    setAssignments((prev) => ({ ...prev, [pick.pick_id]: prospect }))
    setSelectedPick(null)
  }

  function unassign(pickId: string) {
    setAssignments((prev) => { const next = { ...prev }; delete next[pickId]; return next })
  }

  async function simulateRest() {
    setSimulating(true)
    const orderedPicks = [...picks].sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round
      return a.pick_number - b.pick_number
    })
    const newAssignments = { ...assignments }
    const usedIds = new Set(Object.values(newAssignments).map((p) => p.id))
    const available = [...(allProspects as Prospect[])]
      .sort((a, b) => (a.projected_pick ?? 999) - (b.projected_pick ?? 999))
      .filter((p) => !usedIds.has(p.id))

    let idx = 0
    for (const pick of orderedPicks) {
      if (newAssignments[pick.pick_id]) continue
      if (myTeamIds.has(pick.team_id)) continue
      if (idx >= available.length) break
      newAssignments[pick.pick_id] = available[idx]
      usedIds.add(available[idx].id)
      idx++
    }
    setAssignments(newAssignments)
    setSimulating(false)
  }

  function PickRow({ pick, dim }: { pick: DraftPick; dim?: boolean }) {
    const assigned = assignments[pick.pick_id]
    const isMyPick = myTeamIds.has(pick.team_id)
    const isSelected = selectedPick?.pick_id === pick.pick_id
    const isTraded = pick.abbreviation !== pick.original_team_abbr
    return (
      <button
        onClick={() => handlePickClick(pick)}
        className={'w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-all ' + (dim ? 'opacity-75 ' : '') + (isSelected ? 'bg-blue-700 border border-blue-500' : isMyPick ? 'bg-blue-950/60 border border-blue-700 hover:border-blue-500' : assigned ? 'bg-gray-800/60 border border-gray-700' : 'border border-transparent hover:bg-gray-800')}
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
              <p className={'text-xs ' + (isSelected ? 'text-blue-200' : 'text-gray-300')}>{isSelected ? 'Select prospect →' : pick.abbreviation}</p>
              {isTraded && <p className="text-xs text-yellow-600 truncate leading-tight">{pick.conveyance_notes}</p>}
            </>
          )}
        </div>
        {assigned && <span className="text-xs text-gray-600 hover:text-red-400 shrink-0 ml-auto">×</span>}
      </button>
    )
  }

  const pickedCount = Object.keys(assignments).length
  const myUnpicked = myTeamPicks.filter((p) => !assignments[p.pick_id])

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Pick board */}
      <div className="w-72 flex-shrink-0 border-r border-gray-800 flex flex-col">
        <div className="p-3 border-b border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-white">2026 Draft</h1>
            <span className="text-xs text-gray-500">{pickedCount}/60</span>
          </div>

          {/* My teams multi-select */}
          <div>
            <p className="text-xs text-gray-500 mb-1">My teams (click to toggle)</p>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {(allTeams as { id: string; abbreviation: string; logo_url?: string }[]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleMyTeam(t.id)}
                  className={'px-1.5 py-0.5 text-xs rounded transition-colors ' + (myTeamIds.has(t.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white')}
                >
                  {t.abbreviation}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1">
            {myUnpicked.length > 0 && !selectedPick && (
              <button
                onClick={() => setSelectedPick(myUnpicked[0])}
                className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              >
                Pick #{myUnpicked[0].pick_number} ({myUnpicked[0].abbreviation}) →
              </button>
            )}
            {pickedCount < 60 && (
              <button
                onClick={simulateRest}
                disabled={simulating}
                className="flex-1 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs rounded transition-colors"
              >
                {simulating ? 'Simulating…' : 'Simulate rest'}
              </button>
            )}
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => {
                const container = picksContainerRef.current
                const r2 = r2Ref.current
                if (container && r2) {
                  container.scrollTop = r2.offsetTop - container.offsetTop
                }
              }}
              className="flex-1 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded">
              Jump to R2 ↓
            </button>
            {pickedCount > 0 && (
              <button onClick={() => setAssignments({})} className="text-xs text-red-400 hover:text-red-300 px-2">
                Reset
              </button>
            )}
          </div>
        </div>

        <div ref={picksContainerRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <RoundHeader round={1} />
          {r1.map((pick) => <PickRow key={pick.pick_id} pick={pick} />)}
          <RoundHeader round={2} jumpRef={r2Ref} />
          {r2.map((pick) => <PickRow key={pick.pick_id} pick={pick} dim />)}
          <div className="h-4" />
        </div>
      </div>

      {/* Available prospects */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {selectedPick
                ? <><span className="text-blue-400">Pick #{selectedPick.pick_number}</span> · {selectedPick.abbreviation} — select a prospect</>
                : 'Available Prospects'}
              <span className="ml-2 text-xs text-gray-500 font-normal">{availableProspects.length} remaining</span>
            </h2>
            {selectedPick && <button onClick={() => setSelectedPick(null)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>}
          </div>
          <input type="text" placeholder="Search..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
            className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          <div className="flex gap-1 flex-wrap">
            {['',...positions].map((pos) => (
              <button key={pos||'all'} onClick={() => setPosFilter(pos)}
                className={'px-2 py-0.5 text-xs rounded ' + (posFilter===pos ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}>
                {pos || 'All'}
              </button>
            ))}
          </div>
          {!selectedPick && myTeamIds.size === 0 && (
            <p className="text-xs text-gray-600">Toggle your teams above, then click a pick slot to assign</p>
          )}
          {!selectedPick && myTeamIds.size > 0 && myUnpicked.length > 0 && (
            <p className="text-xs text-blue-400">Your next pick: #{myUnpicked[0].pick_number} ({myUnpicked[0].abbreviation}) — click it on the left or use the button above</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {availableProspects.map((p) => (
            <button key={p.id} onClick={() => selectedPick && assign(selectedPick, p)}
              className={'w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ' + (selectedPick ? 'hover:bg-blue-700 border border-transparent hover:border-blue-500 cursor-pointer' : 'border border-transparent cursor-default hover:bg-gray-800/40') + ((p.projected_pick ?? 999) > 60 ? ' opacity-50' : '')}>
              <span className="text-xs font-mono text-gray-500 w-5 text-right shrink-0">{p.projected_pick}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{p.position} · {p.school}</p>
              </div>
              {selectedPick && <span className="text-xs text-blue-400 shrink-0">+ Draft</span>}
            </button>
          ))}
          {availableProspects.length === 0 && (
            <div className="text-center py-10 text-gray-600 text-sm">
              {pickedCount >= 60 ? 'Draft complete!' : 'No prospects match filters'}
            </div>
          )}
        </div>
      </div>

      {/* My picks summary */}
      {myTeamIds.size > 0 && myTeamPicks.length > 0 && (
        <div className="w-52 flex-shrink-0 border-l border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Picks</h2>
            <span className="text-xs text-gray-600">{myTeamPicks.filter(p => assignments[p.pick_id]).length}/{myTeamPicks.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {myTeamPicks
              .sort((a, b) => a.round === b.round ? a.pick_number - b.pick_number : a.round - b.round)
              .map((pick) => {
                const assigned = assignments[pick.pick_id]
                return (
                  <div key={pick.pick_id} className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <TeamLogo logo_url={pick.logo_url} abbreviation={pick.abbreviation} size={14} />
                      <p className="text-xs text-gray-500">R{pick.round} #{pick.pick_number}</p>
                    </div>
                    {assigned ? (
                      <div onClick={() => unassign(pick.pick_id)} className="bg-blue-900/40 border border-blue-800 rounded p-1.5 cursor-pointer hover:border-red-500 transition-colors">
                        <p className="text-xs text-white truncate">{assigned.name}</p>
                        <p className="text-xs text-gray-400">{assigned.position} · {assigned.school}</p>
                      </div>
                    ) : (
                      <button onClick={() => setSelectedPick(pick)}
                        className="w-full bg-gray-800 border border-gray-700 border-dashed rounded p-1.5 text-xs text-gray-600 hover:text-blue-400 hover:border-blue-700 transition-colors text-left">
                        + On the clock
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
