import Redis from 'ioredis'
import { env } from './env'

const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  retryStrategy: () => null, // don't retry — fail fast so commands don't queue indefinitely
  maxRetriesPerRequest: 0,   // throw immediately if connection unavailable
  connectTimeout: 3000,
})

redis.on('error', () => {}) // suppress unhandled error events

export default redis
