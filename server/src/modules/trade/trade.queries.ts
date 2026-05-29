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
    players: { playerId: string; fromTeamId: string; toTeamId: string }[] = [],
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

    // Store individual player legs for later reconstruction
    if (players.length > 0) {
      await db('trade_scenario_players').insert(
        players.map((p) => ({
          scenario_id: row.id,
          player_id: p.playerId,
          from_team_id: p.fromTeamId,
          to_team_id: p.toTeamId,
        })),
      )
    }

    return row
  },

  getScenarioLegs(scenarioId: string) {
    return db('trade_scenario_players as tsp')
      .join('players as p', 'tsp.player_id', 'p.id')
      .join('contracts as c', 'c.player_id', 'p.id')
      .join('teams as ft', 'tsp.from_team_id', 'ft.id')
      .join('teams as tt', 'tsp.to_team_id', 'tt.id')
      .where('tsp.scenario_id', scenarioId)
      .select(
        'p.id as player_id',
        db.raw("p.first_name || ' ' || p.last_name as player_name"),
        'c.current_year_salary as salary',
        'tsp.from_team_id',
        'ft.name as from_team_name',
        'ft.abbreviation as from_team_abbr',
        'tsp.to_team_id',
        'tt.name as to_team_name',
        'tt.abbreviation as to_team_abbr',
      )
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
