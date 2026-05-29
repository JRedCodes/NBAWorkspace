import { teamsQueries } from './teams.queries'
import { cacheService } from '../../services/cache.service'
import { AppError } from '../../middleware/errorHandler'

const TTL = 6 * 60 * 60

function computeNeeds(rows: Record<string, number | null>[]): Record<string, number> {
  if (!rows.length) {
    return {
      threePoint: 50, rimProtection: 50, playmaking: 50,
      slashing: 50, rebounding: 50, poaDefense: 50, leadership: 50,
    }
  }
  const avg = (key: string) => {
    const vals = rows.map((r) => r[key] ?? 50).filter((v) => v != null) as number[]
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 50
  }
  return {
    threePoint: Math.round(100 - avg('three_point_percentile')),
    rimProtection: Math.round(100 - avg('rim_protection_score')),
    playmaking: Math.round(100 - avg('playmaking_score')),
    slashing: Math.round(100 - avg('slashing_score')),
    rebounding: Math.round(100 - avg('rebounding_percentile')),
    poaDefense: Math.round(100 - avg('poa_defense_score')),
    leadership: Math.round(100 - avg('leadership_index')),
  }
}

export const teamsService = {
  async getAll() {
    const key = 'teams:all'
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await teamsQueries.getAll()
    await cacheService.set(key, data, TTL)
    return data
  },

  async getById(id: string) {
    const key = `team:${id}:header`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const team = await teamsQueries.getById(id)
    if (!team) throw new AppError(404, 'Team not found')
    await cacheService.set(key, team, TTL)
    return team
  },

  async getRoster(teamId: string) {
    const key = `team:${teamId}:roster`
    const cached = await cacheService.get(key)
    if (cached) return cached
    await teamsQueries.getById(teamId).then((t) => { if (!t) throw new AppError(404, 'Team not found') })
    const data = await teamsQueries.getRoster(teamId)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getStaff(teamId: string) {
    const key = `team:${teamId}:staff`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await teamsQueries.getStaff(teamId)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getCap(teamId: string) {
    const key = `team:${teamId}:cap`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await teamsQueries.getCapSheet(teamId)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getFutureSalaries(teamId: string) {
    const key = `team:${teamId}:cap:future`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await teamsQueries.getFutureSalaries(teamId)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getPicks(teamId: string) {
    const key = `team:${teamId}:picks`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await teamsQueries.getPicks(teamId)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getStats(teamId: string, season?: string) {
    const key = `team:${teamId}:stats:${season ?? 'current'}`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await teamsQueries.getStats(teamId, season)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getNeeds(teamId: string) {
    const key = `team:${teamId}:needs`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const rows = await teamsQueries.getNeeds(teamId)
    const data = computeNeeds(rows as Record<string, number | null>[])
    await cacheService.set(key, data, TTL)
    return data
  },

  async getProjectedNeeds(
    teamId: string,
    outgoingPlayerIds: string[],
    incomingPlayerIds: string[],
  ) {
    // Fetch current roster metrics
    const currentRows = await teamsQueries.getNeeds(teamId) as Record<string, unknown>[]
    // Fetch incoming player metrics (they live on another team's roster)
    const incomingMetrics = await teamsQueries.getPlayerMetricsBatch(incomingPlayerIds)

    // Remove outgoing players, add incoming players
    const filteredRows = currentRows.filter(
      (r) => !outgoingPlayerIds.includes(r.player_id as string),
    )
    const combined = [...filteredRows, ...incomingMetrics as Record<string, unknown>[]]

    return {
      current: computeNeeds(currentRows as Record<string, number | null>[]),
      projected: computeNeeds(combined as Record<string, number | null>[]),
    }
  },

  async getAnalytics(teamId: string) {
    const key = `team:${teamId}:analytics`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await teamsQueries.getAnalytics(teamId)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getCarousel() {
    const key = 'teams:carousel'
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await teamsQueries.getCarousel()
    await cacheService.set(key, data, TTL)
    return data
  },

  async getPowerRankings() {
    const key = 'analytics:league:power'
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await teamsQueries.getPowerRankings()
    await cacheService.set(key, data, TTL)
    return data
  },
}
