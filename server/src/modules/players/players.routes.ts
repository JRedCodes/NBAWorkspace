import { Router } from 'express'
import { playersController } from './players.controller'
import { cacheMiddleware } from '../../middleware/cache'

const router = Router()
const cache6h = cacheMiddleware(6 * 60 * 60)
const cache24h = cacheMiddleware(24 * 60 * 60)

router.get('/search', cache6h, playersController.search)
router.get('/:playerId', cache6h, playersController.getById)
router.get('/:playerId/stats', cache6h, playersController.getStats)
router.get('/:playerId/metrics', cache6h, playersController.getMetrics)
router.get('/:playerId/fit/all', cache6h, playersController.getFitAll)
router.get('/:playerId/fit/:teamId', cache6h, playersController.getFitForTeam)
router.get('/:playerId/contract', cache6h, playersController.getContract)
router.get('/:playerId/shotchart/zones', cache24h, playersController.getShotZones)
router.get('/:playerId/shotchart', cache24h, playersController.getShotChart)

export default router
