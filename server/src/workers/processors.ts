import { Worker } from 'bullmq'
import { workerBridge } from './workerBridge'

const redisUrl = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379')
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || '6379'),
}

new Worker(
  'drift-detection',
  async (job) => {
    await workerBridge.run('detect_drift.py', job.data)
  },
  { connection },
)

new Worker(
  'simulation',
  async (job) => {
    await workerBridge.run('run_simulation.py', job.data)
  },
  { connection },
)

new Worker(
  'metrics-compute',
  async (job) => {
    await workerBridge.run('compute_player_metrics.py', job.data)
  },
  { connection },
)
