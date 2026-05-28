import { z } from 'zod'

export const createBoardSchema = z.object({
  name: z.string().min(1).max(200).default('My Draft Board'),
})

export const renameBoardSchema = z.object({
  name: z.string().min(1).max(200),
})

export const updateEntrySchema = z.object({
  custom_rank: z.number().int().positive().optional(),
  user_notes: z.string().max(500).optional(),
})

export const replaceRankingsSchema = z.object({
  rankings: z.array(z.object({
    prospectId: z.string().uuid(),
    rank: z.number().int().positive(),
  })),
})

export type CreateBoardBody = z.infer<typeof createBoardSchema>
export type RenameBoardBody = z.infer<typeof renameBoardSchema>
