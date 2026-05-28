import type { Request, Response, NextFunction } from 'express'
import redis from '../config/redis'
import { AppError } from './errorHandler'

export function rateLimiter(maxRequests: number, windowSeconds: number) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip ?? 'unknown'
    const key = `rate:${req.path}:${ip}`

    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, windowSeconds)
      if (count > maxRequests) {
        next(new AppError(429, 'Too many requests'))
        return
      }
    } catch {
      // Redis failure — allow request through
    }

    next()
  }
}
