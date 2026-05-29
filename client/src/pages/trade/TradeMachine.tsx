import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllTeams, useRoster, useTeamPicks } from '../../hooks/useTeams'
import { useValidateTrade, useCreateScenario } from '../../hooks/useTrade'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { TradedPick } from '../../store/workspaceStore'
import { PlayerAvatar } from '../../components/ui/PlayerAvatar'
import { SalaryMeter } from '../../components/trade/SalaryMeter'
import { formatSalary } from '../../utils/format'
import type { TeamTradeSummary } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeTeam {
  id: string
  name: string
  abbreviation: string
  city: string
  logo_url: string | null
}

interface PlayerAsset {
  type: 'player'
  id: string       // player DB id
  name: string
  salary: number
  position: string
  nba_player_id: number | null
  jersey_number: string
}

interface PickAsset {
  type: 'pick'
  id: string       // draft_picks DB id
  label: string    // e.g. "2026 R1 #5 (own)"
  pick_number: number
  round: number
  draft_year: number
  original_abbr: string
  conveyance_notes: string | null
}

type Asset = PlayerAsset | PickAsset

interface TeamSlot {
  team: TradeTeam
  sending: Asset[]   // assets this team is giving up
  // receiving is derived: all assets other teams are sending, mapped to this team
}

// ─── Team column component ────────────────────────────────────────────────────

