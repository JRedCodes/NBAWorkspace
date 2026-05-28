import { draftQueries } from './draft.queries'
import { cacheService } from '../../services/cache.service'
import { AppError } from '../../middleware/errorHandler'
import type { CreateBoardBody } from './draft.schema'

const TTL_24H = 24 * 60 * 60

export const draftService = {
  async getProspects(filters: Record<string, string>) {
    const key = `draft:prospects:${JSON.stringify(filters)}`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await draftQueries.getProspects({
      position: filters.position,
      school: filters.school,
      minRank: filters.minRank ? parseInt(filters.minRank) : undefined,
      maxRank: filters.maxRank ? parseInt(filters.maxRank) : undefined,
      draftYear: filters.draftYear ? parseInt(filters.draftYear) : undefined,
    })
    await cacheService.set(key, data, TTL_24H)
    return data
  },

  async getProspect(id: string) {
    const key = `draft:prospect:${id}`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await draftQueries.getProspectById(id)
    if (!data) throw new AppError(404, 'Prospect not found')
    await cacheService.set(key, data, TTL_24H)
    return data
  },

  async getDraftOrder(draftYear = 2026) {
    const key = `draft:order:${draftYear}`
    const cached = await cacheService.get(key)
    if (cached) return cached
    const data = await draftQueries.getDraftOrder(draftYear)
    await cacheService.set(key, data, 6 * 60 * 60)
    return data
  },

  async getBoards(userId: string) {
    const workspace = await draftQueries.getWorkspaceId(userId)
    if (!workspace) throw new AppError(404, 'Workspace not found')
    return draftQueries.getBoardsByWorkspace(workspace.id)
  },

  async getBoard(id: string) {
    const entries = await draftQueries.getBoardWithEntries(id)
    return entries
  },

  async createBoard(body: CreateBoardBody, userId: string) {
    const workspace = await draftQueries.getWorkspaceId(userId)
    if (!workspace) throw new AppError(404, 'Workspace not found')
    const board = await draftQueries.createBoard(workspace.id, body.name)
    await draftQueries.seedBoardWithModelRanks(board.id)
    return board
  },

  async renameBoard(id: string, name: string) {
    await draftQueries.updateBoardName(id, name)
  },

  async replaceRankings(boardId: string, rankings: { prospectId: string; rank: number }[]) {
    await draftQueries.replaceRankings(boardId, rankings)
  },

  async updateEntry(boardId: string, prospectId: string, data: { custom_rank?: number; user_notes?: string }) {
    await draftQueries.updateEntry(boardId, prospectId, data)
  },

  async resetBoard(id: string) {
    await draftQueries.resetBoard(id)
  },

  async deleteBoard(id: string) {
    await draftQueries.deleteBoard(id)
  },
}
