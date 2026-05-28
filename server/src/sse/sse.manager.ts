import type { Response } from 'express'

interface SSEClient {
  userId: string
  res: Response
}

const clients = new Map<string, SSEClient[]>()

export const sseManager = {
  add(userId: string, res: Response): void {
    const existing = clients.get(userId) ?? []
    clients.set(userId, [...existing, { userId, res }])
  },

  remove(userId: string, res: Response): void {
    const existing = clients.get(userId) ?? []
    clients.set(userId, existing.filter((c) => c.res !== res))
  },

  send(userId: string, event: string, data: unknown): void {
    const userClients = clients.get(userId) ?? []
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    userClients.forEach((c) => c.res.write(payload))
  },

  broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    clients.forEach((userClients) => userClients.forEach((c) => c.res.write(payload)))
  },
}