function TeamColumn({
  slot,
  allSlots,
  onAddPlayer,
  onAddPick,
  onRemoveAsset,
  onChangeDestination,
  isMultiTeam,
}: {
  slot: TeamSlot
  allSlots: TeamSlot[]
  onAddPlayer: (teamId: string, player: PlayerAsset) => void
  onAddPick: (teamId: string, pick: PickAsset) => void
  onRemoveAsset: (teamId: string, assetId: string) => void
  onChangeDestination: (fromTeamId: string, assetId: string, toTeamId: string) => void
  isMultiTeam: boolean
}) {
  const [search, setSearch] = useState('')
  const { data: roster = [] } = useRoster(slot.team.id)
  const { data: picks = [] } = useTeamPicks(slot.team.id)
  const sendingIds = new Set(slot.sending.map((a) => a.id))

  const otherTeams = allSlots.filter((s) => s.team.id !== slot.team.id)

  // Assets this team is receiving from others
  const receiving: (Asset & { fromTeamAbbr: string })[] = []
  for (const other of otherTeams) {
    for (const asset of other.sending) {
      const dest = (asset as Asset & { toTeamId?: string }).toTeamId
      if (!isMultiTeam || dest === slot.team.id) {
        receiving.push({ ...asset, fromTeamAbbr: other.team.abbreviation })
      }
    }
  }

  const filteredRoster = (roster as Record<string, unknown>[]).filter(
    (p) =>
      !sendingIds.has(p.id as string) &&
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredPicks = (picks as Record<string, unknown>[]).filter(
    (p) => !sendingIds.has(p.id as string),
  )

  return (
    <div className="flex-1 min-w-0 flex flex-col border border-gray-700 rounded-xl overflow-hidden">
      {/* Team header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {slot.team.logo_url ? (
            <img src={slot.team.logo_url} alt={slot.team.abbreviation} className="w-7 h-7 object-contain" />
          ) : (
            <span className="text-xs font-bold text-gray-400 w-7 text-center">{slot.team.abbreviation}</span>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{slot.team.city} {slot.team.name}</p>
            <p className="text-xs text-gray-500">{slot.team.abbreviation}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Sending */}
        <div className="p-3 border-b border-gray-700/50">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
            Sending ({slot.sending.length})
          </p>
          {slot.sending.length === 0 ? (
            <p className="text-xs text-gray-600 italic">No assets selected</p>
          ) : (
            <div className="space-y-1.5">
              {slot.sending.map((asset) => (
                <div key={asset.id} className="flex items-center gap-2 bg-gray-900 rounded px-2 py-1.5">
                  {asset.type === 'player' ? (
                    <>
                      <PlayerAvatar nbaPlayerId={asset.nba_player_id} name={asset.name} size="xs" />
                      <span className="text-xs text-white flex-1 truncate">{asset.name}</span>
                      <span className="text-xs text-gray-500">{formatSalary(asset.salary)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-yellow-400">🏆</span>
                      <span className="text-xs text-white flex-1 truncate">{asset.label}</span>
                    </>
                  )}
                  {isMultiTeam && (
                    <select
                      value={(asset as Asset & { toTeamId?: string }).toTeamId ?? ''}
                      onChange={(e) => onChangeDestination(slot.team.id, asset.id, e.target.value)}
                      className="text-xs bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
                    >
                      <option value="">→ to</option>
                      {otherTeams.map((t) => (
                        <option key={t.team.id} value={t.team.id}>{t.team.abbreviation}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => onRemoveAsset(slot.team.id, asset.id)}
                    className="text-gray-600 hover:text-red-400 text-sm shrink-0"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Receiving */}
        <div className="p-3 border-b border-gray-700/50">
          <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
            Receiving ({receiving.length})
          </p>
          {receiving.length === 0 ? (
            <p className="text-xs text-gray-600 italic">Nothing incoming</p>
          ) : (
            <div className="space-y-1.5">
              {receiving.map((asset) => (
                <div key={`${asset.id}-in`} className="flex items-center gap-2 bg-gray-900/60 rounded px-2 py-1.5">
                  <span className="text-xs text-gray-500">← {asset.fromTeamAbbr}</span>
                  {asset.type === 'player' ? (
                    <>
                      <PlayerAvatar nbaPlayerId={asset.nba_player_id} name={asset.name} size="xs" />
                      <span className="text-xs text-gray-300 flex-1 truncate">{asset.name}</span>
                      <span className="text-xs text-gray-500">{formatSalary(asset.salary)}</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-300 flex-1 truncate">{asset.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available players */}
        <div className="p-3 border-b border-gray-700/50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Roster</p>
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-2"
          />
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {filteredRoster.slice(0, 20).map((p) => (
              <button
                key={p.id as string}
                onClick={() => onAddPlayer(slot.team.id, {
                  type: 'player',
                  id: p.id as string,
                  name: `${p.first_name} ${p.last_name}`,
                  salary: Number(p.current_year_salary ?? 0),
                  position: p.position as string,
                  nba_player_id: p.nba_player_id as number | null,
                  jersey_number: p.jersey_number as string,
                })}
                className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 text-left"
              >
                <PlayerAvatar nbaPlayerId={p.nba_player_id as number} name={`${p.first_name} ${p.last_name}`} size="xs" />
                <span className="text-xs text-gray-300 flex-1 truncate">{p.first_name as string} {p.last_name as string}</span>
                <span className="text-xs text-gray-500">{formatSalary(p.current_year_salary as number)}</span>
                <span className="text-xs text-blue-400">+</span>
              </button>
            ))}
          </div>
        </div>

        {/* Available picks */}
        {filteredPicks.length > 0 && (
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Draft Picks</p>
            <div className="space-y-0.5">
              {(filteredPicks as Record<string, unknown>[]).map((p) => {
                const label = `${p.draft_year} R${p.round} #${p.pick_number}${p.original_team_abbr !== slot.team.abbreviation ? ` (via ${p.original_team_abbr})` : ''}`
                return (
                  <button
                    key={p.id as string}
                    onClick={() => onAddPick(slot.team.id, {
                      type: 'pick',
                      id: p.id as string,
                      label,
                      pick_number: p.pick_number as number,
                      round: p.round as number,
                      draft_year: p.draft_year as number,
                      original_abbr: p.original_team_abbr as string,
                      conveyance_notes: p.conveyance_notes as string | null,
                    })}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 text-left"
                  >
                    <span className="text-xs text-yellow-400">🏆</span>
                    <span className="text-xs text-gray-300 flex-1">{label}</span>
                    <span className="text-xs text-blue-400">+</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main TradeMachine ────────────────────────────────────────────────────────

export default function TradeMachine() {
  const navigate = useNavigate()
  const { data: allTeams = [] } = useAllTeams()
  const setTradeLegs = useWorkspaceStore((s) => s.setTradeLegs)
  const setTradedPicks = useWorkspaceStore((s) => s.setTradedPicks)
  const clearTrade = useWorkspaceStore((s) => s.clearTrade)

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [slots, setSlots] = useState<TeamSlot[]>([])
  const [teamPickerOpen, setTeamPickerOpen] = useState(false)
  const [teamSearch, setTeamSearch] = useState('')

  const validate = useValidateTrade()
  const createScenario = useCreateScenario()
  const isMultiTeam = selectedTeamIds.length > 2

  // Sync slots when selected teams change
  useEffect(() => {
    setSlots((prev) => {
      const prevMap = new Map(prev.map((s) => [s.team.id, s]))
      return selectedTeamIds.map((id) => {
        const team = (allTeams as TradeTeam[]).find((t) => t.id === id)!
        return prevMap.get(id) ?? { team, sending: [] }
      }).filter((s) => s.team)
    })
  }, [selectedTeamIds, allTeams])

  // Auto-validate when assets change (2-team only; multi-team requires explicit direction)
  useEffect(() => {
    if (!isMultiTeam && slots.some((s) => s.sending.length > 0)) {
      buildAndValidate()
    }
  }, [slots.map((s) => s.sending.length).join(',')])

  function buildTradeLegs() {
    const legs: { playerId: string; fromTeamId: string; toTeamId: string }[] = []
    const pickLegs: { pickId: string; fromTeamId: string; toTeamId: string }[] = []

    for (const slot of slots) {
      for (const asset of slot.sending) {
        const toTeamId = isMultiTeam
          ? (asset as Asset & { toTeamId?: string }).toTeamId ?? ''
          : slots.find((s) => s.team.id !== slot.team.id)?.team.id ?? ''

        if (!toTeamId) continue

        if (asset.type === 'player') {
          legs.push({ playerId: asset.id, fromTeamId: slot.team.id, toTeamId })
        } else {
          pickLegs.push({ pickId: asset.id, fromTeamId: slot.team.id, toTeamId })
        }
      }
    }
    return { legs, pickLegs }
  }

  function buildAndValidate() {
    const { legs, pickLegs } = buildTradeLegs()
    if (legs.length >= 1) validate.mutate({ players: legs, picks: pickLegs })
  }

  const validation = validate.data
  const allSending = slots.flatMap((s) => s.sending)
  const hasAssets = allSending.length > 0

  function addTeam(teamId: string) {
    if (selectedTeamIds.includes(teamId) || selectedTeamIds.length >= 4) return
    setSelectedTeamIds((prev) => [...prev, teamId])
    setTeamPickerOpen(false)
    setTeamSearch('')
  }

  function removeTeam(teamId: string) {
    setSelectedTeamIds((prev) => prev.filter((id) => id !== teamId))
  }

  function addPlayer(teamId: string, player: PlayerAsset) {
    setSlots((prev) => prev.map((s) =>
      s.team.id === teamId && !s.sending.find((a) => a.id === player.id)
        ? { ...s, sending: [...s.sending, player] }
        : s,
    ))
  }

  function addPick(teamId: string, pick: PickAsset) {
    setSlots((prev) => prev.map((s) =>
      s.team.id === teamId && !s.sending.find((a) => a.id === pick.id)
        ? { ...s, sending: [...s.sending, pick] }
        : s,
    ))
  }

  function removeAsset(teamId: string, assetId: string) {
    setSlots((prev) => prev.map((s) =>
      s.team.id === teamId
        ? { ...s, sending: s.sending.filter((a) => a.id !== assetId) }
        : s,
    ))
  }

  function changeDestination(fromTeamId: string, assetId: string, toTeamId: string) {
    setSlots((prev) => prev.map((s) =>
      s.team.id === fromTeamId
        ? {
          ...s,
          sending: s.sending.map((a) =>
            a.id === assetId ? { ...a, toTeamId } : a,
          ),
        }
        : s,
    ))
  }

  async function handleSave() {
    const { legs, pickLegs } = buildTradeLegs()
    if (legs.length === 0) return

    const name = slots.map((s) => s.team.abbreviation).join(' / ') + ' Trade'

    // Write to workspaceStore for immediate projection
    const tradeLegsFull = legs.map((l) => {
      const player = allSending.find((a) => a.type === 'player' && a.id === l.playerId) as PlayerAsset
      const fromSlot = slots.find((s) => s.team.id === l.fromTeamId)!
      const toSlot = slots.find((s) => s.team.id === l.toTeamId)!
      return {
        playerId: l.playerId,
        playerName: player?.name ?? '',
        salary: player?.salary ?? 0,
        fromTeamId: l.fromTeamId,
        fromTeamName: `${fromSlot.team.city} ${fromSlot.team.name}`,
        toTeamId: l.toTeamId,
        toTeamName: `${toSlot.team.city} ${toSlot.team.name}`,
      }
    })

    const tradedPicksFull: TradedPick[] = pickLegs.map((pl) => {
      const pick = allSending.find((a) => a.type === 'pick' && a.id === pl.pickId) as PickAsset
      const fromSlot = slots.find((s) => s.team.id === pl.fromTeamId)!
      const toSlot = slots.find((s) => s.team.id === pl.toTeamId)!
      return {
        pickId: pl.pickId,
        pickNumber: pick.pick_number,
        round: pick.round,
        draftYear: pick.draft_year,
        fromTeamId: pl.fromTeamId,
        fromTeamName: `${fromSlot.team.city} ${fromSlot.team.name}`,
        fromTeamAbbr: fromSlot.team.abbreviation,
        toTeamId: pl.toTeamId,
        toTeamName: `${toSlot.team.city} ${toSlot.team.name}`,
        toTeamAbbr: toSlot.team.abbreviation,
      }
    })

    setTradeLegs(tradeLegsFull)
    setTradedPicks(tradedPicksFull)

    await createScenario.mutate(name)
    navigate('/trade')
  }

  const filteredTeams = (allTeams as TradeTeam[]).filter(
    (t) => !selectedTeamIds.includes(t.id) &&
      `${t.city} ${t.name} ${t.abbreviation}`.toLowerCase().includes(teamSearch.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/trade')} className="text-gray-500 hover:text-gray-300 text-sm">
            ← Trading Block
          </button>
          <h1 className="text-xl font-bold text-white">Trade Builder</h1>
          <span className="text-xs text-gray-500">{selectedTeamIds.length} team{selectedTeamIds.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasAssets && !isMultiTeam && (
            <button onClick={() => buildAndValidate()} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded">
              Validate
            </button>
          )}
          {validation?.isValid && hasAssets && (
            <button onClick={handleSave} disabled={createScenario.isPending}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded">
              {createScenario.isPending ? 'Saving…' : 'Save scenario'}
            </button>
          )}
          {hasAssets && (
            <button onClick={() => { clearTrade(); setSlots([]); setSelectedTeamIds([]) }}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Team selector bar */}
      <div className="px-6 py-2 border-b border-gray-800 flex items-center gap-2 shrink-0 bg-gray-900/50">
        {selectedTeamIds.map((id) => {
          const team = (allTeams as TradeTeam[]).find((t) => t.id === id)
          if (!team) return null
          return (
            <div key={id} className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1">
              {team.logo_url && <img src={team.logo_url} alt={team.abbreviation} className="w-4 h-4 object-contain" />}
              <span className="text-sm text-white">{team.abbreviation}</span>
              <button onClick={() => removeTeam(id)} className="text-gray-600 hover:text-red-400 ml-1">×</button>
            </div>
          )
        })}

        {selectedTeamIds.length < 4 && (
          <div className="relative">
            <button
              onClick={() => setTeamPickerOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 border border-blue-700 border-dashed rounded-lg text-sm text-blue-400 hover:bg-blue-600/30 transition-colors"
            >
              + Add team
            </button>
            {teamPickerOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-transparent border-b border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
                <div className="max-h-56 overflow-y-auto">
                  {filteredTeams.map((t) => (
                    <button key={t.id} onClick={() => addTeam(t.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 text-left">
                      {t.logo_url && <img src={t.logo_url} alt={t.abbreviation} className="w-5 h-5 object-contain" />}
                      <span className="text-sm text-white">{t.city} {t.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">{t.abbreviation}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTeamIds.length === 0 && (
          <span className="text-sm text-gray-600">Select at least 2 teams to build a trade</span>
        )}
      </div>

      {/* Main: team columns + CBA sidebar */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {selectedTeamIds.length < 2 ? (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
            Add teams above to start building the trade
          </div>
        ) : (
          <>
            {/* Team columns */}
            <div className="flex-1 flex gap-3 overflow-x-auto overflow-y-hidden">
              {slots.map((slot) => (
                <TeamColumn
                  key={slot.team.id}
                  slot={slot}
                  allSlots={slots}
                  onAddPlayer={addPlayer}
                  onAddPick={addPick}
                  onRemoveAsset={removeAsset}
                  onChangeDestination={changeDestination}
                  isMultiTeam={isMultiTeam}
                />
              ))}
            </div>

            {/* CBA sidebar */}
            <div className="w-56 shrink-0 space-y-3 overflow-y-auto">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">CBA</h2>

              {validation ? (
                <>
                  {Object.entries(validation.teamSummaries).map(([teamId, summary]) => {
                    const slot = slots.find((s) => s.team.id === teamId)
                    return (
                      <SalaryMeter
                        key={teamId}
                        summary={summary as TeamTradeSummary}
                        teamName={slot?.team.abbreviation ?? teamId}
                      />
                    )
                  })}
                  {validation.isValid ? (
                    <div className="bg-green-950 border border-green-800 rounded px-3 py-2 text-xs text-green-400 flex items-center gap-1.5">
                      ✓ CBA-compliant
                    </div>
                  ) : (
                    <div className="bg-red-950 border border-red-800 rounded p-3 space-y-1">
                      {validation.violations.map((v, i) => (
                        <p key={i} className="text-xs text-red-300">✗ {v.message}</p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-800 border border-gray-700 rounded p-3 text-xs text-gray-500">
                  {allSending.filter((a) => a.type === 'player').length < 1
                    ? 'Add players to validate'
                    : 'Click Validate to check CBA'}
                </div>
              )}

              <div className="bg-gray-800 border border-gray-700 rounded p-3 text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-400 mb-1.5">Rules applied</p>
                <p>· 125% + $100K matching</p>
                <p>· Cap room absorption</p>
                <p>· Second apron hard cap</p>
                <p>· Two-way restriction</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
