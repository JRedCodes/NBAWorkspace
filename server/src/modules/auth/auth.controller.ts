import type { Request, Response } from 'express'
import { authService } from './auth.service'
import { asyncHandler } from '../../utils/asyncHandler'

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body)
    res.status(201).json(result)
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body)
    res.json(result)
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken)
    res.json(result)
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.user!.userId)
    res.status(204).send()
  }),

  onboarding: asyncHandler(async (req: Request, res: Response) => {
    const completed = req.body.completed ?? true
    await authService.setOnboarding(req.user!.userId, completed)
    res.status(204).send()
  }),
}
