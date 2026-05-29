import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tradeService } from '../services/trade.service'
import { useTradeStore } from '../store/tradeStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import type { TradeValidationResult, TradeProjectionResult, TradeScenario } from '../types'

export const tradeKeys = {
  scenarios: ['trade', 'scenarios'] as const,
  scenario: (id: string) => ['trade', 'scenarios', id] as const,
}

interface TradeLegPayload {
  playerId: string
  fromTeamId: string
  toTeamId: string
}

interface PickLegPayload {
  pickId: string
  fromTeamId: string
  toTeamId: string
}

export function useValidateTrade() {
  return useMutation({
    mutationFn: (payload: { players: TradeLegPayload[]; picks?: PickLegPayload[] }) =>
      tradeService.validate(payload).then((r) => r.data as TradeValidationResult),
  })
}

export function useProjectTrade() {
  const workspaceLegs = useWorkspaceStore((s) => s.tradeLegs)
  const livePlayers = useTradeStore((s) => s.players)
  const players = workspaceLegs.length > 0 ? workspaceLegs : livePlayers

  return useMutation({
    mutationFn: () =>
      tradeService.project({
        players: players.map((p) => ({
          playerId: p.playerId,
          fromTeamId: p.fromTeamId,
          toTeamId: p.toTeamId,
        })),
        picks: [],
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
  const workspaceLegs = useWorkspaceStore((s) => s.tradeLegs)
  const livePlayers = useTradeStore((s) => s.players)
  const players = workspaceLegs.length > 0 ? workspaceLegs : livePlayers

  return useMutation({
    mutationFn: (name: string) =>
      tradeService.createScenario({
        name,
        players: players.map((p) => ({
          playerId: p.playerId,
          fromTeamId: p.fromTeamId,
          toTeamId: p.toTeamId,
        })),
        picks: [],
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

/**
 * Loads a saved scenario's player legs into workspaceStore so they
 * surface in the team view projection banner without needing the
 * trade machine to be open.
 */
export function useActivateScenario() {
  const setTradeLegs = useWorkspaceStore((s) => s.setTradeLegs)
  const setActiveScenario = useWorkspaceStore((s) => s.setActiveScenario)
  const clearTrade = useWorkspaceStore((s) => s.clearTrade)

  return useMutation({
    mutationFn: async (scenarioId: string) => {
      const { data: legs } = await tradeService.getScenarioLegs(scenarioId)
      return { scenarioId, legs }
    },
    onSuccess: ({ scenarioId, legs }) => {
      const tradelegs = (legs as {
        player_id: string
        player_name: string
        salary: number
        from_team_id: string
        from_team_name: string
        to_team_id: string
        to_team_name: string
      }[]).map((l) => ({
        playerId: l.player_id,
        playerName: l.player_name,
        salary: Number(l.salary),
        fromTeamId: l.from_team_id,
        fromTeamName: l.from_team_name,
        toTeamId: l.to_team_id,
        toTeamName: l.to_team_name,
      }))
      setTradeLegs(tradelegs)
      setActiveScenario(scenarioId)
    },
  })
}

export function useDeactivateScenario() {
  const clearTrade = useWorkspaceStore((s) => s.clearTrade)
  return () => clearTrade()
}
