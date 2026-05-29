import { tradeQueries } from './trade.queries'
import { validateTrade, type TeamTradeSlot } from './cba.engine'
import { AppError } from '../../middleware/errorHandler'
import type { ValidateTradeBody, CreateScenarioBody } from './trade.schema'

type PlayerLeg = { playerId: string; fromTeamId: string; toTeamId: string }

async function buildTeamSlots(players: PlayerLeg[]) {
  const playerIds = players.map((p) => p.playerId)
  const contracts = await tradeQueries.getPlayerContracts(playerIds)
  const contractMap = Object.fromEntries(contracts.map((c) => [c.player_id, c]))

  // Group by fromTeamId
  const slotMap = new Map<string, TeamTradeSlot>()

  const ensureSlot = (teamId: string) => {
    if (!slotMap.has(teamId)) {
      slotMap.set(teamId, { teamId, outgoing: [], incoming: [] })
    }
    return slotMap.get(teamId)!
  }

  for (const leg of players) {
    const contract = contractMap[leg.playerId]
    if (!contract) throw new AppError(400, `Player ${leg.playerId} has no contract on file`)

    const playerInfo = {
      playerId: leg.playerId,
      teamId: contract.team_id,
      salary: Number(contract.current_year_salary),
      isTwoWay: contract.is_two_way,
      isRookieScale: contract.is_rookie_scale,
    }

    ensureSlot(leg.fromTeamId).outgoing.push(playerInfo)
    ensureSlot(leg.toTeamId).incoming.push(playerInfo)
  }

  return { slots: Array.from(slotMap.values()), contracts, contractMap }
}

async function getPayrolls(teamIds: string[]): Promise<Record<string, number>> {
  const payrolls: Record<string, number> = {}
  await Promise.all(
    teamIds.map(async (id) => {
      const row = await tradeQueries.getTeamRosterSalaries(id)
      payrolls[id] = Number(row?.total ?? 0)
    }),
  )
  return payrolls
}

function buildPlayerStats(
  s: Record<string, unknown> | undefined,
  avgOff: number,
  avgDef: number,
  toNum: (v: unknown, f: number) => number,
): Record<string, number | null> {
  if (!s) return { ppg: null, rpg: null, apg: null, mpg: null, offRtg: null, defRtg: null, tsPct: null }
  return {
    ppg: toNum(s.points, 0),
    rpg: toNum(s.rebounds, 0),
    apg: toNum(s.assists, 0),
    mpg: toNum(s.minutes_per_game, 0),
    offRtg: toNum(s.offensive_rating, avgOff),
    defRtg: toNum(s.defensive_rating, avgDef),
    tsPct: toNum(s.true_shooting_pct, 0),
  }
}

