import type { Request, Response } from 'express'
import { tradeService } from './trade.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { param } from '../../utils/query'

export const tradeController = {
  validate: asyncHandler(async (req: Request, res: Response) => {
    res.json(await tradeService.validate(req.body))
  }),

  project: asyncHandler(async (req: Request, res: Response) => {
    res.json(await tradeService.project(req.body))
  }),

  getScenarios: asyncHandler(async (req: Request, res: Response) => {
    res.json(await tradeService.getScenarios(req.user!.userId))
  }),

  getScenario: asyncHandler(async (req: Request, res: Response) => {
    res.json(await tradeService.getScenario(param(req.params.id), req.user!.userId))
  }),

  createScenario: asyncHandler(async (req: Request, res: Response) => {
    const scenario = await tradeService.createScenario(req.body, req.user!.userId)
    res.status(201).json(scenario)
  }),

  updateScenario: asyncHandler(async (req: Request, res: Response) => {
    await tradeService.updateScenario(param(req.params.id), req.body, req.user!.userId)
    res.status(204).send()
  }),

  duplicateScenario: asyncHandler(async (req: Request, res: Response) => {
    const scenario = await tradeService.duplicateScenario(param(req.params.id), req.user!.userId)
    res.status(201).json(scenario)
  }),

  deleteScenario: asyncHandler(async (req: Request, res: Response) => {
    await tradeService.deleteScenario(param(req.params.id), req.user!.userId)
    res.status(204).send()
  }),
}
