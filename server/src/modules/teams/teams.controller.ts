import type { Request, Response } from 'express'
import { teamsService } from './teams.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { qs, param } from '../../utils/query'

export const teamsController = {
  getAll: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await teamsService.getAll())
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await teamsService.getById(param(req.params.teamId)))
  }),

  getRoster: asyncHandler(async (req: Request, res: Response) => {
    res.json(await teamsService.getRoster(param(req.params.teamId)))
  }),

  getStaff: asyncHandler(async (req: Request, res: Response) => {
    res.json(await teamsService.getStaff(param(req.params.teamId)))
  }),

  getCap: asyncHandler(async (req: Request, res: Response) => {
    res.json(await teamsService.getCap(param(req.params.teamId)))
  }),

  getFutureSalaries: asyncHandler(async (req: Request, res: Response) => {
    res.json(await teamsService.getFutureSalaries(param(req.params.teamId)))
  }),

  getPicks: asyncHandler(async (req: Request, res: Response) => {
    res.json(await teamsService.getPicks(param(req.params.teamId)))
  }),

  getStats: asyncHandler(async (req: Request, res: Response) => {
    res.json(await teamsService.getStats(param(req.params.teamId), qs(req.query.season)))
  }),

  getNeeds: asyncHandler(async (req: Request, res: Response) => {
    res.json(await teamsService.getNeeds(param(req.params.teamId)))
  }),

  getProjectedNeeds: asyncHandler(async (req: Request, res: Response) => {
    const { outgoingPlayerIds = [], incomingPlayerIds = [] } = req.body as {
      outgoingPlayerIds: string[]
      incomingPlayerIds: string[]
    }
    res.json(await teamsService.getProjectedNeeds(
      param(req.params.teamId),
      outgoingPlayerIds,
      incomingPlayerIds,
    ))
  }),

  getAnalytics: asyncHandler(async (req: Request, res: Response) => {
    res.json(await teamsService.getAnalytics(param(req.params.teamId)))
  }),

  getCarousel: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await teamsService.getCarousel())
  }),

  getPowerRankings: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await teamsService.getPowerRankings())
  }),
}
