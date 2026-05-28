import { Router } from 'express'
import { tradeController } from './trade.controller'
import { validate } from '../../middleware/validate'
import { authenticate } from '../../middleware/authenticate'
import { validateTradeSchema, projectTradeSchema, createScenarioSchema, updateScenarioSchema } from './trade.schema'

const router = Router()

// Stateless — no auth required
router.post('/validate', validate(validateTradeSchema), tradeController.validate)
router.post('/project', validate(projectTradeSchema), tradeController.project)

// Scenario CRUD — auth required
router.get('/scenarios', authenticate, tradeController.getScenarios)
router.post('/scenarios', authenticate, validate(createScenarioSchema), tradeController.createScenario)
router.get('/scenarios/:id', authenticate, tradeController.getScenario)
router.patch('/scenarios/:id', authenticate, validate(updateScenarioSchema), tradeController.updateScenario)
router.post('/scenarios/:id/duplicate', authenticate, tradeController.duplicateScenario)
router.delete('/scenarios/:id', authenticate, tradeController.deleteScenario)

export default router
