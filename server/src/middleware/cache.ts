import type { Request, Response, NextFunction } from 'express'
import redis from '../config/redis'

export function cacheMiddleware(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `http:${req.path}:${JSON.stringify(req.query)}`

    try {
      const cached = await redis.get(key)
      if (cached) {
        res.json(JSON.parse(cached))
        return
      }
    } catch {
      // Cache miss on error — continue to handler
    }

    const originalJson = res.json.bind(res)
    res.json = (body) => {
      redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(console.error)
      return originalJson(body)
    }
    next()
  }
}
