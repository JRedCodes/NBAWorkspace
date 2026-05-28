import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tradeService } from '../services/trade.service'
import { useTradeStore } from '../store/tradeStore'
import type { TradeValidationResult, TradeProjectionResult, TradeScenario } from '../types'

export const tradeKeys = {
  scenarios: ['trade', 'scenarios'] as const,
  scenario: (id: string) => ['trade', 'scenarios', id] as const,
}

export function useValidateTrade() {
  const players = useTradeStore((s) => s.players)
  const picks = useTradeStore((s) => s.picks)
  const markFresh = useTradeStore((s) => s.markProjectionFresh)

  return useMutation({
    mutationFn: () =>
      tradeService.validate({
        players: players.map((p) => ({
          playerId: p.playerId,
          fromTeamId: p.fromTeamId,
          toTeamId: p.toTeamId,
        })),
        picks: picks.map((p) => ({
          pickId: p.pickId,
          fromTeamId: p.fromTeamId,
          toTeamId: p.toTeamId,
        })),
      }).then((r) => r.data as TradeValidationResult),
    onSuccess: () => markFresh(),
  })
}

export function useProjectTrade() {
  const players = useTradeStore((s) => s.players)
  const picks = useTradeStore((s) => s.picks)

  return useMutation({
    mutationFn: () =>
      tradeService.project({
        players: players.map((p) => ({
          playerId: p.playerId,
          fromTeamId: p.fromTeamId,
          toTeamId: p.toTeamId,
        })),
        picks: picks.map((p) => ({
          pickId: p.pickId,
          fromTeamId: p.fromTeamId,
          toTeamId: p.toTeamId,
        })),
      }).then((r) => r.data as TradeProjectionResult),
  })
}

export function useScenarios() {
  return useQuery<TradeScenario[]>({
    queryKey: tradeKeys.scenarios,
    queryFn: () => tradeService.getScenarios().then((r) => r.data),
  })
}

export function useScenario(id: string) {
  return useQuery({
    queryKey: tradeKeys.scenario(id),
    queryFn: () => tradeService.getScenario(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateScenario() {
  const queryClient = useQueryClient()
  const players = useTradeStore((s) => s.players)
  const picks = useTradeStore((s) => s.picks)

  return useMutation({
    mutationFn: (name: string) =>
      tradeService.createScenario({
        name,
        players: players.map((p) => ({
          playerId: p.playerId,
          fromTeamId: p.fromTeamId,
          toTeamId: p.toTeamId,
        })),
        picks: picks.map((p) => ({
          pickId: p.pickId,
          fromTeamId: p.fromTeamId,
          toTeamId: p.toTeamId,
        })),
      }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tradeKeys.scenarios }),
  })
}

export function useDeleteScenario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tradeService.deleteScenario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tradeKeys.scenarios }),
  })
}
