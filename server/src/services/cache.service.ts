import redis from '../config/redis'

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      return value ? (JSON.parse(value) as T) : null
    } catch {
      return null
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch {
      // best-effort — cache miss on next request is acceptable
    }
  },

  async del(...keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) await redis.del(...keys)
    } catch {
      // best-effort
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) await redis.del(...keys)
    } catch {
      // best-effort
    }
  },
}
