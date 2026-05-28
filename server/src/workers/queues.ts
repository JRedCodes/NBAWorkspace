import { Queue } from 'bullmq'

const redisUrl = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379')
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || '6379'),
}

export const rosterIngestQueue = new Queue('roster-ingest', { connection })
export const statsIngestQueue = new Queue('stats-ingest', { connection })
export const shotchartIngestQueue = new Queue('shotchart-ingest', { connection })
export const prospectsIngestQueue = new Queue('prospects-ingest', { connection })
export const picksIngestQueue = new Queue('picks-ingest', { connection })
export const metricsComputeQueue = new Queue('metrics-compute', { connection })
export const fitScoresQueue = new Queue('fit-scores', { connection })
export const powerRankingsQueue = new Queue('power-rankings', { connection })
export const prospectScoresQueue = new Queue('prospect-scores', { connection })
export const driftDetectionQueue = new Queue('drift-detection', { connection })
export const simulationQueue = new Queue('simulation', { connection })
