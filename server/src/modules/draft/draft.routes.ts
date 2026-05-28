import { Router } from 'express'
import { draftController } from './draft.controller'
import { authenticate } from '../../middleware/authenticate'
import { validate } from '../../middleware/validate'
import { createBoardSchema, renameBoardSchema, updateEntrySchema, replaceRankingsSchema } from './draft.schema'
import { cacheMiddleware } from '../../middleware/cache'

const router = Router()
const cache24h = cacheMiddleware(24 * 60 * 60)

// Public
router.get('/prospects', cache24h, draftController.getProspects)
router.get('/prospects/:id', cache24h, draftController.getProspect)
router.get('/order', cache24h, draftController.getDraftOrder)

// Auth required
router.get('/boards', authenticate, draftController.getBoards)
router.post('/boards', authenticate, validate(createBoardSchema), draftController.createBoard)
router.get('/boards/:id', authenticate, draftController.getBoard)
router.patch('/boards/:id', authenticate, validate(renameBoardSchema), draftController.renameBoard)
router.put('/boards/:id/rankings', authenticate, validate(replaceRankingsSchema), draftController.replaceRankings)
router.patch('/boards/:id/prospects/:prospectId', authenticate, validate(updateEntrySchema), draftController.updateEntry)
router.post('/boards/:id/reset', authenticate, draftController.resetBoard)
router.delete('/boards/:id', authenticate, draftController.deleteBoard)

export default router
