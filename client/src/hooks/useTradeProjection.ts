import { useEffect } from 'react'
import { useTradeStore } from '../store/tradeStore'
import { useProjectTrade } from './useTrade'

/**
 * Returns projected trade data for a specific team if that team is
 * involved in the current active trade scenario. Returns null otherwise.
 */
export function useTradeProjection(teamId: string) {
  const players = useTradeStore((s) => s.players)
  const isProjectionStale = useTradeStore((s) => s.isProjectionStale)
  const project = useProjectTrade()

  const teamInvolved = players.some(
    (p) => p.fromTeamId === teamId || p.toTeamId === teamId,
  )

  // Auto-project when this team is involved and data is stale
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
    violations: project.data.validation.violations.filter((v) => v.teamId === teamId || !v.teamId),
    playersOut: teamProjection.playersOut,
    playersIn: teamProjection.playersIn,
    projectedPayroll: teamProjection.projectedPayroll,
    salaryOut: teamSummary?.salaryOut ?? 0,
    salaryIn: teamSummary?.salaryIn ?? 0,
    netChange: teamSummary?.netChange ?? 0,
  }
}
