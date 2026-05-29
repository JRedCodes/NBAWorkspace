import type { Request, Response } from 'express'
import { workspaceService } from './workspace.service'
import { asyncHandler } from '../../utils/asyncHandler'

export const workspaceController = {
  getWorkspace: asyncHandler(async (req: Request, res: Response) => {
    res.json(await workspaceService.getWorkspace(req.user!.userId))
  }),

  resetWorkspace: asyncHandler(async (req: Request, res: Response) => {
    res.json(await workspaceService.resetWorkspace(req.user!.userId))
  }),
}
