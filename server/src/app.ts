import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './modules/auth/auth.routes'
import teamsRoutes from './modules/teams/teams.routes'
import playersRoutes from './modules/players/players.routes'
import tradeRoutes from './modules/trade/trade.routes'
import draftRoutes from './modules/draft/draft.routes'
import analyticsRoutes from './modules/analytics/analytics.routes'
import simulationRoutes from './modules/simulation/simulation.routes'
import workspaceRoutes from './modules/workspace/workspace.routes'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/teams', teamsRoutes)
app.use('/api/players', playersRoutes)
app.use('/api/trade', tradeRoutes)
app.use('/api/draft', draftRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/simulation', simulationRoutes)
app.use('/api/workspace', workspaceRoutes)

app.use(errorHandler)

export default app