export const tradeService = {
  async validate(body: ValidateTradeBody) {
    const { slots, contractMap } = await buildTeamSlots(body.players)
    const teamIds = slots.map((s) => s.teamId)
    const payrolls = await getPayrolls(teamIds)
    const result = validateTrade(slots, payrolls)
    return result
  },

  async project(body: ValidateTradeBody) {
    const { slots, contractMap } = await buildTeamSlots(body.players)
    const teamIds = slots.map((s) => s.teamId)
    const payrolls = await getPayrolls(teamIds)
    const validation = validateTrade(slots, payrolls)

    // Fetch season stats for all players in the trade
    const allPlayerIds = slots.flatMap((s) => [
      ...s.outgoing.map((p) => p.playerId),
      ...s.incoming.map((p) => p.playerId),
    ])
    const playerStats = await tradeQueries.getPlayerSeasonStats(allPlayerIds)
    const statsMap = Object.fromEntries(playerStats.map((s) => [s.player_id, s]))

    // Weighted-minutes replacement model constants
    const TEAM_MINUTES_PER_GAME = 240  // 5 players × 48 min
    const LEAGUE_AVG_OFF = 113.0
    const LEAGUE_AVG_DEF = 113.0

    function toNum(v: unknown, fallback: number): number {
      const n = Number(v)
      return isNaN(n) || n === 0 ? fallback : n
    }

    const projection: Record<string, {
      playersOut: { playerId: string; name: string; salary: number; stats: Record<string, number | null> }[]
      playersIn: { playerId: string; name: string; salary: number; stats: Record<string, number | null> }[]
      projectedPayroll: number
      projectedStats: {
        offRating: number; defRating: number; netRating: number
        pace: number | null
        pointsDelta: number; reboundsDelta: number; assistsDelta: number
      }
      baselineStats: { offRating: number; defRating: number; netRating: number } | null
      isValid: boolean
    }> = {}

    for (const slot of slots) {
      const summary = validation.teamSummaries[slot.teamId]
      const currentPayroll = payrolls[slot.teamId] ?? 0

      // Fetch this team's current baseline stats
      const baseline = await tradeQueries.getTeamBaselineStats(slot.teamId)
      const baseOff = toNum(baseline?.offensive_rating, LEAGUE_AVG_OFF)
      const baseDef = toNum(baseline?.defensive_rating, LEAGUE_AVG_DEF)

      // Calculate weighted impact per player
      // Impact = (player_individual_rating - league_avg) × (player_mpg / TEAM_MPG)
      // Net change = sum of incoming impacts - sum of outgoing impacts

      let offImpact = 0
      let defImpact = 0
      let ptsDelta = 0
      let rebDelta = 0
      let astDelta = 0

      for (const p of slot.outgoing) {
        const s = statsMap[p.playerId]
        const mpg = toNum(s?.minutes_per_game, 20)
        const weight = mpg / TEAM_MINUTES_PER_GAME
        const offRtg = toNum(s?.offensive_rating, LEAGUE_AVG_OFF)
        const defRtg = toNum(s?.defensive_rating, LEAGUE_AVG_DEF)
        offImpact -= (offRtg - LEAGUE_AVG_OFF) * weight
        defImpact -= (defRtg - LEAGUE_AVG_DEF) * weight
        ptsDelta -= toNum(s?.points, 10) * weight * TEAM_MINUTES_PER_GAME / mpg
        rebDelta -= toNum(s?.rebounds, 4) * weight * TEAM_MINUTES_PER_GAME / mpg
        astDelta -= toNum(s?.assists, 2) * weight * TEAM_MINUTES_PER_GAME / mpg
      }

      for (const p of slot.incoming) {
        const s = statsMap[p.playerId]
        const mpg = toNum(s?.minutes_per_game, 20)
        // Incoming player takes roughly the outgoing player's minutes
        const outMpg = toNum(statsMap[slot.outgoing[0]?.playerId]?.minutes_per_game, mpg)
        const weight = outMpg / TEAM_MINUTES_PER_GAME
        const offRtg = toNum(s?.offensive_rating, LEAGUE_AVG_OFF)
        const defRtg = toNum(s?.defensive_rating, LEAGUE_AVG_DEF)
        offImpact += (offRtg - LEAGUE_AVG_OFF) * weight
        defImpact += (defRtg - LEAGUE_AVG_DEF) * weight
        ptsDelta += toNum(s?.points, 10) * weight * TEAM_MINUTES_PER_GAME / mpg
        rebDelta += toNum(s?.rebounds, 4) * weight * TEAM_MINUTES_PER_GAME / mpg
        astDelta += toNum(s?.assists, 2) * weight * TEAM_MINUTES_PER_GAME / mpg
      }

      const projOff = Math.round((baseOff + offImpact) * 10) / 10
      const projDef = Math.round((baseDef + defImpact) * 10) / 10

      projection[slot.teamId] = {
        playersOut: slot.outgoing.map((p) => ({
          playerId: p.playerId,
          name: `${contractMap[p.playerId]?.first_name ?? ''} ${contractMap[p.playerId]?.last_name ?? ''}`.trim(),
          salary: p.salary,
          stats: buildPlayerStats(statsMap[p.playerId], LEAGUE_AVG_OFF, LEAGUE_AVG_DEF, toNum),
        })),
        playersIn: slot.incoming.map((p) => ({
          playerId: p.playerId,
          name: `${contractMap[p.playerId]?.first_name ?? ''} ${contractMap[p.playerId]?.last_name ?? ''}`.trim(),
          salary: p.salary,
          stats: buildPlayerStats(statsMap[p.playerId], LEAGUE_AVG_OFF, LEAGUE_AVG_DEF, toNum),
        })),
        projectedPayroll: currentPayroll - summary.salaryOut + summary.salaryIn,
        projectedStats: {
          offRating: projOff,
          defRating: projDef,
          netRating: Math.round((projOff - projDef) * 10) / 10,
          pace: baseline?.pace ? Number(baseline.pace) : null,
          pointsDelta: Math.round(ptsDelta * 10) / 10,
          reboundsDelta: Math.round(rebDelta * 10) / 10,
          assistsDelta: Math.round(astDelta * 10) / 10,
        },
        baselineStats: baseline
          ? {
              offRating: baseOff,
              defRating: baseDef,
              netRating: Math.round((baseOff - baseDef) * 10) / 10,
            }
          : null,
        isValid: validation.isValid,
      }
    }

    return { validation, projection }
  },

  async getScenarios(userId: string) {
    const workspace = await tradeQueries.getUserWorkspaceId(userId)
    if (!workspace) throw new AppError(404, 'Workspace not found')
    return tradeQueries.getScenariosByWorkspace(workspace.id)
  },

  async getScenario(id: string, userId: string) {
    const scenario = await tradeQueries.getScenarioById(id)
    if (!scenario) throw new AppError(404, 'Scenario not found')
    const alerts = await tradeQueries.getDriftAlerts(id)
    return { ...scenario, driftAlerts: alerts }
  },

  async createScenario(body: CreateScenarioBody, userId: string) {
    const workspace = await tradeQueries.getUserWorkspaceId(userId)
    if (!workspace) throw new AppError(404, 'Workspace not found')

    const { slots, contractMap } = await buildTeamSlots(body.players)

    // Build snapshots
    const snapshotRoster: Record<string, { team_id: string }> = {}
    const snapshotContracts: Record<string, object> = {}
    for (const [playerId, contract] of Object.entries(contractMap) as [string, Record<string, unknown>][]) {
      snapshotRoster[playerId] = { team_id: String(contract.team_id ?? '') }
      snapshotContracts[playerId] = {
        current_year_salary: contract.current_year_salary,
        years_remaining: contract.years_remaining,
        has_player_option: contract.has_player_option,
        has_team_option: contract.has_team_option,
      }
    }
    const snapshotPicks = body.picks.reduce((acc, p) => {
      acc[p.pickId] = { from_team_id: p.fromTeamId, to_team_id: p.toTeamId }
      return acc
    }, {} as Record<string, object>)

    return tradeQueries.createScenario(
      workspace.id,
      body.name,
      snapshotRoster,
      snapshotContracts,
      snapshotPicks,
      body.players,  // persist legs so scenario can be reloaded
    )
  },

  async getScenarioLegs(id: string, userId: string) {
    await tradeService.getScenario(id, userId) // verify ownership
    return tradeQueries.getScenarioLegs(id)
  },

  async updateScenario(id: string, data: { name?: string }, userId: string) {
    await tradeService.getScenario(id, userId) // verify exists
    await tradeQueries.updateScenario(id, data)
  },

  async deleteScenario(id: string, userId: string) {
    await tradeService.getScenario(id, userId) // verify exists
    await tradeQueries.deleteScenario(id)
  },

  async duplicateScenario(id: string, userId: string) {
    const scenario = await tradeService.getScenario(id, userId)
    const workspace = await tradeQueries.getUserWorkspaceId(userId)
    if (!workspace) throw new AppError(404, 'Workspace not found')
    return tradeQueries.createScenario(
      workspace.id,
      `${scenario.name} (copy)`,
      scenario.snapshot_roster ?? {},
      scenario.snapshot_contracts ?? {},
      scenario.snapshot_picks ?? {},
    )
  },
}
