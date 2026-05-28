import Redis from 'ioredis'
import { env } from './env'

const redis = new Redis(env.REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: true,
})

redis.on('error', (err) => console.error('Redis error:', err))

export default redis
