import redis from '../config/redis'

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    return value ? (JSON.parse(value) as T) : null
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  },

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) await redis.del(...keys)
  },

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  },
}
