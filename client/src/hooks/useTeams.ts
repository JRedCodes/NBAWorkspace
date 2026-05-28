import { useQuery } from '@tanstack/react-query'
import { teamsService } from '../services/teams.service'
import type { Team, CarouselTeam, TeamNeeds, TeamStats, PowerRanking } from '../types'

export const teamKeys = {
  all: ['teams'] as const,
  carousel: ['teams', 'carousel'] as const,
  power: ['teams', 'power'] as const,
  detail: (id: string) => ['teams', id] as const,
  roster: (id: string) => ['teams', id, 'roster'] as const,
  staff: (id: string) => ['teams', id, 'staff'] as const,
  cap: (id: string) => ['teams', id, 'cap'] as const,
  capFuture: (id: string) => ['teams', id, 'cap', 'future'] as const,
  picks: (id: string) => ['teams', id, 'picks'] as const,
  stats: (id: string) => ['teams', id, 'stats'] as const,
  needs: (id: string) => ['teams', id, 'needs'] as const,
  analytics: (id: string) => ['teams', id, 'analytics'] as const,
}

export function useAllTeams() {
  return useQuery<Team[]>({
    queryKey: teamKeys.all,
    queryFn: () => teamsService.getAll().then((r) => r.data),
  })
}

export function useCarousel() {
  return useQuery<CarouselTeam[]>({
    queryKey: teamKeys.carousel,
    queryFn: () => teamsService.getCarousel().then((r) => r.data),
  })
}

export function usePowerRankings() {
  return useQuery<PowerRanking[]>({
    queryKey: teamKeys.power,
    queryFn: () => teamsService.getAll().then((r) => r.data),
  })
}

export function useTeam(id: string) {
  return useQuery<Team>({
    queryKey: teamKeys.detail(id),
    queryFn: () => teamsService.getById(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useRoster(teamId: string) {
  return useQuery({
    queryKey: teamKeys.roster(teamId),
    queryFn: () => teamsService.getRoster(teamId).then((r) => r.data),
    enabled: !!teamId,
  })
}

export function useTeamStats(teamId: string) {
  return useQuery<TeamStats>({
    queryKey: teamKeys.stats(teamId),
    queryFn: () => teamsService.getStats(teamId).then((r) => r.data),
    enabled: !!teamId,
  })
}

export function useTeamNeeds(teamId: string) {
  return useQuery<TeamNeeds>({
    queryKey: teamKeys.needs(teamId),
    queryFn: () => teamsService.getNeeds(teamId).then((r) => r.data),
    enabled: !!teamId,
  })
}

export function useTeamAnalytics(teamId: string) {
  return useQuery({
    queryKey: teamKeys.analytics(teamId),
    queryFn: () => teamsService.getAnalytics(teamId).then((r) => r.data),
    enabled: !!teamId,
  })
}

export function useTeamCap(teamId: string) {
  return useQuery({
    queryKey: teamKeys.cap(teamId),
    queryFn: () => teamsService.getCap(teamId).then((r) => r.data),
    enabled: !!teamId,
  })
}

export function useTeamPicks(teamId: string) {
  return useQuery({
    queryKey: teamKeys.picks(teamId),
    queryFn: () => teamsService.getPicks(teamId).then((r) => r.data),
    enabled: !!teamId,
  })
}
