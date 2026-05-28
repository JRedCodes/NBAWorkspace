import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'
import { AppError } from './errorHandler'

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const messages = result.error.issues
        .map((e) => `${e.path.map(String).join('.')}: ${e.message}`)
        .join(', ')
      next(new AppError(400, `Validation error: ${messages}`))
      return
    }
    req.body = result.data
    next()
  }
}
