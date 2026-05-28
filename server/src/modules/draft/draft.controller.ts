import type { Request, Response } from 'express'
import { draftService } from './draft.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { qs, param } from '../../utils/query'

export const draftController = {
  getProspects: asyncHandler(async (req: Request, res: Response) => {
    const filters: Record<string, string> = {}
    for (const [k, v] of Object.entries(req.query)) {
      const val = qs(v)
      if (val) filters[k] = val
    }
    res.json(await draftService.getProspects(filters))
  }),

  getProspect: asyncHandler(async (req: Request, res: Response) => {
    res.json(await draftService.getProspect(param(req.params.id)))
  }),

  getDraftOrder: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await draftService.getDraftOrder())
  }),

  getBoards: asyncHandler(async (req: Request, res: Response) => {
    res.json(await draftService.getBoards(req.user!.userId))
  }),

  getBoard: asyncHandler(async (req: Request, res: Response) => {
    res.json(await draftService.getBoard(param(req.params.id)))
  }),

  createBoard: asyncHandler(async (req: Request, res: Response) => {
    const board = await draftService.createBoard(req.body, req.user!.userId)
    res.status(201).json(board)
  }),

  renameBoard: asyncHandler(async (req: Request, res: Response) => {
    await draftService.renameBoard(param(req.params.id), req.body.name)
    res.status(204).send()
  }),

  replaceRankings: asyncHandler(async (req: Request, res: Response) => {
    await draftService.replaceRankings(param(req.params.id), req.body.rankings)
    res.status(204).send()
  }),

  updateEntry: asyncHandler(async (req: Request, res: Response) => {
    await draftService.updateEntry(
      param(req.params.id),
      param(req.params.prospectId),
      req.body,
    )
    res.status(204).send()
  }),

  resetBoard: asyncHandler(async (req: Request, res: Response) => {
    await draftService.resetBoard(param(req.params.id))
    res.status(204).send()
  }),

  deleteBoard: asyncHandler(async (req: Request, res: Response) => {
    await draftService.deleteBoard(param(req.params.id))
    res.status(204).send()
  }),
}
