import { Router } from 'express'
import { authController } from './auth.controller'
import { validate } from '../../middleware/validate'
import { authenticate } from '../../middleware/authenticate'
import { rateLimiter } from '../../middleware/rateLimiter'
import { registerSchema, loginSchema, refreshSchema } from './auth.schema'

const router = Router()

router.post('/register', rateLimiter(10, 60), validate(registerSchema), authController.register)
router.post('/login', rateLimiter(20, 60), validate(loginSchema), authController.login)
router.post('/refresh', validate(refreshSchema), authController.refresh)
router.post('/logout', authenticate, authController.logout)
router.patch('/onboarding', authenticate, authController.onboarding)

export default router
