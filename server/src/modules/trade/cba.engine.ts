/**
 * CBA Trade Validation Engine
 * Implements NBA Collective Bargaining Agreement salary matching rules.
 *
 * Key rules implemented:
 * - Teams over the cap must match salaries within the 125% + $100K rule
 * - Teams under the cap can absorb salary up to the cap
 * - Hard cap / second apron restrictions
 * - Two-way contracts cannot be traded
 *
 * Reference: Larry Coon's NBA CBA FAQ
 */

export const CBA = {
  SALARY_CAP: 141_000_000,
  LUXURY_TAX_LINE: 172_346_000,
  FIRST_APRON: 178_132_000,    // "soft" hard cap — MLE restrictions
  SECOND_APRON: 188_931_000,   // hard cap — no salary aggregation
}

export interface ContractInfo {
  playerId: string
  teamId: string
  salary: number
  isTwoWay: boolean
  isRookieScale: boolean
}

export interface TeamTradeSlot {
  teamId: string
  outgoing: ContractInfo[]   // players this team is sending
  incoming: ContractInfo[]   // players this team is receiving
}

export interface CBAViolation {
  code: string
  message: string
  teamId?: string
}

export interface CBAResult {
  isValid: boolean
  violations: CBAViolation[]
  teamSummaries: Record<string, TeamTradeSummary>
}

export interface TeamTradeSummary {
  teamId: string
  salaryOut: number
  salaryIn: number
  netChange: number
  isOverCap: boolean
  matchingRequired: boolean
  matchingMax: number        // max salary allowed to absorb
  matchingOk: boolean
}

export function validateTrade(
  teamSlots: TeamTradeSlot[],
  currentPayrolls: Record<string, number>,
): CBAResult {
  const violations: CBAViolation[] = []
  const teamSummaries: Record<string, TeamTradeSummary> = {}

  // --- Pre-checks ---
  for (const slot of teamSlots) {
    // Two-way contracts cannot be traded
    const twoWays = [...slot.outgoing, ...slot.incoming].filter((p) => p.isTwoWay)
    for (const p of twoWays) {
      violations.push({
        code: 'TWO_WAY_NOT_TRADEABLE',
        message: 'Two-way contracts cannot be traded',
        teamId: slot.teamId,
      })
    }

    // Each team must be sending at least one player or pick
    if (slot.outgoing.length === 0 && slot.incoming.length > 0) {
      violations.push({
        code: 'NO_OUTGOING',
        message: 'Every team in a trade must send at least one player',
        teamId: slot.teamId,
      })
    }
  }

  // --- Salary matching ---
  for (const slot of teamSlots) {
    const salaryOut = slot.outgoing.reduce((sum, p) => sum + p.salary, 0)
    const salaryIn = slot.incoming.reduce((sum, p) => sum + p.salary, 0)
    const currentPayroll = currentPayrolls[slot.teamId] ?? 0
    const projectedPayroll = currentPayroll - salaryOut + salaryIn
    const isOverCap = currentPayroll > CBA.SALARY_CAP

    let matchingRequired = isOverCap
    let matchingMax = Infinity
    let matchingOk = true

    if (isOverCap) {
      // 125% rule: can take back up to 125% of outgoing + $100K
      matchingMax = Math.floor(salaryOut * 1.25) + 100_000

      if (salaryIn > matchingMax) {
        matchingOk = false
        violations.push({
          code: 'SALARY_MATCHING_FAILED',
          message: `Taking back $${fmt(salaryIn)} but matching limit is $${fmt(matchingMax)} (125% of $${fmt(salaryOut)} + $100K)`,
          teamId: slot.teamId,
        })
      }
    } else {
      // Under cap: can absorb salary up to the cap
      const roomAvailable = CBA.SALARY_CAP - currentPayroll
      matchingMax = salaryOut + roomAvailable
      if (salaryIn > matchingMax) {
        matchingOk = false
        violations.push({
          code: 'EXCEEDS_CAP_ROOM',
          message: `Would exceed salary cap. Max absorbable: $${fmt(matchingMax)}`,
          teamId: slot.teamId,
        })
      }
    }

    // Hard cap check — second apron
    if (projectedPayroll > CBA.SECOND_APRON) {
      violations.push({
        code: 'SECOND_APRON',
        message: `Projected payroll $${fmt(projectedPayroll)} exceeds second apron ($${fmt(CBA.SECOND_APRON)}). Trade not permissible.`,
        teamId: slot.teamId,
      })
    }

    teamSummaries[slot.teamId] = {
      teamId: slot.teamId,
      salaryOut,
      salaryIn,
      netChange: salaryIn - salaryOut,
      isOverCap,
      matchingRequired,
      matchingMax,
      matchingOk,
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    teamSummaries,
  }
}

function fmt(n: number): string {
  return n.toLocaleString('en-US')
}
