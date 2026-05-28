import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSSE } from '../lib/sse'
import { useAuthStore } from '../store/authStore'
import { teamKeys } from './useTeams'
import { playerKeys } from './usePlayers'

interface WorkerEvent {
  type: 'roster_updated' | 'stats_updated' | 'drift_detected' | 'metrics_updated'
  teamId?: string
  playerId?: string
  scenarioId?: string
}

export function useWorkerUpdates() {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const onEvent = useCallback(
    (data: unknown) => {
      const event = data as WorkerEvent
      switch (event.type) {
        case 'roster_updated':
          if (event.teamId) {
            queryClient.invalidateQueries({ queryKey: teamKeys.roster(event.teamId) })
            queryClient.invalidateQueries({ queryKey: teamKeys.cap(event.teamId) })
            queryClient.invalidateQueries({ queryKey: teamKeys.picks(event.teamId) })
            queryClient.invalidateQueries({ queryKey: teamKeys.needs(event.teamId) })
          }
          queryClient.invalidateQueries({ queryKey: teamKeys.carousel })
          break
        case 'stats_updated':
          queryClient.invalidateQueries({ queryKey: ['players'] })
          queryClient.invalidateQueries({ queryKey: teamKeys.power })
          break
        case 'metrics_updated':
          if (event.playerId) {
            queryClient.invalidateQueries({ queryKey: playerKeys.metrics(event.playerId) })
            queryClient.invalidateQueries({ queryKey: playerKeys.fitAll(event.playerId) })
          }
          break
        case 'drift_detected':
          if (event.scenarioId) {
            queryClient.invalidateQueries({ queryKey: ['trade', 'scenarios', event.scenarioId] })
          }
          break
      }
    },
    [queryClient],
  )

  useSSE(isAuthenticated ? '/api/workers/events' : null, onEvent)
}
