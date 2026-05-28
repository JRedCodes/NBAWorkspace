import { playersQueries } from './players.queries'
import { cacheService } from '../../services/cache.service'
import { AppError } from '../../middleware/errorHandler'

const TTL = 6 * 60 * 60
const TTL_SHOTCHART = 24 * 60 * 60

export const playersService = {
  async search(q: string) {
    if (!q || q.length < 2) throw new AppError(400, 'Query must be at least 2 characters')
    const key = `players:search:${q.toLowerCase()}`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await playersQueries.search(q)
    await cacheService.set(key, data, 60 * 10)
    return data
  },

  async getById(id: string) {
    const key = `player:${id}:profile`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const player = await playersQueries.getById(id)
    if (!player) throw new AppError(404, 'Player not found')
    await cacheService.set(key, player, TTL)
    return player
  },

  async getStats(playerId: string, season?: string) {
    const key = `player:${playerId}:stats:${season ?? 'all'}`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await playersQueries.getStats(playerId, season)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getMetrics(playerId: string) {
    const key = `player:${playerId}:metrics`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await playersQueries.getMetrics(playerId)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getFitForTeam(playerId: string, teamId: string) {
    const key = `player:${playerId}:fit:${teamId}`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await playersQueries.getFitForTeam(playerId, teamId)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getFitAll(playerId: string) {
    const key = `player:${playerId}:fit:all`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await playersQueries.getFitAll(playerId)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getContract(playerId: string) {
    const key = `player:${playerId}:contract`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await playersQueries.getContract(playerId)
    await cacheService.set(key, data, TTL)
    return data
  },

  async getShotChart(playerId: string, filters: Record<string, string>) {
    const key = `player:${playerId}:shotchart:${JSON.stringify(filters)}`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await playersQueries.getShotChart(playerId, filters)
    await cacheService.set(key, data, TTL_SHOTCHART)
    return data
  },

  async getShotZones(playerId: string, season?: string) {
    const key = `player:${playerId}:shotchart:zones:${season ?? 'current'}`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await playersQueries.getShotZones(playerId, season)
    await cacheService.set(key, data, TTL_SHOTCHART)
    return data
  },
}
