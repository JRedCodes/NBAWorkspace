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

    // Build projected roster per team
    const projection: Record<string, {
      playersOut: { playerId: string; name: string; salary: number }[]
      playersIn: { playerId: string; name: string; salary: number }[]
      projectedPayroll: number
      isValid: boolean
    }> = {}

    for (const slot of slots) {
      const summary = validation.teamSummaries[slot.teamId]
      const currentPayroll = payrolls[slot.teamId] ?? 0

      projection[slot.teamId] = {
        playersOut: slot.outgoing.map((p) => ({
          playerId: p.playerId,
          name: `${contractMap[p.playerId]?.first_name ?? ''} ${contractMap[p.playerId]?.last_name ?? ''}`.trim(),
          salary: p.salary,
        })),
        playersIn: slot.incoming.map((p) => ({
          playerId: p.playerId,
          name: `${contractMap[p.playerId]?.first_name ?? ''} ${contractMap[p.playerId]?.last_name ?? ''}`.trim(),
          salary: p.salary,
        })),
        projectedPayroll: currentPayroll - summary.salaryOut + summary.salaryIn,
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
