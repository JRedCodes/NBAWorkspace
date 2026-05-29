import { Router } from 'express'
import { workspaceController } from './workspace.controller'
import { authenticate } from '../../middleware/authenticate'

const router = Router()

router.get('/', authenticate, workspaceController.getWorkspace)
router.post('/reset', authenticate, workspaceController.resetWorkspace)

export default router
