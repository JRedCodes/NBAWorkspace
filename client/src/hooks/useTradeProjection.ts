import { useEffect } from 'react'
import { useTradeStore } from '../store/tradeStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { useProjectTrade } from './useTrade'
import type { TradeLeg } from '../store/tradeStore'

/**
 * Returns projected trade data for a specific team.
 * Sources checked in order:
 *   1. workspaceStore.tradeLegs — loaded from a saved scenario ("Activate")
 *   2. tradeStore.players — live trade machine state
 */
export function useTradeProjection(teamId: string) {
  const livePlayers = useTradeStore((s) => s.players)
  const isProjectionStale = useTradeStore((s) => s.isProjectionStale)
  const workspaceLegs = useWorkspaceStore((s) => s.tradeLegs)
  const project = useProjectTrade()

  // Prefer workspace legs (from activated scenario) over live trade machine state
  const players: TradeLeg[] = workspaceLegs.length > 0 ? workspaceLegs : livePlayers

  const teamInvolved = players.some(
    (p) => p.fromTeamId === teamId || p.toTeamId === teamId,
  )

  useEffect(() => {
    if (teamInvolved && (isProjectionStale || !project.data) && players.length >= 1) {
      project.mutate()
    }
  }, [teamInvolved, isProjectionStale, players.length])

  if (!teamInvolved || !project.data) return null

  const teamProjection = project.data.projection[teamId]
  const teamSummary = project.data.validation.teamSummaries[teamId]

  if (!teamProjection) return null

  return {
    isValid: project.data.validation.isValid,
    scenarioName: useWorkspaceStore.getState().activeScenarioId ? 'saved scenario' : 'active trade',
    violations: project.data.validation.violations.filter((v) => v.teamId === teamId || !v.teamId),
    playersOut: teamProjection.playersOut,
    playersIn: teamProjection.playersIn,
    projectedPayroll: teamProjection.projectedPayroll,
    salaryOut: teamSummary?.salaryOut ?? 0,
    salaryIn: teamSummary?.salaryIn ?? 0,
    netChange: teamSummary?.netChange ?? 0,
  }
}
