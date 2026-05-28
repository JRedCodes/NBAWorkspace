import type { Request, Response } from 'express'
import { playersService } from './players.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { qs, param } from '../../utils/query'

export const playersController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    res.json(await playersService.search(qs(req.query.q) ?? ''))
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await playersService.getById(param(req.params.playerId)))
  }),

  getStats: asyncHandler(async (req: Request, res: Response) => {
    res.json(await playersService.getStats(param(req.params.playerId), qs(req.query.season)))
  }),

  getMetrics: asyncHandler(async (req: Request, res: Response) => {
    res.json(await playersService.getMetrics(param(req.params.playerId)))
  }),

  getFitForTeam: asyncHandler(async (req: Request, res: Response) => {
    res.json(await playersService.getFitForTeam(param(req.params.playerId), param(req.params.teamId)))
  }),

  getFitAll: asyncHandler(async (req: Request, res: Response) => {
    res.json(await playersService.getFitAll(param(req.params.playerId)))
  }),

  getContract: asyncHandler(async (req: Request, res: Response) => {
    res.json(await playersService.getContract(param(req.params.playerId)))
  }),

  getShotChart: asyncHandler(async (req: Request, res: Response) => {
    const filters: Record<string, string> = {}
    for (const [k, v] of Object.entries(req.query)) {
      const val = qs(v)
      if (val) filters[k] = val
    }
    res.json(await playersService.getShotChart(param(req.params.playerId), filters))
  }),

  getShotZones: asyncHandler(async (req: Request, res: Response) => {
    res.json(await playersService.getShotZones(param(req.params.playerId), qs(req.query.season)))
  }),
}
