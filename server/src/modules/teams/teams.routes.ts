import { Router } from 'express'
import { teamsController } from './teams.controller'
import { cacheMiddleware } from '../../middleware/cache'

const router = Router()
const cache6h = cacheMiddleware(6 * 60 * 60)

router.get('/', cache6h, teamsController.getAll)
router.get('/league/carousel', cache6h, teamsController.getCarousel)
router.get('/league/power', cache6h, teamsController.getPowerRankings)
router.get('/:teamId', cache6h, teamsController.getById)
router.get('/:teamId/roster', cache6h, teamsController.getRoster)
router.get('/:teamId/staff', cache6h, teamsController.getStaff)
router.get('/:teamId/cap', cache6h, teamsController.getCap)
router.get('/:teamId/cap/future', cache6h, teamsController.getFutureSalaries)
router.get('/:teamId/picks', cache6h, teamsController.getPicks)
router.get('/:teamId/stats', cache6h, teamsController.getStats)
router.get('/:teamId/needs', cache6h, teamsController.getNeeds)
router.post('/:teamId/needs/projected', teamsController.getProjectedNeeds)
router.get('/:teamId/analytics', cache6h, teamsController.getAnalytics)

export default router
