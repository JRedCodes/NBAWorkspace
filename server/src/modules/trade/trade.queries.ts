import db from '../../config/db'

export const tradeQueries = {
  getPlayerContracts(playerIds: string[]) {
    return db('contracts as c')
      .join('players as p', 'c.player_id', 'p.id')
      .whereIn('c.player_id', playerIds)
      .select(
        'c.player_id', 'c.team_id', 'c.current_year_salary',
        'c.annual_value', 'c.years_remaining',
        'c.has_player_option', 'c.has_team_option',
        'c.is_two_way', 'c.is_rookie_scale', 'c.is_max',
        'p.first_name', 'p.last_name',
      )
  },

  getTeamCapSheet(teamId: string) {
    return db('team_cap_sheet').where({ team_id: teamId }).orderBy('season_year', 'desc').first()
  },

  getTeamRosterSalaries(teamId: string) {
    return db('contracts')
      .where({ team_id: teamId })
      .sum('current_year_salary as total')
      .first()
  },

  getScenariosByWorkspace(workspaceId: string) {
    return db('trade_scenarios')
      .where({ workspace_id: workspaceId })
      .orderBy('updated_at', 'desc')
      .select('id', 'name', 'status', 'is_valid', 'has_drift', 'saved_at', 'updated_at')
  },

  getScenarioById(id: string) {
    return db('trade_scenarios').where({ id }).first()
  },

  async createScenario(
    workspaceId: string,
    name: string,
    snapshotRoster: object,
    snapshotContracts: object,
    snapshotPicks: object,
  ) {
    const [row] = await db('trade_scenarios')
      .insert({
        workspace_id: workspaceId,
        name,
        status: 'draft',
        snapshot_roster: JSON.stringify(snapshotRoster),
        snapshot_contracts: JSON.stringify(snapshotContracts),
        snapshot_picks: JSON.stringify(snapshotPicks),
        saved_at: db.fn.now(),
      })
      .returning('*')
    return row
  },

  updateScenario(id: string, data: { name?: string; is_valid?: boolean }) {
    return db('trade_scenarios').where({ id }).update({ ...data, updated_at: db.fn.now() })
  },

  deleteScenario(id: string) {
    return db('trade_scenarios').where({ id }).delete()
  },

  getDriftAlerts(scenarioId: string) {
    return db('drift_alerts')
      .where({ scenario_id: scenarioId, is_resolved: false })
      .orderBy('detected_at', 'desc')
  },

  getUserWorkspaceId(userId: string) {
    return db('workspaces').where({ user_id: userId }).select('id').first()
  },
}
