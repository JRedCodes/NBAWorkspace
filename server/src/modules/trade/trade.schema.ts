import { z } from 'zod'

const playerLegSchema = z.object({
  playerId: z.string().uuid(),
  fromTeamId: z.string().uuid(),
  toTeamId: z.string().uuid(),
})

const pickLegSchema = z.object({
  pickId: z.string().uuid(),
  fromTeamId: z.string().uuid(),
  toTeamId: z.string().uuid(),
})

export const validateTradeSchema = z.object({
  players: z.array(playerLegSchema).min(1),
  picks: z.array(pickLegSchema).default([]),
})

export const projectTradeSchema = validateTradeSchema

export const createScenarioSchema = z.object({
  name: z.string().min(1).max(200).default('Untitled Trade'),
  players: z.array(playerLegSchema).min(1),
  picks: z.array(pickLegSchema).default([]),
})

export const updateScenarioSchema = z.object({
  name: z.string().min(1).max(200).optional(),
})

export type ValidateTradeBody = z.infer<typeof validateTradeSchema>
export type CreateScenarioBody = z.infer<typeof createScenarioSchema>
export type UpdateScenarioBody = z.infer<typeof updateScenarioSchema>
