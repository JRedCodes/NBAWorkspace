import type { Request, Response } from 'express'
import { sseManager } from './sse.manager'

export function initSSEConnection(req: Request, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const userId = req.user?.userId ?? 'anonymous'
  sseManager.add(userId, res)
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

  req.on('close', () => sseManager.remove(userId, res))
}
