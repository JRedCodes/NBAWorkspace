import { useQuery } from '@tanstack/react-query'
import { playersService } from '../services/players.service'
import type { Player, PlayerStats, PlayerMetrics, FitScore, Contract } from '../types'

export const playerKeys = {
  search: (q: string) => ['players', 'search', q] as const,
  detail: (id: string) => ['players', id] as const,
  stats: (id: string) => ['players', id, 'stats'] as const,
  metrics: (id: string) => ['players', id, 'metrics'] as const,
  fit: (playerId: string, teamId: string) => ['players', playerId, 'fit', teamId] as const,
  fitAll: (id: string) => ['players', id, 'fit', 'all'] as const,
  contract: (id: string) => ['players', id, 'contract'] as const,
  shotchart: (id: string, filters: Record<string, string>) => ['players', id, 'shotchart', filters] as const,
  shotZones: (id: string) => ['players', id, 'shotchart', 'zones'] as const,
}

export function usePlayerSearch(q: string) {
  return useQuery<Player[]>({
    queryKey: playerKeys.search(q),
    queryFn: () => playersService.search(q).then((r) => r.data),
    enabled: q.length >= 2,
  })
}

export function usePlayer(id: string) {
  return useQuery<Player>({
    queryKey: playerKeys.detail(id),
    queryFn: () => playersService.getById(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function usePlayerStats(id: string) {
  return useQuery<PlayerStats[]>({
    queryKey: playerKeys.stats(id),
    queryFn: () => playersService.getStats(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function usePlayerMetrics(id: string) {
  return useQuery<PlayerMetrics>({
    queryKey: playerKeys.metrics(id),
    queryFn: () => playersService.getMetrics(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function usePlayerFit(playerId: string, teamId: string) {
  return useQuery<FitScore>({
    queryKey: playerKeys.fit(playerId, teamId),
    queryFn: () => playersService.getFitForTeam(playerId, teamId).then((r) => r.data),
    enabled: !!playerId && !!teamId,
  })
}

export function usePlayerContract(id: string) {
  return useQuery<Contract>({
    queryKey: playerKeys.contract(id),
    queryFn: () => playersService.getContract(id).then((r) => r.data),
    enabled: !!id,
  })
}
